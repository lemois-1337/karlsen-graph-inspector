import './BlockInformationPanel.css'
import {Divider, IconButton, List, Paper, Typography} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import BlockInformationPanelHash from "./BlockInformationPanelHash";
import BlockInformationPanelListItem from "./BlockInformationPanelListItem";
import {katnipAddress} from "../../../addresses";
import {BlockInformation} from "../../../model/BlockInformation";

const BlockInformationPanel = ({blockInformation, onClose, onSelectHash}:
                                  { blockInformation: BlockInformation | null, onClose: () => void, onSelectHash: (hash: string) => void }) => {

    if (!blockInformation) {
        return <div/>;
    }

    const katnipAddressForBlock = `${katnipAddress}/block/${blockInformation.block.blockHash}`;

    let blockColorText = "Undecided";
    let blockColorClass = "block-color-undecided";
    if (blockInformation.block.color === "blue") {
        blockColorText = "Blue";
        blockColorClass = "block-color-blue";
    } else if (blockInformation.block.color === "red") {
        blockColorText = "Red";
        blockColorClass = "block-color-red";
    }

    let language = navigator.language || "en-US";
    let blockDAAScore = blockInformation.block.daaScore.toLocaleString(language);

    const blockHashTooltip = <div className="information-tooltip">
        <p>The <b>hash</b> of a block is its unique identifier in the block DAG.</p>
        <p>A block's hash is derived directly from the block itself using a cryptographic hash function. That ensures
            that no two blocks in the DAG have the same hash, and that each hash represents only the original block from
            which it was derived.</p>
    </div>

    const blockParentsTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the genesis) has one or more <b>parents.</b> A <b>parent</b> is
            simply the hash of another block that had been added to the DAG at a prior time.</p>
        <p>Here, we represent each parent with an arrow. Note that all arrows point from right to left — from child to
            parent. Moving towards the left in the graph reveals increasingly older generations of blocks until we reach
            the leftmost, and oldest, block. That's the origin of the DAG, or the genesis.</p>
        <p>A block's <b>selected parent</b> is the parent that has the most accumulated proof-of-work.</p>
    </div>;

    const blockMergeSetTooltip = <div className="information-tooltip">
        <p>The <b>merge set</b> of a block is the set of blocks that are an ancestor (either a direct or an indirect
            parent) of the block but are not an ancestor of the block's selected parent. Note that this includes the
            block's selected parent itself.</p>
        <p>Every block in the merge set is classified as one of two <b>colors</b>: <b className="block-color-red">
            red</b> and <b className="block-color-blue">blue</b>.</p>
        <p>For security reasons, only a certain amount of blocks in a block's merge set may
            be <b className="block-color-blue">blue</b>. The blocks that do not make the cut are regarded as
            attacker blocks and are marked <b className="block-color-red">red</b>.</p>
    </div>;

    const isBlockInVirtualSelectedParentChainTooltip = <div className="information-tooltip">
        <p>Every block in the DAG (aside from the genesis) has a selected parent. That selected parent likewise has a
            selected parent. Following this <b>chain</b> of selected parents will eventually bring us to the genesis. We
            call this chain the <b>Selected Parent Chain</b> of a block, or its <b>SPC.</b></p>
        <p>The <b>virtual</b> block is a special, invisible block whose parents are always the blocks in the DAG that do
            not yet have any children.</p>
        <p>Like all blocks, the virtual has a selected parent block. The Selected Parent Chain of the virtual is plainly
            called the <b>Virtual Selected Parent Chain,</b> or the <b>VSPC.</b></p>
    </div>;

    const blockColorTooltip = <div className="information-tooltip">
        <p>Every block in the DAG is classified as one of two <b>colors:</b>
            <b className="block-color-red"> red (attacker)</b> and <b className="block-color-blue">blue (honest)</b>.
        </p>
        <p>If we were to combine all the merge sets of all the blocks in the VSPC, we would get a combined set of all
            the blocks in the DAG. Therefore, to determine the color of a block, we find the VSPC block that contains
            our block in its merge set. The color of our block in that merge set is the color of the block in the
            DAG.</p>
    </div>;

    const blockDAAScoreTooltip = <div className="information-tooltip">
        <p>Every block in the DAG has a DAA Score.</p>
        <p>The DAA Score is related to the number of honest blocks ever added to the DAG. Since blocks are created at a
            rate of one per second, the score is a metric of the elapsed time since network launch.</p>
    </div>;

    const blockChildrenTooltip = <div className="information-tooltip">
        <p>Every block in the block DAG (aside from the blocks forming the tips) has one or more <b>children.</b> A <b>child</b> is
           simply the hash of another block that has been added to the DAG at a later time and that has the block
            hash in its parents.</p>
        <p>Here, we represent each child with an arrow. Note that all arrows point from right to left — from child to
            parent. Moving towards the right in the graph reveals increasingly younger generations of blocks until we
            reach the rightmosts, and youngest, blocks. That's the tips of the DAG.</p>
    </div>;

    const parentElements = [];
    if (blockInformation.isInformationComplete) {
        for (let parentHash of blockInformation.parentHashes) {
            const className = blockInformation.selectedParentHash === parentHash ? "selected-parent-hash" : "";
            parentElements.push(<BlockInformationPanelHash key={parentHash} className={className} hash={parentHash} onSelect={onSelectHash}/>)
        }
    }

    const mergeSetHashElements = [];
    if (blockInformation.isInformationComplete) {
        for (let mergeSetBlueHash of blockInformation.mergeSetBlueHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash key={mergeSetBlueHash} className="block-color-blue" hash={mergeSetBlueHash} onSelect={onSelectHash}/>);
        }
        for (let mergeSetRedHash of blockInformation.mergeSetRedHashes) {
            mergeSetHashElements.push(
                <BlockInformationPanelHash key={mergeSetRedHash} className="block-color-red" hash={mergeSetRedHash} onSelect={onSelectHash}/>);
        }
    }

    const childElements = [];
    if (blockInformation.isInformationComplete) {
        for (let childHash of blockInformation.childHashes) {
            const className = blockInformation.selectedChildHash === childHash ? "selected-child-hash" : "";
            childElements.push(<BlockInformationPanelHash key={childHash} className={className}hash={childHash}  onSelect={onSelectHash}/>)
        }
    }

    return (
        <Paper elevation={4}>
            <div className="block-information-panel">
                <div className="block-information-header">
                    <Typography variant="h4">
                        Block Information
                    </Typography>
                    <IconButton className="close-button" color="primary" onClick={onClose} size="large">
                        <CloseIcon/>
                    </IconButton>
                </div>
                <div className="block-information-content-container">
                    <div className="block-information-content">
                        {!blockInformation.isInformationComplete
                            ? undefined
                            : <List>
                                <BlockInformationPanelListItem itemKey="block-hash" label="Block Hash" tooltip={blockHashTooltip}>
                                    <BlockInformationPanelHash hash={blockInformation.block.blockHash} onSelect={onSelectHash}/>
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="block-parents" label="Block Parents" tooltip={blockParentsTooltip}>
                                    {parentElements.length === 0
                                        ?
                                        <Typography className="block-information-panel-hash"
                                                    variant="h6">None</Typography>
                                        : parentElements
                                    }
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="block-merge-set" label="Block Merge Set" tooltip={blockMergeSetTooltip}>
                                    {mergeSetHashElements.length === 0
                                        ?
                                        <Typography className="block-information-panel-hash"
                                                    variant="h6">None</Typography>
                                        : mergeSetHashElements
                                    }
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="block-children" label="Block Children" tooltip={blockChildrenTooltip}>
                                    {childElements.length === 0
                                        ?
                                        <Typography className="block-information-panel-hash"
                                                    variant="h6">None</Typography>
                                        : childElements
                                    }
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="is-bloc-vspc" label="Is Block In VSPC"
                                                               tooltip={isBlockInVirtualSelectedParentChainTooltip}>
                                    <Typography className="is-block-in-virtual-selected-parent-chain" variant="h6">
                                        {blockInformation.block.isInVirtualSelectedParentChain ? "Yes" : "No"}
                                    </Typography>
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="block-color" label="Block Color" tooltip={blockColorTooltip}>
                                    <Typography className={`block-color ${blockColorClass}`} variant="h6">
                                        {blockColorText}
                                    </Typography>
                                </BlockInformationPanelListItem>

                                <Divider className="block-information-divider"/>

                                <BlockInformationPanelListItem itemKey="block-daa-score" label="Block DAA Score" tooltip={blockDAAScoreTooltip}>
                                    <Typography className="block-daa-score" variant="h6">
                                        {blockDAAScore}
                                    </Typography>
                                </BlockInformationPanelListItem>
                            </List>
                        }
                    </div>
                </div>
                <div className="katnip-link-text">
                    See more details on  <a href={katnipAddressForBlock} target="_blank" rel="noreferrer">Katnip Block Explorer</a>
                </div>
            </div>
        </Paper>
    );
}

export default BlockInformationPanel;
