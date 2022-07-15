import { Assets } from "./assets.js";
import { Consts } from "./consts.js";
import { InputState } from "./inputs.js";
import { GameState } from "./states.js";
import { StateSplash } from "./states/splash.js";

export class RollPlayingGame {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    audio: {
        initialized: boolean,
        ctx: AudioContext,

        bgMusic: HTMLAudioElement,
        trackBgMusic: MediaElementAudioSourceNode,
        bgGainNode: GainNode
    }

    state: GameState;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        const ctxAny = this.ctx as any;
        ctxAny.mozImageSmoothingEnabled = false;
        ctxAny.webkitImageSmoothingEnabled = false;
        ctxAny.msImageSmoothingEnabled = false;
        ctxAny.imageSmoothingEnabled = false;

        this.width = canvas.width;
        this.height = canvas.height;

        // this has to be lateinit
        this.audio = { initialized: false } as any;

        this.state = new StateSplash();
    }

    initAudio() {
        // Set up audio
        const anyWindow = (window as any);
        const AudioContext = anyWindow.AudioContext || anyWindow.webkitAudioContext;
        this.audio.ctx = new AudioContext();
        if (this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume();
        }
        this.audio.bgMusic = Assets.audio.bgMusic.cloneNode(true) as HTMLAudioElement;
        this.audio.trackBgMusic = this.audio.ctx.createMediaElementSource(this.audio.bgMusic);
        // Make it a bit quieter
        this.audio.bgGainNode = this.audio.ctx.createGain();
        this.audio.bgGainNode.gain.value = 0.4;
        this.audio
            .trackBgMusic.connect(this.audio.bgGainNode)
            .connect(this.audio.ctx.destination);
        // Loop the bg music
        if (typeof this.audio.bgMusic.loop == 'boolean')
            this.audio.bgMusic.loop = true;
        else
            this.audio.bgMusic.addEventListener('ended', () => {
                this.audio.bgMusic.currentTime = 0;
                this.audio.bgMusic.play();
            }, false);
        this.audio.bgMusic.play();

        this.audio.initialized = true;
    }

    update(controls: InputState) {
        if (controls.isClicked("mouse") && !this.audio.initialized) {
            this.initAudio();
        }

        const nextState = this.state.update(controls);
        if (nextState !== null) {
            this.state = nextState;
        }
    }

    draw(controls: InputState) {
        this.ctx.fillStyle = Consts.BG_COLOR;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.lineWidth = 1.0;
        this.ctx.strokeStyle = Consts.BLUE_LINE_COLOR;
        for (let y = Consts.CHAR_HEIGHT * 3 - Consts.KERNING_Y; y < this.height; y += Consts.HORIZ_LINE_SPACING) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y - 0.5);
            this.ctx.lineTo(this.width, y - 0.5);
            this.ctx.stroke();
        }
        this.ctx.strokeStyle = Consts.PINK_LINE_COLOR;
        this.ctx.lineWidth = 2.0;
        this.ctx.beginPath();
        this.ctx.moveTo(Consts.VERT_LINE_OFFSET, 0);
        this.ctx.lineTo(Consts.VERT_LINE_OFFSET, this.height);
        this.ctx.stroke();

        this.state.draw(controls, this.ctx, { width: this.width, height: this.height });
    }
}
