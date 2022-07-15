const Assets = {
    textures: {
        font: image("font")
    },
    audio: {
        bgMusic: audio("punch_card_blues")
    }
};

function image(url: string) {
    let img = new Image();
    img.src = "assets/textures/" + url + ".png";
    return img;
}

function audio(url: string) {
    let audio = new Audio();
    audio.src = "assets/audio/" + url + ".ogg";
    return audio;
}

export { Assets };