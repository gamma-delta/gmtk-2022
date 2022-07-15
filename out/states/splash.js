import { drawString } from "../utils.js";
export class StateSplash {
    constructor() { }
    update(controls) {
        if (controls.isClicked("mouse")) {
            // todo
        }
        return null;
    }
    draw(controls, ctx) {
        drawString("Hello, world!", 10, 10, "#0", 100, ctx);
    }
}
