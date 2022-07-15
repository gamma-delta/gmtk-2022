const Consts = {
    fps: 30,
    canvasScale: 4,
};
var GameMode;
(function (GameMode) {
    GameMode[GameMode["Title"] = 0] = "Title";
    GameMode[GameMode["Tutorial"] = 1] = "Tutorial";
    GameMode[GameMode["Playing"] = 2] = "Playing";
})(GameMode || (GameMode = {}));
export { Consts };
