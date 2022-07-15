import { Assets } from "./assets.js";
/**
 * Random number: min <= n < max;
 */
export function randint(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}
const wordSplitter = /(\n)|\s+/;
const fontCanvas = (() => {
    let canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 40;
    return canvas;
})();
const fontCanvasCtx = fontCanvas.getContext("2d");
export function drawString(s, x, y, color, charsWidth, ctx) {
    fontCanvasCtx.fillStyle = color;
    fontCanvasCtx.fillRect(0, 0, 48, 40);
    fontCanvasCtx.globalCompositeOperation = "destination-in";
    fontCanvasCtx.drawImage(Assets.textures.font, 0, 0);
    fontCanvasCtx.globalCompositeOperation = "source-over";
    let cursor = 0;
    let line = 0;
    let words = s.split(wordSplitter);
    for (let word of words) {
        if (word === undefined)
            continue;
        if (word === "\n") {
            cursor = 0;
            line++;
        }
        else {
            if (cursor + word.length >= charsWidth) {
                cursor = 0;
                line++;
            }
            for (let i = 0; i < word.length; i++) {
                let cp = word.codePointAt(i);
                let sx = cp % 16;
                let sy = Math.floor(cp / 16);
                ctx.drawImage(fontCanvas, sx * 3, sy * 5, 3, 5, x + cursor * 4, y + line * 6, 3, 5);
                cursor++;
            }
        }
    }
}
