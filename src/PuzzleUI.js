/**
 * Created by tuantri on 02/02/2017.
 */

var PuzzleUI = cc.Node.extend({

    _n:0,
    _m:0,
    _contentSizeWidth:0,
    _contentSizeHeight:0,
    _borderSize:10,

    border:null,
    puzzle:null,

    ctor:function(puzzleInfo, width, height){
        this._super();

        if(!width) width = cc.winSize.width;
        if(!height) height = cc.winSize.height;

        this.n = puzzleInfo.n;
        this.m = puzzleInfo.m;

        this._calculateContentSize(this.n, this.m, width, height);

        this.puzzle = new Puzzle(puzzleInfo);
        this.puzzle.scaleToFitArea(this._contentSizeWidth-2*this._borderSize, this._contentSizeHeight - 2*this._borderSize);
        this.puzzle.x = this._borderSize;
        this.puzzle.y = this._borderSize;
        this.addChild(this.puzzle);

        this.border = new cc.Scale9Sprite(GUIRes.puzzle_border);
        this.border.setAnchorPoint(0, 0);
        this.border.setInsetTop(20);
        this.border.setInsetBottom(20);
        this.border.setInsetLeft(20);
        this.border.setInsetRight(20);
        this.border.setContentSize(cc.size(this._contentSizeWidth, this._contentSizeHeight));
        this.addChild(this.border);
        this.setContentSize(cc.size(this._contentSizeWidth, this._contentSizeHeight));
    },

    _calculateContentSize:function(n, m, width, height){
        var pWidth = width - 2*this._borderSize;
        var pHeight = height - 2*this._borderSize;

        if (n/m > pWidth/pHeight) {
            pHeight = pWidth*m/n;
        } else {
            pWidth = pHeight*n/m;
        }
        this._contentSizeWidth = pWidth + 2*this._borderSize;
        this._contentSizeHeight = pHeight + 2*this._borderSize;
    },

    scaleToFitArea:function(width, height){
        this._calculateContentSize(this.n, this.m, width, height);
        this.puzzle.scaleToFitArea(this._contentSizeWidth-2*this._borderSize, this._contentSizeHeight - 2*this._borderSize);
        this.border.setContentSize(cc.size(this._contentSizeWidth, this._contentSizeHeight));
        this.setContentSize(cc.size(this._contentSizeWidth, this._contentSizeHeight));
    },

    setPuzzleCompletedCallback:function(callback){
        this.puzzle.setPuzzleCompletedCallback(callback);
    }

});