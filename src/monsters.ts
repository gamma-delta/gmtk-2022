import { DieMod } from "./model.js";

export interface Monster {
    defeatedBy(dice: number[], idx: number): boolean;
    itemsDropped(): DieMod[];
    name: string,
    blurb: string,
}

export const Monsters = {
    modron: (rank: number): Monster => ({
        defeatedBy: (dice, idx) => dice[idx] % rank === 0,
        itemsDropped: () => [],
        name: ["Monodron", "Duodron", "Tridron", "Quadron", "Pentadron"][rank - 1],
        blurb: makeModronBlurb(rank),
    }),
    dragon: (heads: number): Monster => ({
        defeatedBy: (dice, idx) => dice[idx] === heads,
        itemsDropped: () => [],
        name: ["Zero?!", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][heads] + "-headed Dragon",
        blurb: `Defeated by the number ${heads}.\n\nDragonologists INSIST on calling garden-variety dragons "one-headed dragons." Dragonologists are no fun at parties.`
    }),
    highdra: (): Monster => ({
        defeatedBy(dice, idx) {
            const max = Math.max(...dice);
            return dice[idx] === max;
        },
        itemsDropped: () => [],
        name: "High-dra",
        blurb: "Defeated by your highest die.\n\nThe high-dra is a cousin to the pi-dra. Pi-dras were hunted to extinction in I.E. 754 after people got sick of dealing with the points they left floating everywhere."
    }),
}

function makeModronBlurb(rank: number): string {
    let defeat = (rank === 1) ? "Defeated by any number." : `Defeated by multiples of ${rank}.`;
    let message = [
        "Poor monodrons. These foot soldiers of Primus' army are so brittle, any number you throw at them will defeat them." +
        " One wonders why a god of order and logic would spend so much time making something so useless.",
        "When a higher-ranking modron dies, a modron of the rank below somewhere in the multiverse becomes a rank higher in a puff of smoke.",
        "Legend has it that the various arities of modron are not actually progressively stronger." +
        " They simply acquire a taste for more exotic numbers, like a wine snob.",
        "Quadrons are the lowest rank of modron with the ability to speak. They spend much of this newfound power griping about " +
        ' how much they hate being called quadcopters and emphasizing that "quadron" is pronounced with a short "o."',
        'As a popular jumprope rhyme goes: "Five, Ten, Fifteen, Twenty. Never leave the-- OH GOD A PENTADRON RUN"'
    ][rank - 1];
    return `${defeat}\n\n${message}`;
}