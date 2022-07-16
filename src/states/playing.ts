import { Assets } from "../assets.js";
import { Consts } from "../consts.js";
import { InputState } from "../inputs.js";
import { DieMod, Item, Items } from "../items.js";
import { Die, Level, PlayerClasses } from "../model.js";
import { DrawInfo, GameState } from "../states.js";
import { lethalDamage, nonLethalDamage } from "../strings.js";
import { drawString, drawStringAlign, pick, randint, splitIntoWordsWithLen, titleCase } from "../utils.js";
import { Widget } from "../widget.js";
import { StateLose } from "./lose.js";

const ART_WIDTH = 240;
const ART_HEIGHT = 240;
const INFO_BOX_HEIGHT = Consts.CHAR_WIDTH * 23.75;
const DIE_TRAY_HEIGHT = Math.round((400 - ART_HEIGHT) / 3 / 2) * 2;
const INFO_BOX_CHAR_WIDTH = 48;

const DIE_ROLL_TIME = 20;
const MONSTER_ANIM_TIME = 20;
const MONSTER_FALL_TIME = 8;

const ITEM_SIZE = 20;

export class StatePlaying implements GameState {
    level: Level;
    log: string[];
    monsterIdx: number = 0;

    dice: [Die, number][];
    // Indices of used-up dice
    usedDice: [Die, number][];
    items: Item[];

    depth: number;
    swapState: GameState | null = null;

    static MAX_DIE_COUNT = 8;

    widgets: Widget<StatePlaying>[];
    coverMode: CoverMode = { type: "none" };
    treasureChest: Die;

    frames: number = 0;
    monsterAnim: { mode: "none" } | { mode: "kill" | "run", startFrame: number }
        = { mode: "none" };

    static start() {
        const startLog = [
            ":: Welcome to Roll-Playing Game.",
            ":: You hold your newspaper hat tight to your head as you step into the dungeon, dust billowing like an ancient book under your footsteps.",
            ":: Your mentor's advice echoes in your head:",
            ':: "Click on a die to fight a monster with what you rolled. If you succeed, you get your die back, to be re-rolled when you reach the treasure chest."',
            ':: "Go as deep as you can, and don\'t run out of dice!"',
        ];

        const clazz = PlayerClasses[0];

        const level = Level.generateFromDepth(0);
        return new StatePlaying(level, 0, clazz.dice.slice(), clazz.items.slice(), startLog);
    }

    private constructor(level: Level, depth: number, dice: Die[], items: Item[], log: string[]) {
        this.level = level;
        this.depth = depth;

        this.dice = dice.map(die => [die, die.roll()]);
        this.usedDice = [];
        this.items = items;

        this.widgets = [];
        for (let used of [false, true]) {
            for (let i = 0; i < StatePlaying.MAX_DIE_COUNT; i++) {
                let x = Consts.VERT_LINE_OFFSET + Consts.CHAR_WIDTH + i * (Die.TEX_WIDTH + Consts.CHAR_WIDTH);
                let y = ART_HEIGHT + (DIE_TRAY_HEIGHT / 2 - Die.TEX_HEIGHT / 2) + (used ? DIE_TRAY_HEIGHT : 0);
                this.widgets.push(new WidgetDie(this, x, y, Die.TEX_WIDTH, Die.TEX_HEIGHT, i, used));
                if (used === true) {
                    this.widgets.push(new WidgetItem(this, x - 1, y + DIE_TRAY_HEIGHT - 8, ITEM_SIZE, ITEM_SIZE, i));
                }
            }
        }
        this.widgets.push(new WidgetInfoPanel(this, ART_WIDTH, 0, 999999, ART_WIDTH));
        this.log = log;

        this.treasureChest = new Die(pick([4, 6, 8, 10, 12, 20]));
    }

    mode(): "monster" | "treasureChest" | "lost" {
        if (this.dice.length === 0) {
            return "lost";
        } else if (this.monsterIdx >= this.level.monsters.length) {
            return "treasureChest";
        } else {
            return "monster";
        }
    }

    update(controls: InputState): GameState | null {
        for (let wig of this.widgets) {
            wig.update(controls);
        }

        this.frames++;
        if (this.monsterAnim.mode != "none" && this.frames - this.monsterAnim.startFrame > MONSTER_ANIM_TIME) {
            this.monsterAnim = { mode: "none" };
        }
        return this.swapState;
    }

    useDie(index: number, used: boolean) {
        if (this.coverMode.type === "applyingItem") {
            let item = this.items[this.coverMode.itemIdx];
            if (item.data.type === "mod") {
                let diePair = (used ? this.usedDice : this.dice)[index];
                if (diePair === undefined) return;

                let oldMod = diePair[0].mod;
                diePair[0].mod = item.data.dieMod;

                if (oldMod !== null) {
                    this.log.push(`:: You take the old ${oldMod.name} off of your d${diePair[0].sides} and replace it with the ${item.data.dieMod.name}.`);
                } else {
                    this.log.push(`:: You equip the ${item.data.dieMod.name} to your d${diePair[0].sides}.`);
                }
                diePair[1] = diePair[0].roll();
                for (let wig of this.widgets) {
                    if (wig instanceof WidgetDie && wig.index === index && wig.used === used) {
                        wig.dieRollAnimFrame = this.frames;
                        break;
                    }
                }
            } else if (item.data.type === "rerollOne") {
                // ok i'll let you reroll a used die if you want fine
                let diePair = (used ? this.usedDice : this.dice)[index];
                if (diePair === undefined) return;
                diePair[1] = diePair[0].roll();
                this.log.push(`:: You pour the potion over your d${diePair[0].sides}. It rattles.`);

                for (let wig of this.widgets) {
                    if (wig instanceof WidgetDie && wig.index === index && wig.used === used) {
                        wig.dieRollAnimFrame = this.frames;
                        break;
                    }
                }
            } else if (item.data.type === "restoreOne") {
                if (!used || index >= this.usedDice.length) return;
                let [diePair] = this.usedDice.splice(index, 1);
                this.dice.push(diePair);
                this.log.push(`:: You pour the potion over your d${diePair[0].sides}. It glows and refreshes.`);
            } else {
                console.log("Uh oh, tried to apply an item that shouldn't be applied", item);
            }

            this.items.splice(this.coverMode.itemIdx, 1);
            this.coverMode = { type: "none" };
        } else if (this.mode() === "monster") {
            if (index >= this.dice.length || this.monsterIdx >= this.level.monsters.length) { return; }

            const monster = this.level.monsters[this.monsterIdx];
            let defeated = monster.defeatedBy(this.dice.map(pair => pair[1]), index);
            let [diePair] = this.dice.splice(index, 1);
            if (defeated) {
                this.usedDice.push(diePair);

                this.log.push(":: " + lethalDamage(diePair[1], monster));
                this.log.push(`:: The ${monster.name} dies!`);

                const item = monster.itemDropped();
                if (item !== null) {
                    this.log.push(`:: The ${monster.name} dropped a ${item.name}!`);
                    if (this.items.length < StatePlaying.MAX_DIE_COUNT - 1) {
                        this.items.push(item);
                        this.log.push(`:: You pick up the ${item.name}.`);
                    } else {
                        this.log.push(`:: But you had no room for the ${item.name}, so you left it there.`);
                    }
                }

                this.log.push(`:: You retrieve your d${diePair[0].sides}.`);
                this.monsterAnim = { mode: "kill", startFrame: this.frames };
            } else {
                this.log.push(":: " + nonLethalDamage(diePair[1], monster));
                this.log.push(`:: It slinks off into the darkness with your d${diePair[0].sides}.`);
                this.monsterAnim = { mode: "run", startFrame: this.frames };
            }
            this.monsterIdx++;
        }
    }

    clickInfoPanel() {
        let mode = this.mode();
        if (mode === "treasureChest") {
            let nextLevel = Level.generateFromDepth(this.depth + 1);
            let dice = this.dice.map(d => d[0]);
            dice.push(...this.usedDice.map(d => d[0]));
            if (dice.length < StatePlaying.MAX_DIE_COUNT) {
                dice.push(this.treasureChest);
                this.log.push(`:: You take the d${this.treasureChest.sides}.`);
            } else {
                this.log.push(`:: You had no room for the d${this.treasureChest.sides} in the chest, so you left it there.`);
            }
            this.log.push(`:: You descend the stairs deeper into the dungeon, down to floor ${this.depth + 2}.`);
            this.swapState = new StatePlaying(nextLevel, this.depth + 1, dice, this.items, this.log);
        } else if (mode === "lost") {
            this.swapState = new StateLose({
                depth: this.depth,
                diedTo: this.level.monsters[this.monsterIdx],
            });
        }
    }

    useItem(index: number) {
        if (this.coverMode.type === "applyingItem") {
            // quit applying
            this.coverMode = { type: "none" }
            return;
        }

        let item = this.items[index];
        if (item === undefined) {
            return;
        }

        let immediateUse = true;
        if (item.data.type === "rerollAll") {
            for (let pair of this.dice) {
                pair[1] = pair[0].roll();
            }
            this.log.push(":: You pour the potion over your unused dice. They rattle.");
            for (let wig of this.widgets) {
                if (wig instanceof WidgetDie) {
                    wig.dieRollAnimFrame = this.frames;
                }
            }
        } else if (item.data.type === "restoreAll") {
            this.dice.push(...this.usedDice);
            this.usedDice = [];

            this.log.push(":: You pour the potion over your used dice. They glow and refresh.");
        } else {
            immediateUse = false;
        }

        if (immediateUse) {
            this.items.splice(index, 1);
        } else {
            this.coverMode = {
                type: "applyingItem",
                itemIdx: index,
            };
        }
    }

    draw(controls: InputState, ctx: CanvasRenderingContext2D, { width, height, }: DrawInfo) {
        this.drawBoxes(ctx, width, height);

        drawString(ctx, "Game Log", ART_WIDTH + Consts.CHAR_WIDTH / 2, INFO_BOX_HEIGHT + Consts.CHAR_HEIGHT + 7, INFO_BOX_CHAR_WIDTH, Consts.PINK_LINE_COLOR);
        {
            let logHeight = 18;
            let logLines = [];
            let quit = false;
            for (let i = this.log.length - 1; !quit && i >= 0; i--) {
                let entry = this.log[i];
                let entryLines = splitIntoWordsWithLen(entry, INFO_BOX_CHAR_WIDTH);
                entryLines.reverse();
                for (let line of entryLines) {
                    logLines.push(line);
                    if (logLines.length >= logHeight) {
                        quit = true;
                        break;
                    }
                }
            }
            logLines.reverse();
            for (let i = 0; i < logLines.length; i++) {
                drawString(ctx, logLines[i],
                    ART_WIDTH + Consts.CHAR_WIDTH / 2, INFO_BOX_HEIGHT + 3 * Consts.CHAR_HEIGHT + i * Consts.HORIZ_LINE_SPACING, 999);
            }
        }

        ctx.save();
        ctx.rotate(-Math.PI / 2);
        drawStringAlign(ctx, "Ready", -ART_HEIGHT - DIE_TRAY_HEIGHT * 0.5, Consts.CHAR_HEIGHT * 0.5, "center");
        drawStringAlign(ctx, "Used", -ART_HEIGHT - DIE_TRAY_HEIGHT * 1.5, Consts.CHAR_HEIGHT * 0.5, "center");
        drawStringAlign(ctx, "Items", -ART_HEIGHT - DIE_TRAY_HEIGHT * 2.5, Consts.CHAR_HEIGHT * 0.5, "center");
        ctx.restore();

        let mode = this.mode();
        let thisImage = null;
        let prevImage = null;
        let animMode: "kill" | "run" | "bob" | "none" = "none";
        let dt = -1;
        if (mode === "monster") {
            let monster = this.level.monsters[this.monsterIdx];
            if (this.monsterAnim.mode === "none") {
                thisImage = monster.image;
                animMode = "bob";
            } else if (this.monsterAnim.mode === "kill" || this.monsterAnim.mode === "run") {
                dt = this.frames - this.monsterAnim.startFrame;
                thisImage = monster.image;
                prevImage = this.level.monsters[this.monsterIdx - 1].image;
                animMode = this.monsterAnim.mode;
            }
        } else if (mode === "treasureChest") {
            thisImage = Assets.textures.treasureChest;
            animMode = this.monsterAnim.mode;
            if (this.monsterAnim.mode !== "none") {
                dt = this.frames - this.monsterAnim.startFrame;
                prevImage = this.level.monsters[this.monsterIdx - 1].image;
            }
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, ART_WIDTH, ART_HEIGHT);
        ctx.clip();
        if (thisImage !== null && (animMode === "none" || animMode === "bob")) {
            let dy = 0;
            let bobSpeed = 35;
            if (animMode === "bob")
                dy = (this.frames % bobSpeed >= bobSpeed / 2) ? -1 : 1;
            ctx.drawImage(thisImage, 0, 0 + dy, ART_WIDTH, ART_HEIGHT);
        } else if (thisImage !== null && prevImage !== null && animMode === "kill") {
            if (dt < MONSTER_FALL_TIME) {
                let progress = dt / MONSTER_FALL_TIME;
                let t = 1 - (1 - progress) * (1 - progress);
                ctx.drawImage(prevImage, 0, t * ART_HEIGHT, ART_WIDTH, (1 - t) * ART_HEIGHT);
            } else {
                let progress = (dt - MONSTER_FALL_TIME) / (MONSTER_ANIM_TIME - MONSTER_FALL_TIME);
                let t = 1 - (1 - progress) * (1 - progress);
                ctx.drawImage(thisImage, (1 - t) * ART_WIDTH, 0, ART_WIDTH, ART_HEIGHT);
            }
        }
        else if (thisImage !== null && prevImage !== null && animMode === "run") {
            ctx.drawImage(prevImage, -(dt / MONSTER_ANIM_TIME) * ART_WIDTH, 0, ART_WIDTH, ART_HEIGHT);
            ctx.drawImage(thisImage, ART_WIDTH - (dt / MONSTER_ANIM_TIME) * ART_WIDTH, 0, ART_WIDTH, ART_HEIGHT);
        }
        ctx.restore()

        for (let wig of this.widgets) {
            wig.draw(ctx);
        }
    }

    private drawBoxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.strokeStyle = Consts.PENCIL_COLOR;
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Horiz dividing art and dice
        ctx.moveTo(0, ART_HEIGHT + 0.5);
        ctx.lineTo(ART_WIDTH, ART_HEIGHT + 0.5);
        // Horiz dividing dice and used dice
        ctx.moveTo(0, ART_HEIGHT + DIE_TRAY_HEIGHT + 0.5);
        ctx.lineTo(ART_WIDTH, ART_HEIGHT + DIE_TRAY_HEIGHT + 0.5);
        // Horiz dividing used dice and items
        ctx.moveTo(0, ART_HEIGHT + DIE_TRAY_HEIGHT * 2 + 0.5);
        ctx.lineTo(ART_WIDTH, ART_HEIGHT + DIE_TRAY_HEIGHT * 2 + 0.5);
        // Horiz dividing info and log
        ctx.moveTo(ART_WIDTH, INFO_BOX_HEIGHT + 0.5);
        ctx.lineTo(width, INFO_BOX_HEIGHT + 0.5);

        // Vert dividing art and info
        ctx.moveTo(ART_WIDTH + 0.5, 0);
        ctx.lineTo(ART_WIDTH + 0.5, height);

        ctx.stroke();
    }
}

class WidgetDie extends Widget<StatePlaying> {
    index: number;
    used: boolean;
    dieRollAnimFrame: number = 0;

    constructor(state: StatePlaying, x: number, y: number, w: number, h: number, index: number, used: boolean) {
        super(state, x, y, w, h);
        this.index = index;
        this.used = used;
    }

    onHoverChange(): void {
        if (this.state.coverMode.type === "none" && this.isHovered && this.state.mode() === "monster") {
            this.state.coverMode = { type: "hoverDie", index: this.index, used: this.used };
        } else if (this.state.coverMode.type === "hoverDie" && !this.isHovered) {
            this.state.coverMode = { type: "none" };
        }
    }
    onClick(): void {
        this.state.useDie(this.index, this.used);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        let diePair = (this.used ? this.state.usedDice : this.state.dice)[this.index];
        if (diePair === undefined) return;
        let [die, roll] = diePair;
        let x = this.x;
        let y = this.y;

        let draf = this.state.frames - this.dieRollAnimFrame;
        if (0 <= draf && draf < DIE_ROLL_TIME) {
            // Randomize the display.
            roll = die.roll();
            x += randint(-2, 3);
            y += randint(-2, 3);
        }
        die.draw(x, y, roll, ctx);

        let sideStr = `d${die.sides}`;
        drawStringAlign(ctx, sideStr, this.x + Die.TEX_WIDTH / 2, this.y - Consts.CHAR_HEIGHT - 4, "center");
        if (die.mod !== null)
            drawStringAlign(ctx, die.mod.short, this.x + Die.TEX_WIDTH / 2, this.y + Die.TEX_HEIGHT + 4, "center");
    }
}

class WidgetItem extends Widget<StatePlaying> {
    index: number;

    constructor(state: StatePlaying, x: number, y: number, w: number, h: number, index: number) {
        super(state, x, y, w, h);
        this.index = index;
    }

    onHoverChange(): void {
        if (this.state.coverMode.type === "none" && this.isHovered) {
            this.state.coverMode = { type: "hoverItem", index: this.index };
        } else if (this.state.coverMode.type === "hoverItem" && !this.isHovered) {
            this.state.coverMode = { type: "none" };
        }
    }
    onClick(): void {
        this.state.useItem(this.index);
    }
    draw(ctx: CanvasRenderingContext2D): void {
        let item = this.state.items[this.index];
        if (item === undefined) return;
        ctx.drawImage(item.image, this.x, this.y);

        drawStringAlign(ctx, item.short, this.x + ITEM_SIZE / 2, this.y + ITEM_SIZE + 4, "center");
    }
}

class WidgetInfoPanel extends Widget<StatePlaying> {
    constructor(state: StatePlaying, x: number, y: number, w: number, h: number) {
        super(state, x, y, w, h);
    }

    onClick(): void {
        this.state.clickInfoPanel();
    }
    draw(ctx: CanvasRenderingContext2D): void {
        let header;
        let text;
        if (this.state.coverMode.type === "hoverItem" && this.state.coverMode.index < this.state.items.length) {
            const item = this.state.items[this.state.coverMode.index];
            header = titleCase(item.name);
            text = item.description;
        } else if (this.state.coverMode.type === "hoverDie" && this.state.coverMode.index < (this.state.coverMode.used ? this.state.usedDice : this.state.dice).length) {
            const [die, roll] = (this.state.coverMode.used ? this.state.usedDice : this.state.dice)[this.state.coverMode.index];
            header = "d" + die.sides;
            text = `A d${die.sides} that has rolled a ${roll}.`;
            if (die.mod !== null) {
                text += `\n\nEquipped with ${die.mod.name}: ${die.mod.description}`;
            }
        } else if (this.state.coverMode.type === "applyingItem") {
            const item = this.state.items[this.state.coverMode.itemIdx];
            header = "Applying " + item.name;
            text = "Click on a die to apply the " + item.name + " to.";
        } else {
            let mode = this.state.mode();
            if (mode === "monster") {
                const monster = this.state.level.monsters[this.state.monsterIdx];
                header = titleCase(monster.name);
                let next = [];
                for (let i = this.state.monsterIdx + 1; i < this.state.level.monsters.length; i++) {
                    next.push(this.state.level.monsters[i].name);
                }
                next.push("treasure chest");
                text = monster.blurb + "\n\nComing up: " + next.join(", ") + ".";
            } else if (mode === "treasureChest") {
                header = `Floor ${this.state.depth + 1} defeated!`
                text = `You found a treasure chest with a d${this.state.treasureChest.sides} in it! Click here to claim it and go to the next floor.`;
            } else {
                header = "You died!";
                text = `You were defenseless against the ${this.state.level.monsters[this.state.monsterIdx].name}.\n\nClick here to see your stats.`;
            }

        }
        drawString(ctx, header, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT + 6, INFO_BOX_CHAR_WIDTH, Consts.PINK_LINE_COLOR);
        drawString(ctx, text, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT * 3, INFO_BOX_CHAR_WIDTH);
    }
}

type CoverMode = {
    type: "none"
} | {
    type: "hoverItem",
    index: number,
} | {
    type: "hoverDie",
    index: number,
    used: boolean,
} | {
    type: "applyingItem",
    itemIdx: number,
};
