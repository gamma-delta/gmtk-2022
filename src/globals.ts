import { Assets } from "./assets.js";
import { InputState } from "./inputs.js";
import { GameState } from "./states.js";
import { StateSplash } from "./states/splash.js";

class Globals {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;

    audio: {
        ctx: AudioContext,

        bgMusic: HTMLAudioElement,
        trackBgMusic: MediaElementAudioSourceNode,
        bgGainNode: GainNode
    }

    state: GameState;

    static stateTitleScreen = "TITLE_SCREEN";
    static stateInitGameplay = "INIT_GAMEPLAY";
    static stateNormalGameplay = "NORMAL_GAMEPLAY";
    static statePlayerDying = "PLAYER_DYING";
    static statePlayerDead = "PLAYER_DEAD";

    static canvasScale = 4;

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
        this.audio = {} as any;

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
    }

    update(controls: InputState) {
        const nextState = this.state.update(controls);
        if (nextState !== null) {
            this.state = nextState;
        }
    }

    draw(controls: InputState) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.state.draw(controls, this.ctx);
    }
}

export { Globals };