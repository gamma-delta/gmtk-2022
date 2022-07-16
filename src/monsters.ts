import { DieMod, DieMods, Item, Items } from "./items.js";
import { pick, randint } from "./utils.js";

export interface Monster {
    defeatedBy(dice: number[], idx: number): boolean;
    itemDropped(): Item | null;
    name: string,
    blurb: string,
    bodyParts: string[],
}

export const Monsters = {
    modron: (rank: number): Monster => ({
        defeatedBy: (dice, idx) => dice[idx] % rank === 0,
        itemDropped() {
            if (Math.random() < 0.7) return null;
            return Items.toItem(DieMods.modronCore(rank));
        },
        name: ["monodron", "duodron", "tridron", "quadron", "pentadron"][rank - 1],
        blurb: makeModronBlurb(rank),
        bodyParts: ["chassis", "core", "gears", "wing", "antenna", "plating"]
    }),
    dragon: (heads: number): Monster => ({
        defeatedBy: (dice, idx) => dice[idx] === heads,
        itemDropped: () => null,
        name: ["zero?!", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][heads] + "-headed dragon",
        blurb: `Defeated by the number ${heads}.\n\nDragonologists INSIST on calling garden-variety dragons "one-headed dragons." Dragonologists are no fun at parties.`,
        bodyParts: ["eye", "head", "heart", "wing", "neck"]
    }),
    highdra: (): Monster => ({
        defeatedBy(dice, idx) {
            const max = Math.max(...dice);
            return dice[idx] === max;
        },
        itemDropped() {
            if (Math.random() < 0.2) return null;
            return Items.toItem(DieMods.highdraHead());
        },
        name: "high-dra",
        blurb: "Defeated by your highest die.\n\nThe high-dra is a cousin to the pi-dra. Pi-dras were hunted to extinction in 754 I.E. after people got sick of dealing with the points they left floating everywhere.",
        bodyParts: ["head", "other head", "other other head"],
    }),
    pirate: (threshold: number): Monster => ({
        defeatedBy(dice, idx) {
            let roll = dice[idx];
            let count = 0;
            for (let die of dice) {
                if (die === roll) {
                    count++;
                }
            }
            return count >= threshold;
        },
        itemDropped() {
            if (Math.random() < 0.5) return null;
            let type = (threshold <= 2) ? "silver" : "gold";
            let mod = pick([
                DieMods.nloon(2, type as any),
                DieMods.nloon(3, type as any),
            ]);
            return Items.toItem(mod);
        },
        name: ["birate", "trirate"][threshold - 2],
        blurb: `Defeated by a number you have ${threshold} or more of.\n\nMost pirates were driven out of work during 754 I.E.`
            + ` Interestingly enough, although pirates were human, birates and trirates are actually fungi that perfectly resemble humans.`,
        bodyParts: ["eye patch", "hook hand", "peg leg", "grog"]
    }),
    goblin: (): Monster => ({
        defeatedBy(dice, idx) {
            let roll = dice[idx];
            for (let i = 2; i <= Math.ceil(Math.sqrt(roll)); i++) {
                if (roll % i === 0) {
                    return true;
                }
            }
            return false;
        },
        itemDropped() {
            if (Math.random() < 0.6) return null;
            return Items.luckPotion();
        },
        name: "cobble goblin",
        blurb: "Defeated by composite numbers. 1 is not composite.\n\nIt's this little goblin's first day on dungeon duty, and all it could find was this patchy armor that lets composite numbers through. Poor thing.",
        bodyParts: ["leg", "arm", "head", "nose", "eye", "pointy ear"]
    }),
    goblinLord: (): Monster => ({
        defeatedBy(dice, idx) {
            let roll = dice[idx];
            for (let i = 2; i <= Math.ceil(Math.sqrt(roll)); i++) {
                if (roll % i === 0) {
                    return false;
                }
            }
            return true;
        },
        itemDropped() {
            if (Math.random() < 0.6) return null;
            return Items.greaterLuckPotion();
        },
        name: "prime goblin",
        blurb: "Defeated by prime numbers. 1 is not prime.\n\nAt some point, the idea of giving a prime goblin a cobble goblin's armor was raised, but the discussion fell apart. The goblins couldn't decide what to do with the number 1, given most of them can't count much higher.",
        bodyParts: ["leg", "arm", "head", "nose", "eye", "pointy ear"]
    }),
    gelatinousSquare: (): Monster => ({
        defeatedBy(dice, idx) {
            let roll = dice[idx];
            let sqrt = Math.sqrt(roll);
            return Math.abs((sqrt - Math.round(sqrt))) < 0.0001;
        },
        itemDropped() {
            if (Math.random() < 0.6) return null;
            return Items.healingPotion();
        },
        name: "gelatinous square",
        blurb: "Defeated by square numbers.\n\nJust a plane ol' gelatinous square.",
        bodyParts: ["gel", "gelatin", "corner", "edge"],
    }),
    gelatinousCube: (): Monster => ({
        defeatedBy(dice, idx) {
            let roll = dice[idx];
            let cbrt = Math.cbrt(roll);
            return Math.abs((cbrt - Math.round(cbrt))) < 0.0001;
        },
        itemDropped() {
            if (Math.random() < 0.6) return null;
            return Items.greaterHealingPotion();
        },
        name: "gelatinous cube",
        blurb: 'Defeated by cubic numbers.\n\nIn the old days, gelatinous cubes used to be farmed for their gelatin. It was marketed as a "cruelty-free" or vegetarian gelatin, saving those poor pigs from getting their joints melted down. For some reason, people still bought it.',
        bodyParts: ["gel", "gelatin", "corner", "edge", "face"],
    })

}

function makeModronBlurb(rank: number): string {
    let defeat = (rank === 1) ? "Defeated by any number." : `Defeated by multiples of ${rank}.`;
    let message = [
        "Poor monodrons. These foot soldiers of Primus' army are so brittle, any number you throw at them will defeat them."
        + " One wonders why a god of order and logic would spend so much time making something so useless.",
        "Primus' priests hold that when a higher-ranking modron dies, a modron of the rank below somewhere in the multiverse becomes a rank higher in a puff of smoke."
        + " No one has ever actually seen this happen, however. Devotees claim this is proof of Primus' power; there are simply so many modrons the chance that the"
        + " one you're fighting gets upgraded is infinitesimal.",
        "Legend has it that the various arities of modron are not actually progressively stronger."
        + " They simply acquire a taste for more exotic numbers as their processors get more sophisticated.",
        "Quadrons are the lowest rank of modron with the ability to speak. They spend much of this newfound power griping about "
        + ' how much they hate being called quadcopters and emphasizing that "quadron" is pronounced with a short "o."',
        'As the popular jumprope rhyme goes: "Five, Ten, Fifteen, Twenty. Never leave the-- OH GOD A PENTADRON RUN"'
    ][rank - 1];
    return `${defeat}\n\n${message}`;
}

export const MonstersAndDifficulties: Array<{ monster: () => Monster, difficulty: number }> = [
    { monster: () => Monsters.modron(1), difficulty: 1 },
    { monster: () => Monsters.goblin(), difficulty: 2 },
    { monster: () => Monsters.modron(2), difficulty: 2 },
    { monster: () => Monsters.highdra(), difficulty: 3 }, { monster: () => Monsters.highdra(), difficulty: 3 }, { monster: () => Monsters.highdra(), difficulty: 3 },
    { monster: () => Monsters.goblinLord(), difficulty: 3 }, { monster: () => Monsters.goblinLord(), difficulty: 3 }, { monster: () => Monsters.goblinLord(), difficulty: 3 },
    { monster: () => Monsters.modron(3), difficulty: 4 },
    { monster: () => Monsters.modron(4), difficulty: 5 },
    { monster: () => Monsters.gelatinousSquare(), difficulty: 6 }, { monster: () => Monsters.gelatinousSquare(), difficulty: 6 },
    { monster: () => Monsters.modron(5), difficulty: 6 },
    { monster: () => Monsters.gelatinousCube(), difficulty: 7 }, { monster: () => Monsters.gelatinousCube(), difficulty: 7 },
    { monster: () => Monsters.pirate(2), difficulty: 8 },
    { monster: () => Monsters.dragon(randint(1, 11)), difficulty: 10 },
    { monster: () => Monsters.pirate(3), difficulty: 12 },
]