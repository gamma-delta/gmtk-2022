const Assets = {
    textures: {
        font: image("font"),
        numberFont: image("number_font"),
        diceAtlas: image("dice"),

        monodron: image("monsters/monodron"),
        duodron: image("monsters/duodron"),
        tridron: image("monsters/tridron"),
        quadron: image("monsters/quadron"),
        pentadron: image("monsters/pentadron"),
        cobbleGoblin: image("monsters/goblin"),
        goblinLord: image("monsters/goblin_lord"),
        gelatinousSquare: image("monsters/gelatinous_square"),
        gelatinousCube: image("monsters/gelatinous_cube"),
        dragon: image("monsters/dragon"),
        ninja: image("monsters/masterful_ninja"),
    },
    audio: {
        bgMusic: audio("dicejam.mp3")
    }
};

function image(url: string) {
    let img = new Image();
    img.src = "assets/textures/" + url + ".png";
    return img;
}

function audio(url: string) {
    let audio = new Audio();
    audio.src = "assets/audio/" + url;
    return audio;
}

export { Assets };