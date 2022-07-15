import { InputState } from "../inputs.js";
import { GameState } from "../states.js";
import { drawString } from "../utils.js";

export class StateSplash implements GameState {
    constructor() { }

    update(controls: InputState): GameState | null {
        if (controls.isClicked("mouse")) {
            // todo
        }
        return null;
    }
    draw(controls: InputState, ctx: CanvasRenderingContext2D) {
        drawString("Hello, world!", 10, 10, "#0", 100, ctx);
    }
}
