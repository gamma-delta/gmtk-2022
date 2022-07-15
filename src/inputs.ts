import { Globals } from "./globals.js";

class InputState {
    inputTimes: Map<string, number>;
    rawInputs: Set<string>;
    mouseDown: boolean;
    mouseX: number;
    mouseY: number;

    constructor() {
        this.inputTimes = new Map();
        this.rawInputs = new Set();
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    registerKeydown(key: string) {
        this.rawInputs.add(key);
    }

    registerKeyup(key: string) {
        this.rawInputs.delete(key);
    }

    // Treate the mouse click as a key
    registerMouseDown() {
        this.rawInputs.add('mouse');
    }

    registerMouseUp() {
        this.rawInputs.delete('mouse');
    }

    registerMouseMove(ev: MouseEvent) {
        this.mouseX = ev.offsetX / Globals.canvasScale;
        this.mouseY = ev.offsetY / Globals.canvasScale;
    }

    update() {
        // debugger;
        // Add 1 to all of the pressed keys
        for (let pressedKey of this.rawInputs)
            this.inputTimes.set(pressedKey, (this.inputTimes.get(pressedKey) || 0) + 1);

        // Delete all of the non-pressed keys
        for (let [key, _] of this.inputTimes)
            if (!this.rawInputs.has(key))
                this.inputTimes.set(key, 0);
    }

    isClicked(key: string): boolean {
        return (this.inputTimes.get(key) || 0) === 1;
    }

    isPressed(key: string): boolean {
        return (this.inputTimes.get(key) || 0) >= 1;
    }
}

export { InputState };
