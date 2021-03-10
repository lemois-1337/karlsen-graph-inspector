import * as PIXI from 'pixi.js';
import TimelineContainer from "./TimelineContainer";
import {Block} from "./model/Block";
import {Ticker} from "@createjs/core";

export default class Dag {
    private readonly tickInternalInMilliseconds = 1000;
    private readonly headHeightMarginMultiplier = 0.25;

    private readonly application: PIXI.Application;
    private readonly timelineContainer: TimelineContainer;
    private readonly apiAddress: string;

    private currentWidth: number = 0;
    private currentHeight: number = 0;
    private currentTickId: number | undefined = undefined;
    private currentTickFunction: () => Promise<void>;

    private targetHeight: number | null = null;
    private targetHash: string | null = null;
    private isTrackingChangedListener: (isTracking: boolean) => void;

    constructor(canvas: HTMLCanvasElement) {
        this.application = new PIXI.Application({
            transparent: false,
            backgroundColor: 0xffffff,
            view: canvas,
            resizeTo: canvas,
            antialias: true,
        });

        this.currentTickFunction = async () => {
            // Do nothing
        }
        this.isTrackingChangedListener = () => {
            // Do nothing
        }

        // This sets TweenJS to use requestAnimationFrame.
        // Without it, it uses setTimeout, which makes
        // animations not as smooth as they should be
        Ticker.timingMode = Ticker.RAF;

        this.apiAddress = this.resolveApiAddress();

        this.timelineContainer = new TimelineContainer(this.application);
        this.timelineContainer.setBlockClickedListener(this.handleBlockClicked);
        this.application.ticker.add(this.resizeIfRequired);
        this.application.stage.addChild(this.timelineContainer);

        this.application.start();

        this.run();
    }

    private resolveApiAddress = (): string => {
        const apiAddress = process.env.REACT_APP_API_ADDRESS;
        if (!apiAddress) {
            throw new Error("The REACT_APP_API_ADDRESS environment variable is required");
        }
        return apiAddress;
    }

    private resizeIfRequired = () => {
        if (this.currentWidth !== this.application.renderer.width
            || this.currentHeight !== this.application.renderer.height) {
            this.currentWidth = this.application.renderer.width;
            this.currentHeight = this.application.renderer.height;

            this.timelineContainer.recalculatePositions();
        }
    }

    private run = () => {
        window.clearTimeout(this.currentTickId);
        this.tick();
    }

    private tick = () => {
        const currentTickId = this.currentTickId;
        this.resolveTickFunction();
        this.currentTickFunction().then(() => {
            if (this.currentTickId === currentTickId) {
                this.scheduleNextTick();
            }
        });

        this.notifyIsTrackingChanged();
    }

    private resolveTickFunction = () => {
        const urlParams = new URLSearchParams(window.location.search);

        this.targetHeight = null;
        this.targetHash = null;

        const heightString = urlParams.get("height");
        if (heightString) {
            const height = parseInt(heightString);
            if (height || height === 0) {
                this.targetHeight = height;
                this.currentTickFunction = this.trackTargetHeight;
                return;
            }
        }

        const hash = urlParams.get("hash");
        if (hash) {
            this.targetHash = hash;
            this.currentTickFunction = this.trackTargetHash;
            return
        }

        this.currentTickFunction = this.trackHead;
    }

    private scheduleNextTick = () => {
        this.currentTickId = window.setTimeout(this.tick, this.tickInternalInMilliseconds);
    }

    private trackTargetHeight = async () => {
        const targetHeight = this.targetHeight as number;
        this.timelineContainer.setTargetHeight(targetHeight);

        const [startHeight, endHeight] = this.timelineContainer.getVisibleHeightRange(targetHeight);
        const response = await fetch(`http://${this.apiAddress}/blocksBetweenHeights?startHeight=${startHeight}&endHeight=${endHeight}`);
        const blocks = await response.json();
        this.timelineContainer.setBlocks(blocks);
    }

    private trackTargetHash = async () => {
        const targetHash = this.targetHash as string;

        const heightDifference = this.timelineContainer.getMaxBlockAmountOnHalfTheScreen();
        const response = await fetch(`http://${this.apiAddress}/blockHash?blockHash=${targetHash}&heightDifference=${heightDifference}`);
        const blocks: Block[] = await response.json();

        for (let block of blocks) {
            if (block.blockHash === targetHash) {
                this.timelineContainer.setTargetHeight(block.height);
                break;
            }
        }

        this.timelineContainer.setBlocks(blocks);
    }

    private trackHead = async () => {
        const maxBlockAmountOnHalfTheScreen = this.timelineContainer.getMaxBlockAmountOnHalfTheScreen();

        let headMargin = 0;
        const rendererWidth = this.application.renderer.width;
        const rendererHeight = this.application.renderer.height;
        if (rendererHeight < rendererWidth) {
            headMargin = Math.floor(maxBlockAmountOnHalfTheScreen * this.headHeightMarginMultiplier);
        }

        const heightDifference = maxBlockAmountOnHalfTheScreen + headMargin;

        const response = await fetch(`http://${this.apiAddress}/head?heightDifference=${heightDifference}`);
        const blocks: Block[] = await response.json();

        let maxHeight = 0;
        for (let block of blocks) {
            if (block.height > maxHeight) {
                maxHeight = block.height;
            }
        }

        let targetHeight = maxHeight - headMargin;
        if (targetHeight < 0) {
            targetHeight = 0;
        }

        this.timelineContainer.setTargetHeight(targetHeight);
        this.timelineContainer.setBlocks(blocks);
    }

    private handleBlockClicked = (block: Block) => {
        this.timelineContainer.setTargetHeight(block.height);
        if (this.targetHash !== block.blockHash) {
            this.setStateTrackTargetBlock(block);
            return;
        }
        window.open(`http://testnet.katnip.sh/#/block/${block.blockHash}`, "'_blank'");
    }

    setStateTrackTargetBlock = (targetBlock: Block) => {
        const urlParams = new URLSearchParams();
        urlParams.set("hash", `${targetBlock.blockHash}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackTargetHeight = (targetHeight: number) => {
        const urlParams = new URLSearchParams();
        urlParams.set("height", `${targetHeight}`);
        window.history.pushState(null, "", `?${urlParams}`);
        this.run();
    }

    setStateTrackHead = () => {
        window.history.pushState(null, "", "?");
        this.run();
    }

    setIsTrackingChangedListener = (isTrackingChangedListener: (isTracking: boolean) => void) => {
        this.isTrackingChangedListener = isTrackingChangedListener;
    }

    private notifyIsTrackingChanged = () => {
        const isTracking = this.currentTickFunction === this.trackHead
        this.isTrackingChangedListener(isTracking);
    }

    stop = () => {
        if (this.application) {
            this.application.stop();
        }
    }
}
