import { InputState } from "./inputs.js";

interface GameState {
    update: (controls: InputState) => GameState | null;
    draw: (controls: InputState, ctx: CanvasRenderingContext2D) => void;
}

export { GameState }
