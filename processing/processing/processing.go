package processing

import (
	"sync"

	"github.com/go-pg/pg/v10"
	databasePackage "github.com/karlsen-network/karlsen-graph-inspector/processing/database"
	"github.com/karlsen-network/karlsen-graph-inspector/processing/database/model"
	configPackage "github.com/karlsen-network/karlsen-graph-inspector/processing/infrastructure/config"
	"github.com/karlsen-network/karlsen-graph-inspector/processing/infrastructure/logging"
	"github.com/karlsen-network/karlsen-graph-inspector/processing/infrastructure/tools"
	karlsendPackage "github.com/karlsen-network/karlsen-graph-inspector/processing/karlsend"
	"github.com/karlsen-network/karlsen-graph-inspector/processing/processing/batch"
	versionPackage "github.com/karlsen-network/karlsen-graph-inspector/processing/version"
	"github.com/karlsen-network/karlsend/v2/domain/consensus/model/externalapi"
	"github.com/karlsen-network/karlsend/v2/domain/consensus/utils/consensushashing"
	"github.com/karlsen-network/karlsend/v2/infrastructure/db/database"
	"github.com/karlsen-network/karlsend/v2/version"
	"github.com/pkg/errors"
)

var log = logging.Logger()

type Processing struct {
	config    *configPackage.Config
	database  *databasePackage.Database
	karlsend  *karlsendPackage.Karlsend
	appConfig *model.AppConfig

	sync.Mutex
}

func NewProcessing(config *configPackage.Config,
	database *databasePackage.Database, karlsend *karlsendPackage.Karlsend) (*Processing, error) {

	appConfig := &model.AppConfig{
		ID:                true,
		KarlsendVersion:   version.Version(),
		ProcessingVersion: versionPackage.Version(),
		Network:           config.ActiveNetParams.Name,
	}

	processing := &Processing{
		config:    config,
		database:  database,
		karlsend:  karlsend,
		appConfig: appConfig,
	}
	processing.initConsensusEventsHandler()

	err := processing.RegisterAppConfig()
	if err != nil {
		return nil, err
	}

	err = processing.ResyncDatabase()
	if err != nil {
		return nil, err
	}

	return processing, nil
}

func (p *Processing) initConsensusEventsHandler() {
	go func() {
		for {
			consensusEvent, ok := <-p.karlsend.Domain().ConsensusEventsChannel()
			if !ok {
				return
			}
			switch event := consensusEvent.(type) {
			case *externalapi.VirtualChangeSet:
				err := p.ProcessVirtualChange(event)
				if err != nil {
					logging.LogErrorAndExit("Failed to process virtual change consensus event: %s", err)
				}
			case *externalapi.BlockAdded:
				log.Debugf("Consensus event handler gets block %s", consensushashing.BlockHash(event.Block))
				err := p.ProcessBlock(event.Block)
				if err != nil {
					logging.LogErrorAndExit("Failed to process block added consensus event: %s", err)
				}
			default:
				logging.LogErrorAndExit("Failed to process consensus event: %s", errors.Errorf("Got event of unsupported type %T", consensusEvent))
			}
		}
	}()
}

func (p *Processing) RegisterAppConfig() error {
	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Registering app config")
		defer log.Infof("Finished registering app config")

		return p.database.StoreAppConfig(databaseTransaction, p.appConfig)
	})
}

func (p *Processing) ResyncDatabase() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		log.Infof("Resyncing database")
		defer log.Infof("Finished resyncing database")

		pruningPointHash, err := p.karlsend.Domain().Consensus().PruningPoint()
		if err != nil {
			return err
		}

		pruningPointBlock, _, err := p.karlsend.Domain().Consensus().GetBlock(pruningPointHash)
		if err != nil {
			return err
		}

		hasPruningBlock, err := p.database.DoesBlockExist(databaseTransaction, pruningPointHash)
		if err != nil {
			return err
		}

		keepDatabase := hasPruningBlock && !p.config.ClearDB
		if keepDatabase {
			// The prunning block is already in the database
			// so we keep the database as it is and sync the new blocks
			log.Infof("Prunning point %s already in the database", pruningPointHash)
			log.Infof("Database kept")

			pruningBlockHeight, err := p.database.BlockHeightByHash(databaseTransaction, pruningPointHash)
			if err != nil {
				return err
			}

			log.Infof("Loading cache")
			p.database.LoadCache(databaseTransaction, pruningBlockHeight)
			log.Infof("Cache loaded from the database")
		} else {
			// The prunning block was not found in the database
			// so we start from scratch.
			err = p.database.Clear(databaseTransaction)
			if err != nil {
				return err
			}
			log.Infof("Database cleared")

			pruningPointDatabaseBlock := &model.Block{
				BlockHash:                      pruningPointHash.String(),
				Timestamp:                      pruningPointBlock.Header.TimeInMilliseconds(),
				ParentIDs:                      []uint64{},
				Height:                         0,
				HeightGroupIndex:               0,
				SelectedParentID:               nil,
				Color:                          model.ColorGray,
				IsInVirtualSelectedParentChain: true,
				MergeSetRedIDs:                 []uint64{},
				MergeSetBlueIDs:                []uint64{},
			}
			err = p.database.InsertBlock(databaseTransaction, pruningPointHash, pruningPointDatabaseBlock)
			if err != nil {
				return err
			}
			heightGroup := &model.HeightGroup{
				Height: 0,
				Size:   1,
			}
			err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
			if err != nil {
				return err
			}
			log.Infof("Pruning point %s has been added to the database", pruningPointHash)
		}

		headersSelectedTip, err := p.karlsend.Domain().Consensus().GetHeadersSelectedTip()
		if err != nil {
			return err
		}
		log.Infof("Load node blocks")
		hashesBetweenPruningPointAndHeadersSelectedTip, _, err := p.karlsend.Domain().Consensus().GetHashesBetween(pruningPointHash, headersSelectedTip, 0)
		if err != nil {
			return err
		}
		log.Infof("Node blocks loaded")

		startIndex := int(0)
		if keepDatabase {
			// Special case occuring when launching a version of KGI supporting DAA scores on a
			// database freshly migrated and introducing DAA scores.
			pruningPointID, err := p.database.BlockIDByHash(databaseTransaction, pruningPointHash)
			if err != nil {
				return err
			}
			pruningPointDatabaseBlock, err := p.database.GetBlock(databaseTransaction, pruningPointID)
			if err != nil {
				return err
			}
			noDAAScoreCount, err := p.database.BlockCountAtDAAScore(databaseTransaction, 0)
			if err != nil {
				return err
			}
			if pruningPointDatabaseBlock.DAAScore == 0 && noDAAScoreCount > uint32(p.config.NetParams().K) {
				log.Infof("Updating DAA score of %d blocks in the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))
				blockIDsToDAAScores, err := p.getBlocksDAAScores(databaseTransaction, hashesBetweenPruningPointAndHeadersSelectedTip)
				log.Infof("DAA scores of %d blocks collected", len(blockIDsToDAAScores))
				if err != nil {
					return err
				}
				err = p.database.UpdateBlockDAAScores(databaseTransaction, blockIDsToDAAScores)
				if err != nil {
					return err
				}
				log.Infof("DAA scores of %d blocks stored in the database", len(blockIDsToDAAScores))
			}
			// End of special case

			log.Infof("Syncing %d blocks with the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))
			if !p.config.Resync {
				startIndex, err = p.database.FindLatestStoredBlockIndex(databaseTransaction, hashesBetweenPruningPointAndHeadersSelectedTip)
				if err != nil {
					return err
				}
				log.Infof("First %d blocks already exist in the database", startIndex)
				// We start from an earlier point (~ 10 minutes) to make sure we didn't miss any mutation
				startIndex = tools.Max(startIndex-600, 0)
			}
		} else {
			log.Infof("Adding %d blocks to the database", len(hashesBetweenPruningPointAndHeadersSelectedTip))
		}

		totalToAdd := len(hashesBetweenPruningPointAndHeadersSelectedTip) - startIndex
		for i := startIndex; i < len(hashesBetweenPruningPointAndHeadersSelectedTip); i++ {
			blockHash := hashesBetweenPruningPointAndHeadersSelectedTip[i]
			block, err := p.karlsend.Domain().Consensus().GetBlockEvenIfHeaderOnly(blockHash)
			if err != nil {
				return err
			}
			err = p.processBlockAndDependencies(databaseTransaction, blockHash, block, pruningPointBlock)
			if err != nil {
				return err
			}

			addedCount := i + 1 - startIndex
			if addedCount%1000 == 0 || addedCount == totalToAdd {
				log.Infof("Added %d/%d blocks to the database", addedCount, totalToAdd)
			}
		}

		return p.resyncVirtualSelectedParentChain(databaseTransaction, false)
	})
}

func (p *Processing) ResyncVirtualSelectedParentChain() error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.resyncVirtualSelectedParentChain(databaseTransaction, false)
	})
}

func (p *Processing) resyncVirtualSelectedParentChain(databaseTransaction *pg.Tx, withDependencies bool) error {
	log.Infof("Resyncing virtual selected parent chain")
	defer log.Infof("Finished resyncing virtual selected parent chain")

	highestBlockVirtualSelectedParentChain, err := p.database.HighestBlockInVirtualSelectedParentChain(databaseTransaction)
	if err != nil {
		return errors.Wrapf(err, "Could not get highest block in virtual selected parent chain")
	}
	highestBlockHash, err := externalapi.NewDomainHashFromString(highestBlockVirtualSelectedParentChain.BlockHash)
	if err != nil {
		return err
	}
	log.Infof("Resyncing virtual selected parent chain from block %s", highestBlockHash)

	virtualSelectedParentChain, err := p.karlsend.Domain().Consensus().GetVirtualSelectedParentChainFromBlock(highestBlockHash)
	if err != nil {
		if database.IsNotFoundError(err) {
			// This may occur when restoring a kgi database on a system which karlsend database
			// is older than the kgi database.
			log.Errorf("Could not get virtual selected parent chain from block %s: %s", highestBlockHash, err)
			return nil
		}
		// We ignore the error.
		return nil
	}
	if len(virtualSelectedParentChain.Added) > 0 {
		virtualSelectedParentHash := virtualSelectedParentChain.Added[len(virtualSelectedParentChain.Added)-1]
		virtualSelectedParentBlock, _, err := p.karlsend.Domain().Consensus().GetBlock(virtualSelectedParentHash)
		if err != nil {
			return err
		}
		blockInsertionResult := &externalapi.VirtualChangeSet{
			VirtualSelectedParentChainChanges: virtualSelectedParentChain,
		}
		if withDependencies {
			err = p.processBlockAndDependencies(databaseTransaction, virtualSelectedParentHash, virtualSelectedParentBlock, nil)
			if err != nil {
				return err
			}
		}
		err = p.processVirtualChange(databaseTransaction, blockInsertionResult, withDependencies)
		if err != nil {
			return err
		}
		log.Infof("Updated the virtual selected parent chain")
	}
	return nil
}

func (p *Processing) ProcessBlock(block *externalapi.DomainBlock) error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processBlockAndDependencies(databaseTransaction, consensushashing.BlockHash(block), block, nil)
	})
}

// processBlockAndDependencies processes `block` and all its missing dependencies
func (p *Processing) processBlockAndDependencies(databaseTransaction *pg.Tx, hash *externalapi.DomainHash,
	block, pruningBlock *externalapi.DomainBlock) error {

	batch := batch.New(p.database, p.karlsend, pruningBlock)
	err := batch.CollectBlockAndDependencies(databaseTransaction, hash, block)
	if err != nil {
		return err
	}
	for {
		_, block, ok := batch.Pop()
		if !ok {
			break
		}
		if !batch.Empty() {
			log.Warnf("Handling missing dependency block %s", consensushashing.BlockHash(block))
		}
		err = p.processBlock(databaseTransaction, block)
		if err != nil {
			return err
		}
	}
	return nil
}

func (p *Processing) processBlock(databaseTransaction *pg.Tx, block *externalapi.DomainBlock) error {

	blockHash := consensushashing.BlockHash(block)
	log.Debugf("Processing block %s", blockHash)
	defer log.Debugf("Finished processing block %s", blockHash)

	isIncompleteBlock := false
	blockExists, err := p.database.DoesBlockExist(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not check if block %s does exist in database", blockHash)
	}
	if !blockExists {
		parentHashes := block.Header.DirectParents()
		existingParentHashes := make([]*externalapi.DomainHash, 0, len(parentHashes))
		for _, parentHash := range parentHashes {
			parentExists, err := p.database.DoesBlockExist(databaseTransaction, parentHash)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not check if parent %s for block %s does exist in database", parentHash, blockHash)
			}
			if !parentExists {
				log.Warnf("Parent %s for block %s does not exist in the database", parentHash, blockHash)
				isIncompleteBlock = true
				continue
			}
			existingParentHashes = append(existingParentHashes, parentHash)
		}

		parentIDs, parentHeights, err := p.database.BlockIDsAndHeightsByHashes(databaseTransaction, existingParentHashes)
		if err != nil {
			return errors.Errorf("Could not resolve "+
				"parent IDs for block %s: %s", blockHash, err)
		}

		blockHeight := uint64(0)
		for _, height := range parentHeights {
			blockHeight = tools.Max(blockHeight, height+1)
		}

		heightGroupSize, err := p.database.HeightGroupSize(databaseTransaction, blockHeight)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not resolve group size for highest parent height %d for block %s", blockHeight, blockHash)
		}
		blockHeightGroupIndex := heightGroupSize

		databaseBlock := &model.Block{
			BlockHash:                      blockHash.String(),
			Timestamp:                      block.Header.TimeInMilliseconds(),
			ParentIDs:                      parentIDs,
			Height:                         blockHeight,
			HeightGroupIndex:               blockHeightGroupIndex,
			SelectedParentID:               nil,
			Color:                          model.ColorGray,
			IsInVirtualSelectedParentChain: false,
			MergeSetRedIDs:                 []uint64{},
			MergeSetBlueIDs:                []uint64{},
			DAAScore:                       block.Header.DAAScore(),
		}
		err = p.database.InsertBlock(databaseTransaction, blockHash, databaseBlock)
		if err != nil {
			return errors.Wrapf(err, "Could not insert block %s", blockHash)
		}

		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not get id for block %s", blockHash)
		}
		heightGroup := &model.HeightGroup{
			Height: blockHeight,
			Size:   blockHeightGroupIndex + 1,
		}
		err = p.database.InsertOrUpdateHeightGroup(databaseTransaction, heightGroup)
		if err != nil {
			// enhanced error description
			return errors.Wrapf(err, "Could not insert or update height group %d for block %s", blockHeight, blockHash)
		}

		for _, parentID := range parentIDs {
			parentHeight, err := p.database.BlockHeight(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get block height of parent id %d for block %s", parentID, blockHash)
			}
			parentHeightGroupIndex, err := p.database.BlockHeightGroupIndex(databaseTransaction, parentID)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not get height group index of parent id %d for block %s", parentID, blockHash)
			}
			edge := &model.Edge{
				FromBlockID:          blockID,
				ToBlockID:            parentID,
				FromHeight:           blockHeight,
				ToHeight:             parentHeight,
				FromHeightGroupIndex: blockHeightGroupIndex,
				ToHeightGroupIndex:   parentHeightGroupIndex,
			}
			err = p.database.InsertEdge(databaseTransaction, edge)
			if err != nil {
				// enhanced error description
				return errors.Wrapf(err, "Could not insert edge from block %s to parent id %d", blockHash, parentID)
			}
		}
	} else {
		log.Debugf("Block %s already exists in database; not processed", blockHash)
	}

	blockInfo, err := p.karlsend.Domain().Consensus().GetBlockInfo(blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not get block info for block %s", blockHash)
	}
	if blockInfo.BlockStatus == externalapi.StatusHeaderOnly || isIncompleteBlock {
		return nil
	}

	blockGHOSTDAGData, err := p.karlsend.BlockGHOSTDAGData(blockHash)
	if err != nil {
		return errors.Wrapf(err, "Could not get GHOSTDAG data for block %s", blockHash)
	}
	selectedParentID, err := p.database.BlockIDByHash(databaseTransaction, blockGHOSTDAGData.SelectedParent())
	if err != nil {
		return errors.Wrapf(err, "Could not get selected parent block ID for block %s",
			blockGHOSTDAGData.SelectedParent())
	}
	blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not get id for block %s", blockHash)
	}
	err = p.database.UpdateBlockSelectedParent(databaseTransaction, blockID, selectedParentID)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update selected parent for block %s", blockHash)
	}

	mergeSetRedIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetReds())
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set reds for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		// Update 2022-04-22: processBlockAndDependencies should solve the issue
		log.Errorf("Could not get ids of merge set reds for block %s: %s", blockHash, blockGHOSTDAGData.MergeSetReds())
	}
	mergeSetBlueIDs, err := p.database.BlockIDsByHashes(databaseTransaction, blockGHOSTDAGData.MergeSetBlues())
	if err != nil {
		// enhanced error description
		// return errors.Wrapf(err, "Could not get ids of merge set blues for block %s", blockHash)

		// Let's ignore this error temporarily and just report it in the log
		// This occures sometimes when the app was fresly started, at the end or just after ResyncDatabase
		// The actual conditions and the way to solve this has to be determined yet.
		// Update 2022-04-22: processBlockAndDependencies should solve the issue
		log.Errorf("Could not get ids of merge set blues for block %s: %s", blockHash, blockGHOSTDAGData.MergeSetBlues())
	}
	err = p.database.UpdateBlockMergeSet(databaseTransaction, blockID, mergeSetRedIDs, mergeSetBlueIDs)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update merge sets colors for block %s", blockHash)
	}

	return nil
}

func (p *Processing) ProcessVirtualChange(blockInsertionResult *externalapi.VirtualChangeSet) error {
	p.Lock()
	defer p.Unlock()

	return p.database.RunInTransaction(func(databaseTransaction *pg.Tx) error {
		return p.processVirtualChange(databaseTransaction, blockInsertionResult, true)
	})
}

func (p *Processing) processVirtualChange(databaseTransaction *pg.Tx, blockInsertionResult *externalapi.VirtualChangeSet, withDependencies bool) error {
	if blockInsertionResult == nil || blockInsertionResult.VirtualSelectedParentChainChanges == nil {
		return nil
	}

	blockColors := make(map[uint64]string)
	blockIsInVirtualSelectedParentChain := make(map[uint64]bool)
	removedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Removed
	if len(removedBlockHashes) > 0 {
		for _, removedBlockHash := range removedBlockHashes {
			removedBlockID, err := p.database.BlockIDByHash(databaseTransaction, removedBlockHash)
			if err == nil {
				blockColors[removedBlockID] = model.ColorGray
				blockIsInVirtualSelectedParentChain[removedBlockID] = false
			} else if withDependencies {
				log.Errorf("Could not get id of removed block %s", removedBlockHash)
			}
		}
	}

	addedBlockHashes := blockInsertionResult.VirtualSelectedParentChainChanges.Added
	if len(addedBlockHashes) > 0 {
		for _, addedBlockHash := range addedBlockHashes {
			addedBlockID, err := p.database.BlockIDByHash(databaseTransaction, addedBlockHash)
			if err == nil {
				blockIsInVirtualSelectedParentChain[addedBlockID] = true
			} else if withDependencies {
				log.Errorf("Could not get id of added block %s", addedBlockHash)
			}
		}
	}
	err := p.database.UpdateBlockIsInVirtualSelectedParentChain(databaseTransaction, blockIsInVirtualSelectedParentChain)
	if err != nil {
		// enhanced error description
		return errors.Wrapf(err, "Could not update blocks in virtual selected parent chain for block %s", nil)
	}

	for _, addedBlockHash := range addedBlockHashes {
		addedBlockGHOSTDAGData, err := p.karlsend.BlockGHOSTDAGData(addedBlockHash)
		if err != nil {
			return errors.Wrapf(err, "Could not get GHOSTDAG data for added block %s", addedBlockHash)
		}

		blueHashes := addedBlockGHOSTDAGData.MergeSetBlues()
		if len(blueHashes) > 0 {
			for _, blueHash := range blueHashes {
				blueBlockID, err := p.database.BlockIDByHash(databaseTransaction, blueHash)
				if err == nil {
					blockColors[blueBlockID] = model.ColorBlue
				} else if withDependencies {
					log.Errorf("Could not get id of merge set blue block %s", blueHash)
				}
			}
		}

		redHashes := addedBlockGHOSTDAGData.MergeSetReds()
		if len(redHashes) > 0 {
			for _, redHash := range redHashes {
				redBlockID, err := p.database.BlockIDByHash(databaseTransaction, redHash)
				if err == nil {
					blockColors[redBlockID] = model.ColorRed
				} else if withDependencies {
					log.Errorf("Could not get id of merge set red block %s", redHash)
				}
			}
		}
	}
	return p.database.UpdateBlockColors(databaseTransaction, blockColors)
}

// Get a map of DAA Scores associated to database block ids.
// The blocks are retrieved from the DAG by hash.
// Their DAG DAA score is then associated to their id in the database.
// Only matching DAG and database blocks are added to the returned map.
func (p *Processing) getBlocksDAAScores(databaseTransaction *pg.Tx, blockHashes []*externalapi.DomainHash) (map[uint64]uint64, error) {
	results := make(map[uint64]uint64)
	for _, blockHash := range blockHashes {
		block, err := p.karlsend.Domain().Consensus().GetBlockHeader(blockHash)
		if err != nil {
			return nil, err
		}
		blockID, err := p.database.BlockIDByHash(databaseTransaction, blockHash)
		// We ignore non-existing blocks in the database
		if err == nil {
			results[blockID] = block.DAAScore()
		}
	}
	return results, nil
}
