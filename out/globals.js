import { Assets } from "./assets.js";
import { StateSplash } from "./states/splash.js";
class Globals {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        const ctxAny = this.ctx;
        ctxAny.mozImageSmoothingEnabled = false;
        ctxAny.webkitImageSmoothingEnabled = false;
        ctxAny.msImageSmoothingEnabled = false;
        ctxAny.imageSmoothingEnabled = false;
        this.width = canvas.width;
        this.height = canvas.height;
        // this has to be lateinit
        this.audio = {};
        this.state = new StateSplash();
    }
    initAudio() {
        // Set up audio
        const anyWindow = window;
        const AudioContext = anyWindow.AudioContext || anyWindow.webkitAudioContext;
        this.audio.ctx = new AudioContext();
        if (this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume();
        }
        this.audio.bgMusic = Assets.audio.bgMusic.cloneNode(true);
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
    update(controls) {
        const nextState = this.state.update(controls);
        if (nextState !== null) {
            this.state = nextState;
        }
    }
    draw(controls) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.state.draw(controls, this.ctx);
    }
}
Globals.stateTitleScreen = "TITLE_SCREEN";
Globals.stateInitGameplay = "INIT_GAMEPLAY";
Globals.stateNormalGameplay = "NORMAL_GAMEPLAY";
Globals.statePlayerDying = "PLAYER_DYING";
Globals.statePlayerDead = "PLAYER_DEAD";
Globals.canvasScale = 4;
export { Globals };
