import { Monster } from "./monsters.js";
import { pick } from "./utils.js";

export function lethalDamage(roll: number, monster: Monster) {
    let verb = pick([
        "plunges",
        "swings",
        "crushes",
        "tears",
    ]);
    let adverb = pick([
        "wetly ",
        "satisfyingly ",
        "ferociously ",
        ""
    ]);
    let bodyPart = pick(monster.bodyParts);
    let excitement = pick([
        ".", ".", "!", "!!"
    ]);
    return `Your ${roll} ${verb} ${adverb}through the ${monster.name}'s ${bodyPart}${excitement}`;
}
export function nonLethalDamage(roll: number, monster: Monster) {
    let verb = pick([
        "pings",
        "bounces",
        "skitters",
        "flops"
    ]);
    let prep = pick([
        "off",
        "against",
        "across"
    ]);
    let adverb = pick([
        "pathetically ",
        "limply ",
        "", ""
    ]);
    let bodyPart = pick(monster.bodyParts);
    let excitement = pick([
        ".", ".", "..."
    ]);
    return `Your ${roll} ${adverb}${verb} ${prep} the ${monster.name}'s ${bodyPart}${excitement}`;
}