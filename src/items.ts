import { Die } from "./model.js";
import { randint, titleCase } from "./utils.js";

export interface DieMod {
    modifyRoll(die: Die, roll: number): number,
    name: string,
    short: string,
    description: string,
    flavor: string,
}

export const DieMods = {
    modronCore(rank: number): DieMod {
        return {
            modifyRoll(die, roll) {
                return rank;
            },
            name: "Modron Core " + rank,
            short: "=" + rank,
            description: `Makes the die always roll ${rank}.`,
            flavor: `Due to Primus' divine influence, a modron's core suppresses probability near itself.`
        }
    },
    highdraHead(): DieMod {
        return {
            modifyRoll(die, roll) {
                return die.sides;
            },
            name: "High-dra Head",
            short: "MAX",
            description: "Makes the die always roll its highest possible value.",
            flavor: "High-dra venom is sometimes sold in irreputable taverns for its ... strengthening effects."
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
            // cp437 cent ... well
            // Wikipedia and my spritesheet disagree here.
            short = "\xbd" + multiplier;
        }
        let coinType = ["doubloon", "trebloon"][multiplier - 2];
        return {
            modifyRoll(die, roll) {
                if (metal === "gold") {
                    return roll * multiplier;
                } else {
                    return randint(1, die.sides * multiplier + 1);
                }
            },
            name: metal + " " + coinType,
            short,
            description,
            flavor: "Doubloons and trebloons are actually useless as currency, due to their tendency to mess up ledgers and accounting books.",
        }
    }
}

export interface Item {
    data: {
        type: "mod"
        dieMod: DieMod,
    } | {
        type: "restoreOne",
    } | {
        type: "restoreAll",
    } | {
        type: "rerollOne"
    } | {
        type: "rerollAll"
    },
    name: string,
    short: string,
    description: string,
}

export const Items = {
    healingPotion(): Item {
        return {
            name: "healing potion",
            short: "\x7f1", // cp437 house
            description: "Restores a single die.",
            data: { type: "restoreOne" }
        }
    },
    greaterHealingPotion(): Item {
        return {
            name: "greater healing potion",
            short: "\x7fA",
            description: "Restores all your dice.",
            data: { type: "restoreAll" }
        }
    },
    luckPotion(): Item {
        return {
            name: "luck potion",
            short: "\xf51", // section, but looks like a swirl
            description: "Rerolls a single die.",
            data: { type: "rerollOne" }
        }
    },
    greaterLuckPotion(): Item {
        return {
            name: "greater luck potion",
            short: "\xf5A",
            description: "Rerolls all your dice.",
            data: { type: "rerollAll" }
        }
    },
    toItem(mod: DieMod): Item {
        return {
            name: mod.name,
            short: mod.short,
            description: "Equipment. " + mod.description + "\n\n" + mod.flavor,
            data: {
                type: "mod",
                dieMod: mod,
            }
        }
    }
}