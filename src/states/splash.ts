import { Consts } from "../consts.js";
import { InputState } from "../inputs.js";
import { GameState } from "../states.js";
import { drawString } from "../utils.js";
import { StatePlaying } from "./playing.js";

export class StateSplash implements GameState {
    constructor() { }

    update(controls: InputState): GameState | null {
        if (controls.isClicked("mouse")) {
            return StatePlaying.start();
        }
        return null;
    }
    draw(controls: InputState, ctx: CanvasRenderingContext2D) {
        drawString(ctx,
            "Roll-Playing Game\n\Code by petrak@, art by Falkory, and music by Cass Cuttlefish\n\nClick to start!",
            Consts.VERT_LINE_OFFSET + Consts.CHAR_WIDTH * 8, Consts.CHAR_HEIGHT * 8);
    }
}
