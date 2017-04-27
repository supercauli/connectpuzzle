var MainLayer = cc.Layer.extend({
    sprite:null,
    ctor:function () {
        this._super();

        var p = findGetParameter("p");
        if(p) {
            var logicPuzzle = JSON.parse(LZString.decompressFromBase64(p));
            if(logicPuzzle) {
                var puzzleUI = new PuzzleUI(JSON.parse(LZString.decompressFromBase64(p)), 900, 900);
                puzzleUI.setAnchorPoint(0.5, 0.5);
                puzzleUI.setPositionX(cc.winSize.width/2);
                puzzleUI.setPositionY(cc.winSize.height/2);
                this.addChild(puzzleUI);
            } else {

            }
        } else {

        }
        return true;
    }
});

var MainScene = cc.Scene.extend({
    onEnter:function () {
        cc.spriteFrameCache.addSpriteFrames(res.puzzle_plist);
        this._super();
        var layer = new MainLayer();
        this.addChild(layer);
    }
});

