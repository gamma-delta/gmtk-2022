import { Consts } from "../consts.js";
import { InputState } from "../inputs.js";
import { Die, Level, LevelHarness, Player } from "../model.js";
import { DrawInfo, GameState } from "../states.js";
import { drawString } from "../utils.js";

const ART_WIDTH = 160;
const ART_HEIGHT = 220;
const INFO_BOX_WIDTH = Consts.CHAR_WIDTH * 20;
const DIE_TRAY_WIDTH = 320;
const DIE_TRAY_HEIGHT = 40;

export class StatePlaying implements GameState {
    harness: LevelHarness;
    log: string[] = [
        "Welcome to Roll-Playing Game.",
        "You hold your newspaper hat tight to your head as you step into the dungeon, dust billowing like an ancient book under your footsteps.\n"
        + "Your mentor's surprisingly-salient advice echoes in your head: \"When you enter a floor of the dungeon, your dice are rolled. "
        + "Use that pool of numbers to defeat the various enemies along the way and make it to the staircase!\""
    ];
    monsterIdx: number = 0;

    static start() {
        const player = new Player([
            new Die(4),
            new Die(6),
            new Die(8),
            new Die(10),
            new Die(12),
            new Die(20),
        ]);
        const level = Level.generateFromDepth(0);
        const harness = new LevelHarness(player, level);
        console.log(harness);
        return new StatePlaying(harness);
    }

    private constructor(harness: LevelHarness) {
        this.harness = harness;
    }

    update(controls: InputState): GameState | null {
        if (controls.isClicked("mouse")) {
            // todo
        }
        return null;
    }
    draw(controls: InputState, ctx: CanvasRenderingContext2D, { width, height, }: DrawInfo) {
        this.drawBoxes(ctx, width, height);

        const monster = this.harness.level.monsters[this.monsterIdx];
        drawString(ctx, monster.name, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT, 20, Consts.PINK_LINE_COLOR);
        drawString(ctx, monster.blurb, ART_WIDTH + Consts.CHAR_WIDTH / 2, Consts.CHAR_HEIGHT * 3, 20);

        let dieIdx = 0;
        let usedDieIdx = 0;
        for (let [i, die] of this.harness.player.dice.entries()) {
            if (this.harness.eatenDice.has(i)) continue;

            let isUsed = this.harness.usedDice.has(i);
            let x = Consts.VERT_LINE_OFFSET + 4 + (isUsed ? usedDieIdx : dieIdx) * (Die.TEX_WIDTH + Consts.CHAR_WIDTH);
            let y = ART_HEIGHT + 8 + (isUsed ? DIE_TRAY_HEIGHT : 0);
            die.draw(x, y, this.harness.rolledDice[i], ctx);

            let sideStr = `d${die.sides}`;
            drawString(ctx, sideStr, x + Die.TEX_WIDTH / 2 - (sideStr.length / 2 * Consts.CHAR_WIDTH), y + Die.TEX_HEIGHT + 4);
            if (isUsed) {
                usedDieIdx++;
            } else {
                dieIdx++;
            }
        }
    }

    private drawBoxes(ctx: CanvasRenderingContext2D, width: number, height: number) {
        ctx.strokeStyle = Consts.PENCIL_COLOR;
        ctx.lineWidth = 1;

        ctx.beginPath();
        // Horiz dividing art and dice
        ctx.moveTo(0, ART_HEIGHT + 0.5);
        ctx.lineTo(width, ART_HEIGHT + 0.5);
        // Horiz dividing dice and used dice
        ctx.moveTo(0, ART_HEIGHT + DIE_TRAY_HEIGHT + 0.5);
        ctx.lineTo(width, ART_HEIGHT + DIE_TRAY_HEIGHT + 0.5);
        // Vert dividing art and info
        ctx.moveTo(ART_WIDTH + 0.5, 0);
        ctx.lineTo(ART_WIDTH + 0.5, ART_HEIGHT);
        // Vert dividing info and log
        ctx.moveTo(ART_WIDTH + INFO_BOX_WIDTH + 0.5, 0);
        ctx.lineTo(ART_WIDTH + INFO_BOX_WIDTH + 0.5, ART_HEIGHT);
        // Vert dividing dice and items
        ctx.moveTo(DIE_TRAY_WIDTH + 0.5, ART_HEIGHT);
        ctx.lineTo(DIE_TRAY_WIDTH + 0.5, height);
        ctx.stroke();
    }
}