import { Assets } from "./assets.js";
import { Consts } from "./consts.js";
import { Monster, Monsters } from "./monsters.js";
import { drawString, randint } from "./utils.js";

export class Player {
    dice: Die[];

    constructor(dice: Die[]) {
        this.dice = dice;
    }
}

const dieNumberWidth = 4;
const dieNumberHeight = 7;
const dieNumberCanvas = (() => {
    let canvas = document.createElement("canvas");
    canvas.width = 10 * dieNumberWidth
    canvas.height = dieNumberHeight;

    return canvas;
})();
const dieCanvasCtx = dieNumberCanvas.getContext("2d")!;
export class Die {
    sides: number;
    mods: DieMod[] = [];

    static TEX_WIDTH = 18;
    static TEX_HEIGHT = 18;

    constructor(sides: number) {
        this.sides = sides;
    }

    roll(): number {
        let roll = randint(1, this.sides + 1);
        for (let mod of this.mods) {
            roll = mod(roll);
        }
        return Math.max(1, Math.min(99, roll));
    }

    draw(x: number, y: number, roll: number, ctx: CanvasRenderingContext2D) {
        let sideIdx;
        if (this.sides === 4) {
            sideIdx = 0;
        } else if (this.sides === 6) {
            sideIdx = 1;
        } else if (this.sides === 8) {
            sideIdx = 2;
        } else if (this.sides === 10) {
            sideIdx = 3;
        } else if (this.sides === 12) {
            sideIdx = 4;
        } else {
            sideIdx = 5;
        }
        ctx.drawImage(Assets.textures.diceAtlas, sideIdx * Die.TEX_WIDTH, 0, Die.TEX_WIDTH, Die.TEX_HEIGHT, x, y, Die.TEX_WIDTH, Die.TEX_HEIGHT);

        let color = [
            "#222",
            Consts.BG_COLOR,
            "#222",
            Consts.BG_COLOR,
            Consts.BG_COLOR,
            Consts.BG_COLOR,
        ][sideIdx];
        let dy = [
            3, 0, -3, 0, 1, 3,
        ][sideIdx];
        dieCanvasCtx.fillStyle = color;
        dieCanvasCtx.fillRect(0, 0, 10 * dieNumberWidth, dieNumberHeight);
        dieCanvasCtx.globalCompositeOperation = "destination-in";
        dieCanvasCtx.drawImage(Assets.textures.numberFont, 0, 0);
        dieCanvasCtx.globalCompositeOperation = "source-over";

        let rollStr = roll.toString();
        let dx = -Math.floor(rollStr.length / 2) * (dieNumberWidth - 1);
        for (let i = 0; i < rollStr.length; i++) {
            let cp = rollStr.codePointAt(i)!;
            let num = cp - 0x30; // '0'
            ctx.drawImage(dieNumberCanvas, num * dieNumberWidth, 0, dieNumberWidth, dieNumberHeight,
                x + Die.TEX_WIDTH / 2 - dieNumberWidth / 2 + dx + i * (dieNumberWidth + 2),
                y + Die.TEX_HEIGHT / 2 - dieNumberHeight / 2 + dy,
                dieNumberWidth, dieNumberHeight);
        }
    }
}

export interface DieMod {
    (roll: number): number;
}

export class Level {
    monsters: Monster[];

    constructor(monsters: Monster[]) {
        this.monsters = monsters;
    }

    static generateFromDepth(depth: number): Level {
        // temp
        const monsters = [
            Monsters.modron(1),
            Monsters.modron(2),
            Monsters.modron(3),
        ];
        return new Level(monsters);
    }
}

export class LevelHarness {
    player: Player;
    level: Level;

    rolledDice: number[];
    // Indices of used-up dice
    usedDice: Set<number>;
    eatenDice: Set<number>;

    constructor(player: Player, level: Level) {
        this.player = player;
        this.level = level;

        this.rolledDice = this.player.dice.map(die => die.roll());
        this.usedDice = new Set();
        this.eatenDice = new Set();
    }
}


