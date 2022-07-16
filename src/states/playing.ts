import { Consts } from "../consts.js";
import { InputState } from "../inputs.js";
import { Die, DieMod, Level, PlayerClasses } from "../model.js";
import { DrawInfo, GameState } from "../states.js";
import { lethalDamage, nonLethalDamage } from "../strings.js";
import { drawString, drawStringAlign, pick, splitIntoWordsWithLen, titleCase } from "../utils.js";
import { Widget } from "../widget.js";
import { StateLose } from "./lose.js";

const ART_WIDTH = 240;
const ART_HEIGHT = 240;
const INFO_BOX_HEIGHT = Consts.CHAR_WIDTH * 23.75;
const DIE_TRAY_HEIGHT = 48;
const INFO_BOX_CHAR_WIDTH = 48;

export class StatePlaying implements GameState {
    level: Level;
    log: string[];
    monsterIdx: number = 0;

    dice: [Die, number][];
    // Indices of used-up dice
    usedDice: [Die, number][];
    items: DieMod[];

    depth: number;
    swapState: GameState | null = null;

    static MAX_DIE_COUNT = 8;

    widgets: Widget<StatePlaying>[];
    panelMode: PanelMode = "monster";
    treasureChest: Die;

    static start() {
        const startLog = [
            ":: Welcome to Roll-Playing Game.",
            ":: You hold your newspaper hat tight to your head as you step into the dungeon, dust billowing like an ancient book under your footsteps.",
            ":: Your mentor's advice echoes in your head:",
            ':: "Click on a die to fight a monster with what you rolled. If you succeed, you get your die back, to be re-rolled when you reach the staircase."'
        ];

        const clazz = PlayerClasses[0];

        const level = Level.generateFromDepth(0);
        return new StatePlaying(level, 0, clazz.dice, clazz.items, startLog);
    }

    private constructor(level: Level, depth: number, dice: Die[], items: DieMod[], log: string[]) {
        this.level = level;
        this.depth = depth;

        this.dice = dice.map(die => [die, die.roll()]);
        this.usedDice = [];
        this.items = items;

        this.widgets = [];
        for (let used of [false, true]) {
            for (let i = 0; i < StatePlaying.MAX_DIE_COUNT; i++) {
                let x = Consts.VERT_LINE_OFFSET + Consts.CHAR_WIDTH + i * (Die.TEX_WIDTH + Consts.CHAR_WIDTH);
                let y = ART_HEIGHT + 16 + (used ? DIE_TRAY_HEIGHT : 0);
                this.widgets.push(new WidgetDie(this, x, y, Die.TEX_WIDTH, Die.TEX_HEIGHT, i, used));
            }
        }
        this.widgets.push(new WidgetInfoPanel(this, ART_WIDTH, 0, 999999, ART_WIDTH));
        this.log = log;

        this.treasureChest = new Die(pick([4, 6, 8, 10, 12, 20]));
    }

    update(controls: InputState): GameState | null {
        for (let wig of this.widgets) {
            wig.update(controls);
        }

        if (this.monsterIdx >= this.level.monsters.length) {
            this.panelMode = "treasureChest";
        } else if (this.dice.length === 0) {
            this.panelMode = "lose";
        }

        return this.swapState;
    }

    useDie(index: number) {
        if (index >= this.dice.length || this.monsterIdx >= this.level.monsters.length) { return; }

        const monster = this.level.monsters[this.monsterIdx];
        let defeated = monster.defeatedBy(this.dice.map(pair => pair[1]), index);
        let [diePair] = this.dice.splice(index, 1);
        if (defeated) {
            this.usedDice.push(diePair);
            this.log.push(":: " + lethalDamage(diePair[1], monster));
            this.log.push(`:: The ${monster.name} dies!`);
            this.log.push(`:: You retrieve your d${diePair[0].sides}.`);
        } else {
            this.log.push(":: " + nonLethalDamage(diePair[1], monster));
            this.log.push(`:: It slinks off into the darkness with your d${diePair[0].sides}.`);
        }
        this.monsterIdx++;
    }

    clickInfoPanel() {
        if (this.panelMode === "treasureChest") {
            let nextLevel = Level.generateFromDepth(this.depth + 1);
            let dice = this.dice.map(d => d[0]);
            dice.push(...this.usedDice.map(d => d[0]));
            if (dice.length < StatePlaying.MAX_DIE_COUNT) {
                dice.push(this.treasureChest);
                this.log.push(`:: You take the d${this.treasureChest.sides}.`);
            } else {
                this.log.push(`:: You had no room for the d${this.treasureChest.sides}, so you left it there.`);
            }
            this.log.push(`:: You descend the stairs deeper into the dungeon, down to floor ${this.depth + 2}.`);
            this.swapState = new StatePlaying(nextLevel, this.depth + 1, dice, this.items, this.log);
        } else if (this.panelMode === "lose") {
            this.swapState = new StateLose({
                depth: this.depth,
                diedTo: this.level.monsters[this.monsterIdx],
            });
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
        drawStringAlign(ctx, "Ready", -ART_HEIGHT - DIE_TRAY_HEIGHT / 2, Consts.CHAR_HEIGHT * 0.5, "center");
        drawStringAlign(ctx, "Used", -ART_HEIGHT - DIE_TRAY_HEIGHT * 1.5, Consts.CHAR_HEIGHT * 0.5, "center");
        ctx.restore();

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

    constructor(state: StatePlaying, x: number, y: number, w: number, h: number, index: number, used: boolean) {
        super(state, x, y, w, h);
        this.index = index;
        this.used = used;
    }

    onClick(): void {
        if (!this.used) {
            this.state.useDie(this.index);
        }
    }
    draw(ctx: CanvasRenderingContext2D): void {
        let diePair = (this.used ? this.state.usedDice : this.state.dice)[this.index];
        if (diePair === undefined) return;
        let [die, roll] = diePair;
        die.draw(this.x, this.y, roll, ctx);

        let sideStr = `d${die.sides}`;
        drawStringAlign(ctx, sideStr, this.x + Die.TEX_WIDTH / 2, this.y - Consts.CHAR_HEIGHT - 4, "center");
        if (die.mod !== null)
            drawStringAlign(ctx, die.mod.short, this.x + Die.TEX_WIDTH / 2, this.y + Die.TEX_HEIGHT + 4, "center");
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
        if (this.state.panelMode === "monster") {
            const monster = this.state.level.monsters[this.state.monsterIdx];
            header = titleCase(monster.name);
            let next = [];
            for (let i = this.state.monsterIdx + 1; i < this.state.level.monsters.length; i++) {
                next.push(this.state.level.monsters[i].name);
            }
            next.push("treasure chest");
            text = monster.blurb + "\n\nComing up: " + next.join(", ") + ".";
        } else if (this.state.panelMode === "treasureChest") {
            header = `Floor ${this.state.depth + 1} defeated!`
            text = `You found a treasure chest with a d${this.state.treasureChest.sides} in it! Click here to claim it and go to the next floor.`;
        } else {
            header = "You died!";
            text = `You were defenseless against the ${this.state.level.monsters[this.state.monsterIdx].name}.\n\nClick here to see your stats.`;
        }
        drawString(ctx, header, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT + 6, INFO_BOX_CHAR_WIDTH, Consts.PINK_LINE_COLOR);
        drawString(ctx, text, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT * 3, INFO_BOX_CHAR_WIDTH);
    }
}

type PanelMode = "monster" | "treasureChest" | "lose";
