import { Assets } from "./assets.js";
import { Consts } from "./consts.js";
import { Monster, Monsters } from "./monsters.js";
import { drawString, randint, titleCase } from "./utils.js";

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
    mod: DieMod | null = null;

    static TEX_WIDTH = 18;
    static TEX_HEIGHT = 18;

    constructor(sides: number) {
        this.sides = sides;
    }

    roll(): number {
        let roll = randint(1, this.sides + 1);
        if (this.mod !== null) {
            roll = this.mod.modifyRoll(this, roll);
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
    modifyRoll(die: Die, roll: number): number,
    name: string,
    short: string,
    description: string,
}

export const DieMods = {
    modronCore(rank: number): DieMod {
        return {
            modifyRoll(die, roll) {
                return rank;
            },
            name: "Modron Core " + rank,
            short: "=" + rank,
            description: `Makes the die always roll ${rank}. Due to Primus' divine influence, a modron's core suppresses probability near itself.`
        }
    },
    highdraHead(): DieMod {
        return {
            modifyRoll(die, roll) {
                return die.sides;
            },
            name: "High-dra Head",
            short: "MAX",
            description: "Makes the die always roll its highest possible value."
        }
    },
    nloon(multiplier: number, metal: "silver" | "gold"): DieMod {
        let description;
        let short;
        if (metal === "gold") {
            description = `Multiplies the die roll by ${multiplier}.`;
            short = "$" + multiplier;
        } else {
            description = `Makes the die act as if it had ${multiplier}x as many sides.`;
            short = "c" + multiplier;
        }
        let coinType = ["Doubloon", "Trebloon"][multiplier - 2];
        return {
            modifyRoll(die, roll) {
                if (metal === "gold") {
                    return roll * multiplier;
                } else {
                    return randint(1, die.sides * multiplier + 1);
                }
            },
            name: coinType + " " + titleCase(metal),
            short,
            description
        }
    }
}

export class Level {
    monsters: Monster[];

    constructor(monsters: Monster[]) {
        this.monsters = monsters;
    }

    static generateFromDepth(depth: number): Level {
        // temp
        let monsters = [];
        if (depth === 0) {
            monsters = [
                Monsters.modron(1),
                Monsters.goblin(),
                Monsters.modron(2),
            ]
        } else {
            // fuck you
            monsters = new Array(depth).fill(Monsters.pirate(2));
        }
        return new Level(monsters);
    }
}

// Defines your starting inventory
export interface PlayerClass {
    name: string,
    description: string,
    difficulty: number,
    dice: Die[],
    items: DieMod[],
}

export const PlayerClasses: PlayerClass[] = [
    {
        name: "Fighter",
        description: "",
        difficulty: 1,
        dice: [new Die(6), new Die(6), new Die(6), new Die(8)],
        items: [
            DieMods.nloon(2, "silver")
        ]
    },
    {
        name: "Cleric",
        description: "",
        difficulty: 1,
        dice: [new Die(4), new Die(4), new Die(4), new Die(4), new Die(4)],
        items: [
            DieMods.nloon(2, "gold"),
            DieMods.nloon(3, "gold"),
            DieMods.modronCore(5),
        ]
    }
]
