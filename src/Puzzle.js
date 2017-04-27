var CellConfig = {
    cell_width: 100,
    cell_height: 100
};

var CellUtil = {
    setPositionToCenterCell: function (node) {
        node.x = CellConfig.cell_width / 2;
        node.y = CellConfig.cell_height / 2;
    }
};

var CellType = {
    //Ô trống
    EMPTY: 0,
    //Ô chứa số
    DOT: 1,
    //Đá
    STONE: 2,
    //Cầu
    BRIDGE: 3,
    //Chặn
    BLOCK: 4,
    //Đi thẳng
    GO_STRAIGHT_DIRECTION: 5,
    //Rẽ
    TURN_DIRECTION: 6,

    isFillableNotBridge: function (type) {
        if (type == CellType.EMPTY
            || type == CellType.BLOCK
            || type == CellType.GO_STRAIGHT_DIRECTION
            || type == CellType.TURN_DIRECTION
        ) {
            return true;
        } else {
            return false;
        }
    },

    isFillable: function (type) {
        if (type == CellType.EMPTY
            || type == CellType.BLOCK
            || type == CellType.GO_STRAIGHT_DIRECTION
            || type == CellType.TURN_DIRECTION
            || type == CellType.BRIDGE
        ) {
            return true;
        } else {
            return false;
        }
    }
};

var ColorManager = cc.Class.extend({
    map: null,
    ctor: function (map) {
        if (map == undefined) {
            this.map = ColorManager.default_map;
        } else {
            this.map = map;
        }
    },

    getColor: function (colorOrder) {
        if (colorOrder >= 0 && colorOrder <= this.map.length) {
            return this.map[colorOrder][0];
        } else {
            return cc.color.BLACK;
        }
    },

    getColorNumber:function(colorOrder){
        if (colorOrder >= 0 && colorOrder <= this.map.length) {
            return this.map[colorOrder][1];
        } else {
            return cc.color.WHITE;
        }
    }

});

function hslColor(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return cc.color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), 255);
}

// var hue = [28, 42, 64, 86, 118, 150, 194, 220, 240];

ColorManager.default_map = [
    // [hslColor(0.0, 1, 0.48), hslColor(0.0, 1, 0.15)],
    // [hslColor(0.1, 1, 0.48), hslColor(0.1, 1, 0.15)],
    [hslColor(0.2, 1, 0.6), hslColor(0.2, 1, 0.2)],
    [hslColor(0.4, 1, 0.6), hslColor(0.4, 1, 0.2)],
    [hslColor(0.6, 1, 0.6), hslColor(0.6, 1, 0.2)],
    [hslColor(0.1, 1, 0.6), hslColor(0.1, 1, 0.2)],
    [hslColor(0.8, 1, 0.6), hslColor(0.8, 1, 0.2)],
];
// ColorManager.default_map = [];
// for(var i=0; i<hue.length; i++) {
//     ColorManager.default_map.push([hslColor(hue[i]/255, 1, 0.48), hslColor(hue[i]/255, 1, 0.15)]);
// }

//TODO
ColorManager.getColorManager = function(numberSequence){
    switch (numberSequence) {
        case 1:
            return new ColorManager([cc.color.BLUE]);
            break;
        case 2:
            return new ColorManager([cc.color.BLUE, cc.color.RED]);
            break;
        case 3:

            break;
        case 4:
            break;
        case 5:
            break;
        case 6:
            break;
    }
};

/**
 * Đại diện cho một puzzle (về mặt logic).
 * Có thể lưu dưới dạng json.
 */
var PuzzleLogic = cc.Class.extend({

    //Số cột
    n: 0,
    //Số hàng
    m: 0,
    //Danh sách các stones [{x:, y:}...]
    stones: null,
    //Danh sách các cầu [{x:, y:}...]
    bridges: null,
    //Danh sách các block [{x:, y:, n:}]
    blocks: null,
    //Danh sách các chuỗi dot
    dot_sequences: null,
    //Danh sách các ô đi thẳng
    straights: null,
    //Danh sách các ô rẽ
    turns: null,
    map: null,
    hints:null,

    ctor: function (params) {
        cc.assert(params.n);
        cc.assert(params.m);
        this.n = params.n;
        this.m = params.m;
        this.stones = params.stones ? params.stones : [];
        this.bridges = params.bridges ? params.bridges : [];
        this.blocks = params.blocks ? params.blocks : [];
        this.dot_sequences = params.dot_sequences ? params.dot_sequences : [];
        this.straights = params.straights ? params.straights : [];
        this.turns = params.turns ? params.turns : [];
        this.hints = params.hints ? params.hints : [];
        this._generateMap();
    },

    browseAllDotPosition: function (callback) {
        for (var i = 0; i < this.dot_sequences.length; i++) {
            var dot_sequence = this.dot_sequences[i];
            var color_order = i;
            for (var k = 0; k < dot_sequence.length; k++) {
                var isEndSequence = false;
                var dot_order = k;
                if (k == dot_sequence.length - 1) {
                    isEndSequence = true;
                } else {
                    isEndSequence = false;
                }
                callback(dot_sequence[k].x, dot_sequence[k].y, color_order, dot_order, isEndSequence);
            }
        }
    },

    getNumberPathNeeded: function () {
        var numberPath = 0;
        for (var i = 0; i < this.dot_sequences.length; i++) {
            var dot_sequence = this.dot_sequences[i];
            numberPath += dot_sequence.length - 1;
        }
        return numberPath;
    },

    _generateMap: function () {
        var map = [];

        for (var i = 0; i < this.n; i++) {
            map[i] = [];
            for (var j = 0; j < this.m; j++) {
                map[i][j] = {type: CellType.EMPTY}
            }
        }

        for (var i = 0; i < this.stones.length; i++) {
            var p = this.stones[i];
            map[p.x][p.y].type = CellType.STONE;
        }

        for (var i = 0; i < this.bridges.length; i++) {
            var p = this.bridges[i];
            map[p.x][p.y].type = CellType.BRIDGE;
        }

        for (var i = 0; i < this.straights.length; i++) {
            var p = this.straights[i];
            map[p.x][p.y].type = CellType.GO_STRAIGHT_DIRECTION;
        }

        for (var i = 0; i < this.turns.length; i++) {
            var p = this.turns[i];
            map[p.x][p.y].type = CellType.TURN_DIRECTION;
        }

        for (var i = 0; i < this.blocks.length; i++) {
            var p = this.blocks[i];
            map[p.x][p.y].type = CellType.BLOCK;
            map[p.x][p.y].n = p.n;
        }

        for (var i = 0; i < this.dot_sequences.length; i++) {
            var sequence = this.dot_sequences[i];
            for (var j = 0; j < sequence.length; j++) {
                var p = sequence[j];
                map[p.x][p.y].type = CellType.DOT;
                map[p.x][p.y].sequence_order = i;
                map[p.x][p.y].dot_order = j;
                map[p.x][p.y].sequence_length = sequence.length;
            }
        }

        this.map = map;

        return map;
    },

    toString:function(){
        return JSON.stringify(this);
    },

    toStringZip:function(){
        return LZString.compressToUTF16(string);
    }
});

var SEGMENT_DIRECTION = {

    TOP_PATH: {
        UP_DOWN: 1,
        DOWN_UP: 2,
        LEFT_RIGHT: 3,
        RIGHT_LEFT: 4
    },

    MIDDLE_PATH: {
        UP_LEFT: 5,
        UP_RIGHT: 6,
        UP_DOWN: 7,
        DOWN_LEFT: 8,
        DOWN_RIGHT: 9,
        LEFT_RIGHT: 10
    },

    isMiddle: function (direction) {
        if (direction >= 5 && direction <= 10) {
            return true;
        }
        else {
            return false;
        }
    },

    isTop: function (direction) {
        if (direction >= 1 && direction <= 4) {
            return true;
        }
        else {
            return false;
        }
    },

    isMiddleTurn: function (direction) {
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_LEFT)
            return true;
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_RIGHT)
            return true;
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_LEFT)
            return true;
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_RIGHT)
            return true;
        return false;
    },

    isMiddleStraight: function (direction) {
        if (SEGMENT_DIRECTION.isMiddleTurn(direction))
            return false;
        if (SEGMENT_DIRECTION.isMiddle(direction))
            return true;
        return false;
    },

    isHorizontal: function (direction) {
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT)
            return true;
        if (direction == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT)
            return true;
        if (direction == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT)
            return true;
        return false;
    },

    isVertical: function (direction) {
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN)
            return true;
        if (direction == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN)
            return true;
        if (direction == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP)
            return true;
        return false;
    },

    getTopDirection: function (prevCell, topCell) {
        var prevX = prevCell.xCell;
        var prevY = prevCell.yCell;
        var topX = topCell.xCell;
        var topY = topCell.yCell;
        if (prevX == topX) {
            if (prevY < topY) {
                return SEGMENT_DIRECTION.TOP_PATH.DOWN_UP;
            }
            else if (prevY > topY) {
                return SEGMENT_DIRECTION.TOP_PATH.UP_DOWN;
            }
        }
        else if (prevY == topY) {
            if (prevX < topX) {
                return SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT;
            }
            else if (prevX > topX) {
                return SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT;
            }
        }
    },

    getMiddleDirection: function (prevCell, currentCell, nextCell) {
        var prevX = prevCell.xCell;
        var prevY = prevCell.yCell;
        var X = currentCell.xCell;
        var Y = currentCell.yCell;
        var nextX = nextCell.xCell;
        var nextY = nextCell.yCell;

        if ((prevX == X) && (X == nextX)) {
            return SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN;
        }
        else if ((prevY == Y) && (Y == nextY)) {
            return SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT;
        }
        else {
            var d1 = SEGMENT_DIRECTION.getTopDirection(currentCell, prevCell);
            var d2 = SEGMENT_DIRECTION.getTopDirection(currentCell, nextCell);

            if ((d1 == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN && d2 == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT) ||
                (d2 == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN && d1 == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT)) {
                return SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_RIGHT;
            }

            if ((d1 == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN && d2 == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT) ||
                (d2 == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN && d1 == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT)) {
                return SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_LEFT;
            }

            if ((d1 == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP && d2 == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT) ||
                (d2 == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP && d1 == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT)) {
                return SEGMENT_DIRECTION.MIDDLE_PATH.UP_RIGHT;
            }

            if ((d1 == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP && d2 == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT) ||
                (d2 == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP && d1 == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT)) {
                return SEGMENT_DIRECTION.MIDDLE_PATH.UP_LEFT;
            }
        }
    }
};

/**
 * Một giao diện chung cho tất cả các thể loại Cell, empty, block, dot, bridge...
 */
// var Cell = cc.Node.extend({
//
//     type: CellType.EMPTY,
//     colorManager: null,
//
//     ctor: function (colorManager) {
//         this._super();
//         this.colorManager = colorManager;
//         this.setContentSize(100, 100);
//         this.setAnchorPoint(0.5, 0.5);
//         // this.initWithSpriteFrameName(PuzzleResource.getSpriteFrameName(PuzzleResource.cell_bg));
//     },
//
//     addSegment: function (path, direction, colorOrder, dotOrder) {
//
//     },
//
//     clearSegment: function (direction) {
//
//     },
//
//     /**
//      * trả về path đã đi qua cell này theo hướng direction, nếu không có, trả về null
//      * @param direction
//      */
//     getPath: function (direction) {
//
//     },
//
//     /**
//      * Trả về danh sách tất cả các path đã đi qua cell này.
//      * Nếu không path nào đi qua, trả về []
//      */
//     getPaths: function () {
//
//     },
//
//     setLight: function (isEnable, direction) {
//
//     },
//
//     checkCanFill: function (direction, colorOrder, dotOrder) {
//
//     },
//
//     updateTexture: function () {
//
//     },
//
//     warnCannotFill: function () {
//
//     }
//
// });

var Cell = cc.Sprite.extend({

    type: CellType.EMPTY,
    colorManager: null,

    ctor: function (colorManager) {
        this._super();
        this.colorManager = colorManager;
        // this.setContentSize(100, 100);
        // this.setAnchorPoint(0.5, 0.5);
        this.initWithSpriteFrameName(GUIRes.cell_bg);
        // this.initWithFile(PuzzleResource.cell_bg);
    },

    addSegment: function (path, direction, colorOrder, dotOrder) {

    },

    clearSegment: function (direction) {

    },

    /**
     * trả về path đã đi qua cell này theo hướng direction, nếu không có, trả về null
     * @param direction
     */
    getPath: function (direction) {

    },

    /**
     * Trả về danh sách tất cả các path đã đi qua cell này.
     * Nếu không path nào đi qua, trả về []
     */
    getPaths: function () {

    },

    setLight: function (isEnable, direction) {

    },

    checkCanFill: function (direction, colorOrder, dotOrder) {

    },

    updateTexture: function () {

    },

    warnCannotFill: function () {

    }

});

var hintOpacity = 50;

var Cell_Empty = Cell.extend({

    segment_current_img: null,
    segment_straight_img: null,
    segment_turn_img: null,

    segment_current_hint: null,
    segment_straight_hint: null,
    segment_turn_hint: null,

    segment_current_light: null,
    segment_straight_light: null,
    segment_turn_light: null,

    direction: null,
    colorOrder: null,
    isEnableLight: false,
    path: null,

    ctor: function (colorManager) {
        this._super(colorManager);
        this.type = CellType.EMPTY;

        // this.segment_current_img = new cc.Sprite(PuzzleResource.segment_current);
        this.segment_current_img = GUIRes.createSpriteWithRes(GUIRes.segment_current);
        CellUtil.setPositionToCenterCell(this.segment_current_img);
        this.addChild(this.segment_current_img, 2);

        // this.segment_straight_img = new cc.Sprite(PuzzleResource.segment_straight);
        this.segment_straight_img = GUIRes.createSpriteWithRes(GUIRes.segment_straight);
        CellUtil.setPositionToCenterCell(this.segment_straight_img);
        this.addChild(this.segment_straight_img, 2);

        // this.segment_turn_img = new cc.Sprite(PuzzleResource.segment_turn);
        this.segment_turn_img = GUIRes.createSpriteWithRes(GUIRes.segment_turn);
        CellUtil.setPositionToCenterCell(this.segment_turn_img);
        this.addChild(this.segment_turn_img, 2);

        // this.segment_current_hint = new cc.Sprite(PuzzleResource.segment_current);
        this.segment_current_hint = GUIRes.createSpriteWithRes(GUIRes.segment_current);
        CellUtil.setPositionToCenterCell(this.segment_current_hint);
        this.addChild(this.segment_current_hint, 2);
        this.segment_current_hint.setOpacity(hintOpacity);

        // this.segment_straight_hint = new cc.Sprite(PuzzleResource.segment_straight);
        this.segment_straight_hint = GUIRes.createSpriteWithRes(GUIRes.segment_straight);
        CellUtil.setPositionToCenterCell(this.segment_straight_hint);
        this.addChild(this.segment_straight_hint, 2);
        this.segment_straight_hint.setOpacity(hintOpacity);

        // this.segment_turn_hint = new cc.Sprite(PuzzleResource.segment_turn);
        this.segment_turn_hint = GUIRes.createSpriteWithRes(GUIRes.segment_turn);
        CellUtil.setPositionToCenterCell(this.segment_turn_hint);
        this.addChild(this.segment_turn_hint, 2);
        this.segment_turn_hint.setOpacity(hintOpacity);

        // this.segment_current_light = new cc.Sprite(PuzzleResource.segment_current_light);
        this.segment_current_light = GUIRes.createSpriteWithRes(GUIRes.segment_current_light);
        this.segment_current_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_current_light);
        this.addChild(this.segment_current_light, 2);

        // this.segment_straight_light = new cc.Sprite(PuzzleResource.segment_straight_light);
        this.segment_straight_light = GUIRes.createSpriteWithRes(GUIRes.segment_straight_light);
        this.segment_straight_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_straight_light);
        this.addChild(this.segment_straight_light, 2);

        // this.segment_turn_light = new cc.Sprite(PuzzleResource.segment_turn_light);
        this.segment_turn_light = GUIRes.createSpriteWithRes(GUIRes.segment_turn_light);
        this.segment_turn_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_turn_light);
        this.addChild(this.segment_turn_light, 2);
        this._hideAll();
        this._hideAllHint();
    },

    _hideAll: function () {
        this.segment_current_img.setVisible(false);
        this.segment_straight_img.setVisible(false);
        this.segment_turn_img.setVisible(false);
        this.segment_current_light.setVisible(false);
        this.segment_straight_light.setVisible(false);
        this.segment_turn_light.setVisible(false);
    },

    _hideAllHint:function(){
        this.segment_current_hint.setVisible(false);
        this.segment_straight_hint.setVisible(false);
        this.segment_turn_hint.setVisible(false);
    },

    hintPath:null,
    hintDirection:null,
    hintColorOrder:null,

    addSegmentHint:function(path, direction, colorOrder){
        this.hintPath = path;
        this.hintDirection = direction;
        this.hintColorOrder = colorOrder;
    },

    addSegment: function (path, direction, colorOrder) {
        this.path = path;
        this.direction = direction;
        this.colorOrder = colorOrder;
    },

    clearSegment: function () {
        this.path = null;
        this.direction = null;
        this.colorOrder = null;
    },

    getPath: function () {
        return this.path;
    },

    getPaths: function () {
        var paths = [];
        if (this.path != null) {
            paths.push(this.path);
        }
        return paths;
    },

    setLight: function (isEnable, direction) {
        if (isEnable) {
            this.isEnableLight = true;
        } else {
            this.isEnableLight = false;
        }
    },

    checkCanFill: function () {
        if (this.isEmpty()) {
            return true;
        } else {
            return false;
        }
    },

    isEmpty: function () {
        if (this.direction == null) {
            return true;
        } else {
            return false;
        }
    },

    isHintEmpty:function(){
        if(this.hintDirection == null) {
            return true;
        } else {
            return false;
        }
    },

    updateTexture:function(){
        this.updateTextureNormal();
        this.updateTextureHint();
    },

    updateTextureHint:function(){
        this._hideAllHint();
        if (this.isHintEmpty()) {
            return;
        }
        var direction = this.hintDirection;
        var color = this.colorManager.getColor(this.hintColorOrder);

        var display = function (sprite, rotation) {
            sprite.setVisible(true);
            sprite.setColor(color);
            sprite.setRotation(rotation);
            this.type = CellType.GO_STRAIGHT_DIRECTION;
        };

        if (SEGMENT_DIRECTION.isTop(direction)) {
            var rotateAngle = 0;
            switch (direction) {
                case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                    rotateAngle = 0;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                    rotateAngle = 180;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                    rotateAngle = 90;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                    rotateAngle = -90;
                    break;
            }

            display(this.segment_current_hint, rotateAngle);
            return;
        }

        if (SEGMENT_DIRECTION.isMiddle(direction)) {
            if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN) {
                display(this.segment_straight_hint, 0);
                return;
            }
            if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT) {
                display(this.segment_straight_hint, 90);
                return;
            }

            var rotateAngle = 0;
            switch (direction) {
                case SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_RIGHT:
                    rotateAngle = 0;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_LEFT:
                    rotateAngle = 90;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.UP_LEFT:
                    rotateAngle = 180;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.UP_RIGHT:
                    rotateAngle = 270;
                    break;
            }
            display(this.segment_turn_hint, rotateAngle);
        }
    },

    updateTextureNormal: function () {
        this._hideAll();

        if (this.isEmpty()) {
            return;
        }

        var direction = this.direction;
        var color = this.colorManager.getColor(this.colorOrder);

        var display = function (sprite, rotation) {
            sprite.setVisible(true);
            sprite.setColor(color);
            sprite.setRotation(rotation);
            this.type = CellType.GO_STRAIGHT_DIRECTION;
        };

        if (SEGMENT_DIRECTION.isTop(direction)) {
            var rotateAngle = 0;
            switch (direction) {
                case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                    rotateAngle = 0;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                    rotateAngle = 180;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                    rotateAngle = 90;
                    break;
                case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                    rotateAngle = -90;
                    break;
            }

            display(this.segment_current_img, rotateAngle);
            if (this.isEnableLight) {
                display(this.segment_current_light, rotateAngle);
            }
            return;
        }

        if (SEGMENT_DIRECTION.isMiddle(direction)) {
            if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN) {
                display(this.segment_straight_img, 0);
                if (this.isEnableLight) {
                    display(this.segment_straight_light, 0);
                }
                return;
            }
            if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT) {
                display(this.segment_straight_img, 90);
                if (this.isEnableLight) {
                    display(this.segment_straight_light, 90);
                }
                return;
            }

            var rotateAngle = 0;
            switch (direction) {
                case SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_RIGHT:
                    rotateAngle = 0;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_LEFT:
                    rotateAngle = 90;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.UP_LEFT:
                    rotateAngle = 180;
                    break;
                case SEGMENT_DIRECTION.MIDDLE_PATH.UP_RIGHT:
                    rotateAngle = 270;
                    break;
            }
            display(this.segment_turn_img, rotateAngle);
            if (this.isEnableLight) {
                display(this.segment_turn_light, rotateAngle);
            }
        }
    },

    warnCannotFill: function () {
        //Không làm gì cả !
    },

    resetCellsCut:function(){
        this.hasCellsCut = false;
    },

    saveCellsCut:function(pointRecovery, cellsCut){
        this.hasCellsCut = true;
        this.pointRecovery = pointRecovery;
        this.cellsCut = cellsCut;
    },

    recoveryCellsCut:function() {
        if(this.hasCellsCut) {
            recoveryPath(this.pointRecovery, this.cellsCut);
            this.hasCellsCut = false;
        }
    }
});

var Cell_Straight = Cell_Empty.extend({

    go_straight_direction_img: null,

    ctor: function (colorManager) {
        this._super(colorManager);
        this.type = CellType.GO_STRAIGHT_DIRECTION;
        // this.go_straight_direction_img = new cc.Sprite(PuzzleResource.go_straight_direction);
        this.go_straight_direction_img = GUIRes.createSpriteWithRes(GUIRes.go_straight_direction);
        CellUtil.setPositionToCenterCell(this.go_straight_direction_img);
        this.addChild(this.go_straight_direction_img, 1);
    },

    addSegment: function (path, direction, colorOrder) {
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_LEFT
            || direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_RIGHT
            || direction == SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_LEFT
            || direction == SEGMENT_DIRECTION.MIDDLE_PATH.DOWN_RIGHT
        ) {
            cc.error("check code, Cell_Straight");
            return;
        }
        this._super(path, direction, colorOrder);
    }
});

var Cell_Turn = Cell_Empty.extend({

    turn_direction_img: null,

    ctor: function () {
        this._super();
        this.type = CellType.TURN_DIRECTION;
        // this.turn_direction_img = new cc.Sprite(PuzzleResource.turn_direction);
        this.turn_direction_img = GUIRes.createSpriteWithRes(GUIRes.turn_direction);
        CellUtil.setPositionToCenterCell(this.turn_direction_img);
        this.addChild(this.turn_direction_img, 1);
    },

    addSegment: function (path, direction, colorOrder) {
        if (direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN
            || direction == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT
        ) {
            cc.error("check code, Cell_Turn");
            return;
        }
        this._super(path, direction, colorOrder);
    }

});

var Cell_Bridge = Cell.extend({
    bride_img: null,

    fill_horizontal_img: null,
    fill_vertical_img: null,
    top_horizontal_img: null,
    top_vertical_img: null,

    fill_horizontal_hint: null,
    fill_vertical_hint: null,
    top_horizontal_hint: null,
    top_vertical_hint: null,

    fill_horizontal_light: null,
    fill_vertical_light: null,
    top_horizontal_light: null,
    top_vertical_light: null,

    vertical_direction: null,
    vertical_color_order: null,
    vertical_light_enable: false,
    vertical_path: null,

    horizontal_direction: null,
    horizontal_color_order: null,
    horizontal_light_enable: false,
    horizontal_path: null,

    ctor: function (colorManager) {
        this._super(colorManager);
        this.type = CellType.BRIDGE;

        // this.bride_img = new cc.Sprite(PuzzleResource.bridge);
        this.bride_img = GUIRes.createSpriteWithRes(GUIRes.bridge);
        CellUtil.setPositionToCenterCell(this.bride_img);
        this.addChild(this.bride_img, 1);

        ///////////////////////
        // this.fill_horizontal_img = new cc.Sprite(PuzzleResource.bridge_fill_horizontal);
        this.fill_horizontal_img = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_horizontal);
        CellUtil.setPositionToCenterCell(this.fill_horizontal_img);
        this.addChild(this.fill_horizontal_img, 2);

        // this.fill_vertical_img = new cc.Sprite(PuzzleResource.bridge_fill_vertical);
        this.fill_vertical_img = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_vertical);
        CellUtil.setPositionToCenterCell(this.fill_vertical_img);
        this.addChild(this.fill_vertical_img, 2);

        // this.top_horizontal_img = new cc.Sprite(PuzzleResource.bridge_top_horizontal);
        this.top_horizontal_img = GUIRes.createSpriteWithRes(GUIRes.bridge_top_horizontal);
        CellUtil.setPositionToCenterCell(this.top_horizontal_img);
        this.addChild(this.top_horizontal_img, 2);

        // this.top_vertical_img = new cc.Sprite(PuzzleResource.bridge_top_vertical);
        this.top_vertical_img = GUIRes.createSpriteWithRes(GUIRes.bridge_top_vertical);
        CellUtil.setPositionToCenterCell(this.top_vertical_img);
        this.addChild(this.top_vertical_img, 2);

        ///////////////////////
        // this.fill_horizontal_hint = new cc.Sprite(PuzzleResource.bridge_fill_horizontal);
        this.fill_horizontal_hint = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_horizontal);
        CellUtil.setPositionToCenterCell(this.fill_horizontal_hint);
        this.addChild(this.fill_horizontal_hint, 2);
        this.fill_horizontal_hint.setOpacity(hintOpacity);

        // this.fill_vertical_hint = new cc.Sprite(PuzzleResource.bridge_fill_vertical);
        this.fill_vertical_hint = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_vertical);
        CellUtil.setPositionToCenterCell(this.fill_vertical_hint);
        this.addChild(this.fill_vertical_hint, 2);
        this.fill_vertical_hint.setOpacity(hintOpacity);

        // this.top_horizontal_hint = new cc.Sprite(PuzzleResource.bridge_top_horizontal);
        this.top_horizontal_hint = GUIRes.createSpriteWithRes(GUIRes.bridge_top_horizontal);
        CellUtil.setPositionToCenterCell(this.top_horizontal_hint);
        this.addChild(this.top_horizontal_hint, 2);
        this.top_horizontal_hint.setOpacity(hintOpacity);

        // this.top_vertical_hint = new cc.Sprite(PuzzleResource.bridge_top_vertical);
        this.top_vertical_hint = GUIRes.createSpriteWithRes(GUIRes.bridge_top_vertical);
        CellUtil.setPositionToCenterCell(this.top_vertical_hint);
        this.addChild(this.top_vertical_hint, 2);
        this.top_vertical_hint.setOpacity(hintOpacity);

        ///////////////////////Light
        // this.fill_horizontal_light = new cc.Sprite(PuzzleResource.bridge_fill_horizontal_light);
        this.fill_horizontal_light = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_horizontal_light);
        CellUtil.setPositionToCenterCell(this.fill_horizontal_light);
        this.fill_horizontal_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        this.addChild(this.fill_horizontal_light, 2);

        // this.fill_vertical_light = new cc.Sprite(PuzzleResource.bridge_fill_vertical_light);
        this.fill_vertical_light = GUIRes.createSpriteWithRes(GUIRes.bridge_fill_vertical_light);
        this.fill_vertical_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.fill_vertical_light);
        this.addChild(this.fill_vertical_light, 2);

        // this.top_horizontal_light = new cc.Sprite(PuzzleResource.bridge_top_horizontal_light);
        this.top_horizontal_light = GUIRes.createSpriteWithRes(GUIRes.bridge_top_horizontal_light);
        this.top_horizontal_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.top_horizontal_light);
        this.addChild(this.top_horizontal_light, 2);

        // this.top_vertical_light = new cc.Sprite(PuzzleResource.bridge_top_vertical_light);
        this.top_vertical_light = GUIRes.createSpriteWithRes(GUIRes.bridge_top_vertical_light);
        this.top_vertical_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.top_vertical_light);
        this.addChild(this.top_vertical_light, 2);

        this._hideAll();
        this._hideAllHint();
    },

    _hideAll: function () {
        this._hideVertical();
        this._hideHorizontal();
    },

    _hideHorizontal: function () {
        this.fill_horizontal_img.setVisible(false);
        this.top_horizontal_img.setVisible(false);
        this.fill_horizontal_light.setVisible(false);
        this.top_horizontal_light.setVisible(false);
    },

    _hideVertical: function () {
        this.fill_vertical_img.setVisible(false);
        this.top_vertical_img.setVisible(false);
        this.fill_vertical_light.setVisible(false);
        this.top_vertical_light.setVisible(false);
    },

    _hideAllHint:function(){
        this._hideAllHintHorizontal();
        this._hideAllHintVertical();
    },

    _hideAllHintHorizontal:function(){
        this.fill_horizontal_hint.setVisible(false);
        this.top_horizontal_hint.setVisible(false);
    },

    _hideAllHintVertical:function(){
        this.fill_vertical_hint.setVisible(false);
        this.top_vertical_hint.setVisible(false);
    },

    addSegment: function (path, direction, colorOrder) {
        if (SEGMENT_DIRECTION.isVertical(direction)) {
            this.vertical_direction = direction;
            this.vertical_color_order = colorOrder;
            this.vertical_path = path;
        }
        else if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            this.horizontal_direction = direction;
            this.horizontal_color_order = colorOrder;
            this.horizontal_path = path;
        }
    },

    addSegmentHint:function(path, direction, colorOrder){
        if (SEGMENT_DIRECTION.isVertical(direction)) {
            this.vertical_direction_hint = direction;
            this.vertical_color_order_hint = colorOrder;
            this.vertical_path_hint = path;
        }
        else if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            this.horizontal_direction_hint = direction;
            this.horizontal_color_order_hint = colorOrder;
            this.horizontal_path_hint = path;
        }
    },

    clearSegment: function (direction) {
        if (SEGMENT_DIRECTION.isVertical(direction)) {
            this.vertical_direction = null;
            this.vertical_path = null;
        }
        else if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            this.horizontal_direction = null;
            this.horizontal_path = null;
        }
    },

    getPath: function (direction) {
        if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            return this.horizontal_path;
        }
        else if (SEGMENT_DIRECTION.isVertical(direction)) {
            return this.vertical_path;
        }
        return null;
    },

    getPaths: function (direction) {
        var paths = [];
        if (this.horizontal_path) {
            paths.push(this.horizontal_path);
        }
        if (this.vertical_path) {
            paths.push(this.vertical_path);
        }
        return paths;
    },

    // enableLight: function (direction) {
    //     this.setLight(true, direction);
    // },
    //
    // disableLight: function (direction) {
    //     this.setLight(false, direction);
    // },

    setLight: function (isEnable, direction) {
        if (SEGMENT_DIRECTION.isVertical(direction)) {
            if (isEnable) {
                this.vertical_light_enable = true;
            } else {
                this.vertical_light_enable = false;
            }
        }
        else if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            if (isEnable) {
                this.horizontal_light_enable = true;
            } else {
                this.horizontal_light_enable = false;
            }
        }
    },

    checkCanFill: function (direction) {
        if (SEGMENT_DIRECTION.isVertical(direction)) {
            if (this._isVerticalEmpty()) {
                return true;
            } else {
                return false;
            }
        }
        else if (SEGMENT_DIRECTION.isHorizontal(direction)) {
            if (this._isHorizontalEmpty()) {
                return true;
            } else {
                return false;
            }
        }
    },

    _isHorizontalEmpty: function () {
        if (this.horizontal_direction == null)
            return true;
        else
            return false;
    },

    _isVerticalEmpty: function () {
        if (this.vertical_direction == null)
            return true;
        else
            return false;
    },

    isEmpty: function () {
        if (this._isHorizontalEmpty() && this._isVerticalEmpty()) {
            return true;
        } else {
            return false;
        }
    },

    _isHorizontalHintEmpty: function () {
        if (this.horizontal_direction_hint == null)
            return true;
        else
            return false;
    },

    _isVerticalHintEmpty: function () {
        if (this.vertical_direction_hint == null)
            return true;
        else
            return false;
    },

    isHintEmpty: function () {
        if (this._isHorizontalEmpty() && this._isVerticalEmpty()) {
            return true;
        } else {
            return false;
        }
    },

    updateTextureNormal: function () {
        this._updateTextureVertical();
        this._updateTextureHorizontal();
    },

    _updateTextureVertical: function () {
        this._hideVertical();
        if (!this._isVerticalEmpty()) {
            var color = this.colorManager.getColor(this.vertical_color_order);
            var display = function (sprite, rotation) {
                if (rotation == undefined) rotation = 0;
                sprite.setVisible(true);
                sprite.setColor(color);
                sprite.setRotation(rotation);
            };

            if (this.vertical_direction == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN) {
                display(this.top_vertical_img, 0);
                if (this.vertical_light_enable) {
                    display(this.top_vertical_light, 0);
                }
            }
            else if (this.vertical_direction == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP) {
                display(this.top_vertical_img, 180);
                if (this.vertical_light_enable) {
                    display(this.top_vertical_light, 180);
                }
            }
            else if (this.vertical_direction == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN) {
                display(this.fill_vertical_img);
                if (this.vertical_light_enable) {
                    display(this.fill_vertical_light);
                }
            }
        }
    },

    _updateTextureHorizontal: function () {
        this._hideHorizontal();
        if (!this._isHorizontalEmpty()) {
            var color = this.colorManager.getColor(this.horizontal_color_order);
            var display = function (sprite, rotation) {
                if (rotation == undefined) rotation = 0;
                sprite.setVisible(true);
                sprite.setColor(color);
                sprite.setRotation(rotation);
            };

            if (this.horizontal_direction == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT) {
                display(this.top_horizontal_img, 0);
                if (this.horizontal_light_enable) {
                    display(this.top_horizontal_light, 0);
                }
            }
            else if (this.horizontal_direction == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT) {
                display(this.top_horizontal_img, 180);
                if (this.horizontal_light_enable) {
                    display(this.top_horizontal_light, 180);
                }
            }
            else if (this.horizontal_direction == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT) {
                display(this.fill_horizontal_img, 0);
                if (this.horizontal_light_enable) {
                    display(this.fill_horizontal_light, 0);
                }
            }
        }
    },

    _updateTextureHintVertical: function () {
        this._hideAllHintVertical();
        if (!this._isVerticalHintEmpty()) {
            var color = this.colorManager.getColor(this.vertical_color_order_hint);
            var display = function (sprite, rotation) {
                if (rotation == undefined) rotation = 0;
                sprite.setVisible(true);
                sprite.setColor(color);
                sprite.setRotation(rotation);
            };
            if (this.vertical_direction_hint == SEGMENT_DIRECTION.TOP_PATH.UP_DOWN) {
                display(this.top_vertical_hint, 0);
            }
            else if (this.vertical_direction_hint == SEGMENT_DIRECTION.TOP_PATH.DOWN_UP) {
                display(this.top_vertical_hint, 180);
            }
            else if (this.vertical_direction_hint == SEGMENT_DIRECTION.MIDDLE_PATH.UP_DOWN) {
                display(this.fill_vertical_hint);
            }
        }
    },

    _updateTextureHintHorizontal: function () {
        this._hideAllHintHorizontal();
        if (!this._isHorizontalHintEmpty()) {
            var color = this.colorManager.getColor(this.horizontal_color_order_hint);
            var display = function (sprite, rotation) {
                if (rotation == undefined) rotation = 0;
                sprite.setVisible(true);
                sprite.setColor(color);
                sprite.setRotation(rotation);
            };

            if (this.horizontal_direction_hint == SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT) {
                display(this.top_horizontal_hint, 0);
            }
            else if (this.horizontal_direction_hint == SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT) {
                display(this.top_horizontal_hint, 180);
            }
            else if (this.horizontal_direction_hint == SEGMENT_DIRECTION.MIDDLE_PATH.LEFT_RIGHT) {
                display(this.fill_horizontal_hint, 0);
            }
        }
    },

    updateTextureHint:function(){
        this._updateTextureHintHorizontal();
        this._updateTextureHintVertical();
    },

    updateTexture:function(){
        this.updateTextureNormal();
        this.updateTextureHint();
    },

    warnCannotFill: function () {

    },

    resetCellsCut:function(){
        this.hasCellsCut_h = false;
        this.hasCellsCut_v = false;
    },

    saveCellsCut:function(pointRecovery, cellsCut, direction){
        if(SEGMENT_DIRECTION.isVertical(direction)) {
            this.hasCellsCut_v = true;
            this.pointRecovery_v = pointRecovery;
            this.cellsCut_v = cellsCut;
        } else {
            this.hasCellsCut_h = true;
            this.pointRecovery_h = pointRecovery;
            this.cellsCut_h = cellsCut;
        }
    },

    recoveryCellsCut:function(direction) {
        if(SEGMENT_DIRECTION.isVertical(direction)) {
            if(this.hasCellsCut_v) {
                recoveryPath(this.pointRecovery_v, this.cellsCut_v);
                this.hasCellsCut_v = false;
            }
        } else {
            if(this.hasCellsCut_h) {
                recoveryPath(this.pointRecovery_h, this.cellsCut_h);
                this.hasCellsCut_h = false;
            }
        }
    }

});

var Cell_Block = Cell_Empty.extend({

    block_color_order: null,
    block_img: null,
    normal_opacity: 150,
    blur_opacity: 100,

    ctor: function (colorManager, block_color_order) {
        this._super(colorManager);
        this.type = CellType.BLOCK;
        this.block_color_order = block_color_order;
        // this.block_img = new cc.Sprite(PuzzleResource.block);
        this.block_img = GUIRes.createSpriteWithRes(GUIRes.block);
        this.block_img.setColor(this.colorManager.getColor(this.block_color_order));
        this.block_img.setOpacity(this.normal_opacity);
        CellUtil.setPositionToCenterCell(this.block_img);
        this.addChild(this.block_img, 1);
    },

    addSegment: function (path, direction, colorOrder, dotOrder) {
        this.make_blur();
        this._super(path, direction, colorOrder);
    },

    clearSegment: function () {
        this.make_clear();
        this._super();
    },

    checkCanFill: function (direction, colorOrder, dotOrder) {
        if (this.isEmpty() && (colorOrder != this.block_color_order)) {
            return true;
        } else {
            return false;
        }
    },

    make_blur: function () {
        this.block_img.setOpacity(this.blur_opacity);
    },

    make_clear: function () {
        this.block_img.setOpacity(this.normal_opacity);
    },

    warnCannotFill: function () {
        this.block_img.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(0.3, 1.35),
                cc.fadeTo(0.3, 255)
            ),
            cc.spawn(
                cc.scaleTo(0.3, 1.0),
                cc.fadeTo(0.3, this.normal_opacity)
            )
        ).easing(cc.easeOut(2.0)));
    }

});

var Cell_Stone = Cell.extend({

    stone_img: null,

    ctor: function () {
        this._super();
        this.type = CellType.STONE;
        // this.stone_img = new cc.Sprite(PuzzleResource.stone);
        this.stone_img = GUIRes.createSpriteWithRes(GUIRes.stone);
        CellUtil.setPositionToCenterCell(this.stone_img);
        this.addChild(this.stone_img);
    }

});

var Cell_Dot = Cell.extend({

    colorOrder: null,
    dotOrder: null,
    sequenceLength: null,

    up_filled: false,
    down_filled: false,
    left_filled: false,
    right_filled: false,

    up_path: null,
    down_path: null,
    left_path: null,
    right_path: null,

    up_light: false,
    down_light: false,
    left_light: false,
    right_light: false,
    dot_light: false,

    up_filled_hint: false,
    down_filled_hint: false,
    left_filled_hint: false,
    right_filled_hint: false,

    up_path_hint: null,
    down_path_hint: null,
    left_path_hint: null,
    right_path_hint: null,

    dotImg: null,
    orderImg: null,

    segment_up: null,
    segment_down: null,
    segment_left: null,
    segment_right: null,

    segment_up_hint: null,
    segment_down_hint: null,
    segment_left_hint: null,
    segment_right_hint: null,

    segment_up_light: null,
    segment_down_light: null,
    segment_left_light: null,
    segment_right_light: null,

    ctor: function (colorManager, colorOrder, dotOrder, sequenceLength) {
        this._super(colorManager);
        this.type = CellType.DOT;
        this.colorOrder = colorOrder;
        this.dotOrder = dotOrder;
        this.sequenceLength = sequenceLength;

        // this.dotImg = new cc.Sprite(PuzzleResource.dot);
        this.dotImg = GUIRes.createSpriteWithRes(GUIRes.dot);
        CellUtil.setPositionToCenterCell(this.dotImg);
        this.addChild(this.dotImg, 2);
        this.dotImg.setColor(this.colorManager.getColor(this.colorOrder));
        if (this.sequenceLength >= 3) {
            this.orderImg = new ccui.Text("" + (this.dotOrder + 1), "Arial", 35);
            this.orderImg.enableOutline(this.colorManager.getColorNumber(this.colorOrder), 1);
            this.orderImg.setColor(this.colorManager.getColorNumber(this.colorOrder));
            this.orderImg.x = this.dotImg.getContentSize().width / 2;
            this.orderImg.y = this.dotImg.getContentSize().height / 2;
            this.dotImg.addChild(this.orderImg, 3);
        }

        //////////////////////////////////////////////
        // this.segment_up = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_up = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_up.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_up);
        this.segment_up.setRotation(180);
        this.addChild(this.segment_up, 1);

        // this.segment_down = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_down = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_down.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_down);
        this.segment_down.setRotation(0);
        this.addChild(this.segment_down, 1);

        // this.segment_left = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_left = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_left.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_left);
        this.segment_left.setRotation(90);
        this.addChild(this.segment_left, 1);

        // this.segment_right = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_right = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_right.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_right);
        this.segment_right.setRotation(-90);
        this.addChild(this.segment_right, 1);

        /////////////////////////////////////////////////////
        // this.segment_up_hint = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_up_hint = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_up_hint.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_up_hint);
        this.segment_up_hint.setRotation(180);
        this.addChild(this.segment_up_hint, 1);
        this.segment_up_hint.setOpacity(hintOpacity);

        // this.segment_down_hint = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_down_hint = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_down_hint.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_down_hint);
        this.segment_down_hint.setRotation(0);
        this.addChild(this.segment_down_hint, 1);
        this.segment_down_hint.setOpacity(hintOpacity);

        // this.segment_left_hint = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_left_hint = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_left_hint.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_left_hint);
        this.segment_left_hint.setRotation(90);
        this.addChild(this.segment_left_hint, 1);
        this.segment_left_hint.setOpacity(hintOpacity);

        // this.segment_right_hint = new cc.Sprite(PuzzleResource.segment_endpoint);
        this.segment_right_hint = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint);
        this.segment_right_hint.setColor(this.colorManager.getColor(this.colorOrder));
        CellUtil.setPositionToCenterCell(this.segment_right_hint);
        this.segment_right_hint.setRotation(-90);
        this.addChild(this.segment_right_hint, 1);
        this.segment_right_hint.setOpacity(hintOpacity);

        ///////////////////////
        // this.segment_up_light = new cc.Sprite(PuzzleResource.segment_endpoint_light);
        this.segment_up_light = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint_light);
        this.segment_up_light.setColor(this.colorManager.getColor(this.colorOrder));
        this.segment_up_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_up_light);
        this.segment_up_light.setRotation(180);
        this.addChild(this.segment_up_light, 1);

        // this.segment_down_light = new cc.Sprite(PuzzleResource.segment_endpoint_light);
        this.segment_down_light = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint_light);
        this.segment_down_light.setColor(this.colorManager.getColor(this.colorOrder));
        this.segment_down_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_down_light);
        this.segment_down_light.setRotation(0);
        this.addChild(this.segment_down_light, 1);

        // this.segment_left_light = new cc.Sprite(PuzzleResource.segment_endpoint_light);
        this.segment_left_light = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint_light);
        this.segment_left_light.setColor(this.colorManager.getColor(this.colorOrder));
        this.segment_left_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_left_light);
        this.segment_left_light.setRotation(90);
        this.addChild(this.segment_left_light, 1);

        // this.segment_right_light = new cc.Sprite(PuzzleResource.segment_endpoint_light);
        this.segment_right_light = GUIRes.createSpriteWithRes(GUIRes.segment_endpoint_light);
        this.segment_right_light.setColor(this.colorManager.getColor(this.colorOrder));
        this.segment_right_light.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        CellUtil.setPositionToCenterCell(this.segment_right_light);
        this.segment_right_light.setRotation(-90);
        this.addChild(this.segment_right_light, 1);
        // this._adjustOpacity();
        this._hideAllSegment();
        this._hideAllSegmentHint();
    },

    // _adjustOpacity:function(){
    //     var o = 50;
    //     this.segment_up.setOpacity(o);
    //     this.segment_down.setOpacity(o);
    //     this.segment_left.setOpacity(o);
    //     this.segment_right.setOpacity(o);
    //
    // },

    addSegment: function (path, direction) {
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                this.left_filled = true;
                this.left_path = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                this.right_filled = true;
                this.right_path = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                this.up_filled = true;
                this.up_path = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                this.down_filled = true;
                this.down_path = path;
                break;
        }
    },

    addSegmentHint:function(path, direction){
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                this.left_filled_hint = true;
                this.left_path_hint = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                this.right_filled_hint = true;
                this.right_path_hint = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                this.up_filled_hint = true;
                this.up_path_hint = path;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                this.down_filled_hint = true;
                this.down_path_hint = path;
                break;
        }
    },

    clearSegment: function (direction) {
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                this.left_filled = false;
                this.left_path = null;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                this.right_filled = false;
                this.right_path = null;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                this.up_filled = false;
                this.up_path = null;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                this.down_filled = false;
                this.down_path = null;
                break;
        }
    },

    getPath: function (direction) {
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                return this.left_path;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                return this.right_path;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                return this.up_path;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                return this.down_path;
        }

    },

    getPaths: function () {
        var paths = [];
        if (this.up_path) {
            paths.push(this.up_path);
        }
        if (this.down_path) {
            paths.push(this.down_path);
        }
        if (this.left_path) {
            paths.push(this.left_path);
        }
        if (this.right_path) {
            paths.push(this.right_path);
        }
        return paths;
    },

    checkCanFill: function (direction, colorOrder, dotOrder) {
        if (colorOrder != this.colorOrder)
            return false;
        if (Math.abs(dotOrder - this.dotOrder) != 1)
            return false;
        if (this._checkEmpty(direction))
            return true;
        else
            return false;
    },

    _checkEmpty: function (direction) {
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                return !this.left_filled;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                return !this.right_filled;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                return !this.up_filled;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                return !this.down_filled;
        }
    },

    setLight: function (isEnable, direction) {
        if (isEnable)
            isEnable = true;
        else
            isEnable = false;
        switch (direction) {
            case SEGMENT_DIRECTION.TOP_PATH.LEFT_RIGHT:
                this.left_light = isEnable;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.RIGHT_LEFT:
                this.right_light = isEnable;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.UP_DOWN:
                this.up_light = isEnable;
                break;
            case SEGMENT_DIRECTION.TOP_PATH.DOWN_UP:
                this.down_light = isEnable;
        }
    },

    setDotLight: function (isEnable) {
        this.dot_light = isEnable;
    },

    elasticDot:function(){
        this.dotImg.stopAllActions();
        this.dotImg.runAction(cc.sequence(
            cc.scaleTo(0.1, 1.1),
            cc.scaleTo(0.1, 1.0)
        ));
    },

    /**
     * Số path tối đa đi qua dot này
     */
    getMaxPath:function(){
        if(this.dotOrder == 0 || this.dotOrder == this.sequenceLength - 1 ) {
            return 1;
        } else {
            return 2;
        }
    },

    _hideAllSegment: function () {
        this._hideUp();
        this._hideDown();
        this._hideLeft();
        this._hideRight();
    },

    _hideUp: function () {
        this.segment_up.setVisible(false);
        this.segment_up_light.setVisible(false);
    },

    _hideDown: function () {
        this.segment_down.setVisible(false);
        this.segment_down_light.setVisible(false);
    },

    _hideLeft: function () {
        this.segment_left.setVisible(false);
        this.segment_left_light.setVisible(false);
    },

    _hideRight: function () {
        this.segment_right.setVisible(false);
        this.segment_right_light.setVisible(false);
    },

    updateTextureNormal: function () {
        this._updateTextureUp();
        this._updateTextureDown();
        this._updateTextureLeft();
        this._updateTextureRight();
        this._updateTextureDot();
    },

    _updateTextureUp: function () {
        this._hideUp();
        if (this.up_filled) {
            this.segment_up.setVisible(true);
            if (this.up_light) {
                this.segment_up_light.setVisible(true);
            }
        }
    },

    _updateTextureDown: function () {
        this._hideDown();
        if (this.down_filled) {
            this.segment_down.setVisible(true);
            if (this.down_light) {
                this.segment_down_light.setVisible(true);
            }
        }
    },

    _updateTextureLeft: function () {
        this._hideLeft();
        if (this.left_filled) {
            this.segment_left.setVisible(true);
            if (this.left_light) {
                this.segment_left_light.setVisible(true);
            }
        }
    },

    _updateTextureRight: function () {
        this._hideRight();
        if (this.right_filled) {
            this.segment_right.setVisible(true);
            if (this.right_light) {
                this.segment_right_light.setVisible(true);
            }
        }
    },

    ///////////////
    _hideAllSegmentHint: function () {
        this._hideUpHint();
        this._hideDownHint();
        this._hideLeftHint();
        this._hideRightHint();
    },

    _hideUpHint: function () {
        this.segment_up_hint.setVisible(false);
    },

    _hideDownHint: function () {
        this.segment_down_hint.setVisible(false);
    },

    _hideLeftHint: function () {
        this.segment_left_hint.setVisible(false);
    },

    _hideRightHint: function () {
        this.segment_right_hint.setVisible(false);
    },

    updateTextureHint: function () {
        this._updateTextureUpHint();
        this._updateTextureDownHint();
        this._updateTextureLeftHint();
        this._updateTextureRightHint();
    },

    _updateTextureUpHint: function () {
        this._hideUpHint();
        if (this.up_filled_hint) {
            this.segment_up_hint.setVisible(true);
        }
    },

    _updateTextureDownHint: function () {
        this._hideDownHint();
        if (this.down_filled_hint) {
            this.segment_down_hint.setVisible(true);
        }
    },

    _updateTextureLeftHint: function () {
        this._hideLeftHint();
        if (this.left_filled_hint) {
            this.segment_left_hint.setVisible(true);
        }
    },

    _updateTextureRightHint: function () {
        this._hideRightHint();
        if (this.right_filled_hint) {
            this.segment_right_hint.setVisible(true);
        }
    },

    updateTexture:function(){
        this.updateTextureNormal();
        this.updateTextureHint();
    },

    _updateTextureDot:function(){

    },

    getColorOrder: function () {
        return this.colorOrder;
    },

    getDotOrder: function () {
        return this.dotOrder;
    }

});

var CellFactory = {
    createCell: function (colorManager, data) {
        switch (data.type) {
            case CellType.EMPTY:
                return new Cell_Empty(colorManager);
            case CellType.DOT:
                return new Cell_Dot(colorManager, data.sequence_order, data.dot_order, data.sequence_length);
            case CellType.BRIDGE:
                return new Cell_Bridge(colorManager);
            case CellType.STONE:
                return new Cell_Stone(colorManager);
            case CellType.BLOCK:
                return new Cell_Block(colorManager, data.n);
            case CellType.GO_STRAIGHT_DIRECTION:
                return new Cell_Straight(colorManager);
            case CellType.TURN_DIRECTION:
                return new Cell_Turn(colorManager);
        }
    }
};

var HintPath = cc.Class.extend({
    cells:null,
    colorOrder:null,
    dotOrder:null,

    ctor:function(cells){
        this.cells = cells;
        this.colorOrder = this.cells[0].getColorOrder();
        this.dotOrder = this.cells[0].getDotOrder();
        this._isShow = false;
    },

    show:function(){
        this._isShow = true;
        var length = this.cells.length;
        if(this.cells[0].type != CellType.DOT)
            return false;
        if(this.cells[length-1].type != CellType.DOT) {
            return false;
        }

        var startCelldirection = SEGMENT_DIRECTION.getTopDirection(this.cells[1], this.cells[0]);
        this.cells[0].addSegmentHint(this, startCelldirection, this.colorOrder);
        this.cells[0].updateTexture();
        var path = this.cells[0].getPath(startCelldirection);
        if(path)
            path.deletePath();

        for(var i=1; i<length-1; i++) {
            var direction = SEGMENT_DIRECTION.getMiddleDirection(this.cells[i-1], this.cells[i], this.cells[i+1]);
            this.cells[i].addSegmentHint(this, direction, this.colorOrder);
            this.cells[i].updateTexture();
            var path = this.cells[i].getPath(direction);
            if(path)
                path.deletePath();
        }

        var endCellDirection = SEGMENT_DIRECTION.getTopDirection(this.cells[length-2], this.cells[length-1]);
        this.cells[length-1].addSegmentHint(this, endCellDirection, this.colorOrder);
        this.cells[length-1].updateTexture();
        var path = this.cells[length-1].getPath(direction);
        if(path)
            path.deletePath();

        // tryToDeletePathIfRedundanceWithHintPath(this._getStartCell(), this);
        // tryToDeletePathIfRedundanceWithHintPath(this._getTopCell(), this);
    },

    isShow:function(){
        return this._isShow;
    },

    isCompleted:function(){
        return true;
    },

    hasCell: function (cell) {
        return this.cells.indexOf(cell) != -1;
    },

    checkRedundanceWith:function(path){
        if(!this.isCompleted())
            return false;
        if(!path.isCompleted())
            return false;
        var startCell1 = this._getStartCell();
        var topCell1 = this._getTopCell();
        var startCell2 = path._getStartCell();
        var topCell2 = path._getTopCell();

        if((startCell1 == startCell2) && (topCell1 == topCell2)) {
            return true;
        }

        if((startCell1 == topCell2) && (topCell1 == startCell2)) {
            return true;
        }
        return false;
    },

    checkDuplicateWithPath:function(path){
        if(this.cells.length != path.cells.length)
            return false;
        if(this.checkRedundanceWith(path) == false)
            return false;

        var cells1 = this.cells;
        var cells2 = path.cells;
        if(cells1[0] != cells2[0]) cells2 = (cells2.slice(0, cells2.length)).reverse();

        for(var i=0; i<cells1.length; i++) {
            if(cells1[i] != cells2[i])
                return false;
        }

        return true;
    },

    /**
     * Kiem tra 1 path co the chua hoan thanh nhung path do khong noi sai duong
     * @param path
     * @returns {boolean}
     */
    isOkPathWithThisHint:function(path){
        var cells1 = this.cells;
        var cells2 = path.cells;

        if((this._getStartCell() != path._getStartCell()) && (this._getTopCell() != path._getStartCell())) {
            return false;
        }

        if(this._getTopCell() == path._getStartCell()) cells2 = (cells2.slice(0, cells2.length)).reverse();

        for(var i=0; i<cells2.length; i++) {
            if(cells1[i] != cells2[i])
                return false;
        }

        return true;
    },

    _getStartCell:function(){
        return this.cells[0];
    },

    _getTopCell:function(){
        return this.cells[this.cells.length - 1];
    }

});

var Path = cc.Class.extend({

    cells: null,
    directions: null,
    colorOrder: null,
    dotOrder: null,
    isComplete: false,
    isLightEnable: false,

    /**
     *
     * @param startCell
     */
    ctor: function (startCell) {
        this.cells = [];
        this.cells.push(startCell);
        this.directions = [];
        this.directions.push(0);

        if (startCell.type == CellType.DOT) {
            this.colorOrder = startCell.getColorOrder();
            this.dotOrder = startCell.getDotOrder();
        } else {
            cc.error("check code: khỏi tạo Path, cell1 không phải là Dot");
        }
    },

    setLight: function (isEnable) {
        this.isLightEnable = isEnable;
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i].setLight(isEnable, this.directions[i]);
            this.cells[i].updateTexture();
        }
    },

    hasCell: function (cell) {
        return this.cells.indexOf(cell) != -1;
    },

    tryToAdd: function (cell, callback) {
        var isSuccess = false;
        var isComplete = false;
        var direction1, direction2;
        var topCell = this._getTopCell();
        var beforeTopCell = this._getBeforeTopCell();

        if (this.cells.length == 1) {
            direction1 = SEGMENT_DIRECTION.getTopDirection(cell, this._getStartCell());
            direction2 = SEGMENT_DIRECTION.getTopDirection(this._getStartCell(), cell);
        } else {
            direction1 = SEGMENT_DIRECTION.getMiddleDirection(beforeTopCell, topCell, cell);
            direction2 = SEGMENT_DIRECTION.getTopDirection(topCell, cell);
        }

        if (topCell.type == CellType.BRIDGE) {
            if (SEGMENT_DIRECTION.isMiddleTurn(direction1)) {
                if (callback) callback(false);
                return;
            }
        }
        if (topCell.type == CellType.GO_STRAIGHT_DIRECTION) {
            if (SEGMENT_DIRECTION.isMiddleTurn(direction1)) {
                if (callback) callback(false);
                return;
            }
        }
        if (topCell.type == CellType.TURN_DIRECTION) {
            if (!SEGMENT_DIRECTION.isMiddleTurn(direction1)) {
                if (callback) callback(false);
                return;
            }
        }
        if (cell.type == CellType.BLOCK) {
            if(this.colorOrder == cell.block_color_order) {
                // topCell.addSegment(this, direction1, this.colorOrder, this.dotOrder);
                // topCell.updateTexture();
                cell.warnCannotFill();
            }
        }

        if(PUZZLE_CONFIG.autoBreakPath) {
            var path = cell.getPath(direction2);
            if(path != null && path != this) {
                // path.deletePath();
                var recoveryPoint = path.getPrevCell(cell);
                var cellsCut = path.getCellsAfter(recoveryPoint);
                path.cutPathAndRemoveCell(cell);
                cell.saveCellsCut(recoveryPoint, cellsCut, direction2);
            }
        }

        if (cell.checkCanFill(direction2, this.colorOrder, this.dotOrder) == true) {
            this.cells.push(cell);
            this.directions.splice(this.directions.length - 1, 1, direction1);
            this.directions.push(direction2);

            topCell.addSegment(this, direction1, this.colorOrder, this.dotOrder);
            topCell.updateTexture();
            cell.addSegment(this, direction2, this.colorOrder, this.dotOrder);
            cell.setLight(this.isLightEnable, direction2);
            cell.updateTexture();

            isSuccess = true;
            if (cell.type == CellType.DOT)
                isComplete = true;
            else
                isComplete = false;
            if (callback) callback(isSuccess, isComplete);
        } else {
            if (callback) callback(false);
        }
    },

    cutTop: function (callback) {
        if (this.cells.length < 2) {
            cc.error("Cannot remove cell from path with length < 2");
            return;
        }
        var direction1, direction2;
        var topCell = this._getTopCell();
        var beforeTopCell = this._getBeforeTopCell();
        var isDeleteAll = false;

        if (this.cells.length == 2) {
            var startCell = beforeTopCell;
            // direction1 = SEGMENT_DIRECTION.getTopDirection(topCell, startCell);
            // direction2 = SEGMENT_DIRECTION.getTopDirection(startCell, topCell);
            direction1 = this.directions[0];
            direction2 = this.directions[1];
            startCell.clearSegment(direction1);
            topCell.clearSegment(direction2);
            startCell.updateTexture();
            topCell.updateTexture();
            this._removeCellTop();
            this._removeCellTop();
            isDeleteAll = true;
            if (callback) callback(isDeleteAll);
        } else {
            var before_beforeTopCell = this.cells[this.cells.length - 3];
            direction1 = SEGMENT_DIRECTION.getTopDirection(before_beforeTopCell, beforeTopCell);
            // direction2 = SEGMENT_DIRECTION.getTopDirection(beforeTopCell, topCell);
            direction2 = this._getDirectionTopCell();
            topCell.clearSegment(direction2);
            beforeTopCell.addSegment(this, direction1, this.colorOrder, this.dotOrder);
            topCell.updateTexture();
            beforeTopCell.updateTexture();
            this._removeCellTop();
            isDeleteAll = false;
            if (callback) callback(isDeleteAll);
        }
    },

    cutPath: function (cell) {
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1)
            return false;

        //Xoa cac texture tu i-->...
        for (var i = iCell + 1; i < this.cells.length; i++) {
            this.cells[i].clearSegment(this.directions[i]);
            this.cells[i].updateTexture();
        }
        this.cells.splice(iCell + 1, (this.cells.length - 1) - (iCell + 1) + 1);
        this.directions.splice(iCell + 1, (this.directions.length - 1) - (iCell + 1) + 1);

        //update lai texture cho top
        this._getTopCell().addSegment(this, this._calculateDirectionTopCell(), this.colorOrder, this.dotOrder);
        this._getTopCell().updateTexture();
        return true;
    },

    // cutPath: function (cell) {
    //     var iCell = this.cells.indexOf(cell);
    //     if (iCell == -1)
    //         return false;
    //
    //     //Xoa cac texture tu i-->...
    //     for (var i = iCell + 1; i < this.cells.length; i++) {
    //         this.cells[i].clearSegment(this.directions[i]);
    //         this.cells[i].updateTexture();
    //     }
    //     this.cells.splice(iCell + 1, (this.cells.length - 1) - (iCell + 1) + 1);
    //     this.directions.splice(iCell + 1, (this.directions.length - 1) - (iCell + 1) + 1);
    //
    //     //update lai texture cho top
    //     this._getTopCell().addSegment(this, this._calculateDirectionTopCell(), this.colorOrder, this.dotOrder);
    //     this._getTopCell().updateTexture();
    //     return true;
    // },

    cutPathAndRemoveCell: function (cell) {
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1)
            return false;
        if (iCell == 0 || iCell == 1) {
            this.deletePath();
            return;
        }

        iCell -= 1;

        //Xoa cac texture tu i-->...
        for (var i = iCell + 1; i < this.cells.length; i++) {
            this.cells[i].clearSegment(this.directions[i]);
            this.cells[i].updateTexture();
        }
        this.cells.splice(iCell + 1, (this.cells.length - 1) - (iCell + 1) + 1);
        this.directions.splice(iCell + 1, (this.directions.length - 1) - (iCell + 1) + 1);

        //update lai texture cho top
        this._getTopCell().addSegment(this, this._calculateDirectionTopCell(), this.colorOrder, this.dotOrder);
        this._getTopCell().updateTexture();
        return true;
    },

    getPrevCell:function(cell){
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1 || iCell == 0)
            return null;
        else
            return this.cells[iCell - 1];
    },

    getCellsBefore:function(cell){
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1 || iCell == 0)
            return null;
        else
            return this.cells.slice(0, iCell-1);
    },

    getNextCell:function(cell){
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1 || iCell == this.cells.length - 1)
            return null;
        else
            return this.cells[iCell + 1];
    },

    getCellsAfter:function(cell){
        var iCell = this.cells.indexOf(cell);
        if (iCell == -1 || iCell == this.cells.length - 1)
            return null;
        else
            return this.cells.slice(iCell+1, this.cells.length);
    },

    cutPathToRemain: function (cell, remainCell) {
        var iCell = this.cells.indexOf(cell);
        var iRemainCell = this.cells.indexOf(remainCell);
        if (iCell == -1 || iRemainCell == -1)
            return false;

        if (iCell < iRemainCell && this.isCompleted()) {
            this._reversePath();
        }
        this.cutPath(cell);
        return true;
    },

    cutPathToRemove: function (cell, removeCell) {
        var iCell = this.cells.indexOf(cell);
        var iRemoveCell = this.cells.indexOf(removeCell);
        if (iCell == -1 || iRemoveCell == -1)
            return false;

        if (iCell > iRemoveCell && this.isCompleted()) {
            this._reversePath();
        }
        this.cutPath(cell);
        return true;
    },

    deletePath: function () {
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i].clearSegment(this.directions[i]);
            this.cells[i].updateTexture();
        }
        this.cells.splice(0, this.cells.length);
        this.directions.splice(0, this.directions.length);
    },

    _removeCellTop: function () {
        this.cells.splice(this.cells.length - 1, 1);
        this.directions.splice(this.directions.length - 1, 1);
    },

    _reversePath: function () {
        if (!this.isCompleted())
            return false;
        this.cells.reverse();
        this.directions.reverse();
        this.dotOrder = this._getStartCell().dotOrder;
    },

    // reverse:function(){
    //     this.cells.reverse();
    // },


    // updateTexture: function () {
    //
    // },
    //
    checkCellAtTop: function (cell) {
        if (this._getTopCell() == cell) {
            return true;
        } else {
            return false;
        }
    },

    _getStartCell: function () {
        return this.cells[0];
    },

    _getTopCell: function () {
        return this.cells[this.cells.length - 1];
    },

    _getBeforeTopCell: function () {
        return this.cells[this.cells.length - 2];
    },

    _getDirectionTopCell: function () {
        return this.directions[this.cells.length - 1];
    },

    _calculateDirectionTopCell: function () {
        return SEGMENT_DIRECTION.getTopDirection(this._getBeforeTopCell(), this._getTopCell());
    },

    isCompleted: function () {
        return this._getTopCell().type == CellType.DOT;
    },

    checkRedundanceWith:function(path){
        if(!this.isCompleted())
            return false;
        if(!path.isCompleted())
            return false;
        var startCell1 = this._getStartCell();
        var topCell1 = this._getTopCell();
        var startCell2 = path._getStartCell();
        var topCell2 = path._getTopCell();

        if((startCell1 == startCell2) && (topCell1 == topCell2)) {
            return true;
        }

        if((startCell1 == topCell2) && (topCell1 == startCell2)) {
            return true;
        }
        return false;
    },

    getMaxDotOrder:function(){
        if(this.isCompleted()) {
            return this.dotOrder;
        } else {
            var startCell_dotOrder = this._getStartCell().dotOrder;
            var endCell_dotOrder = this._getTopCell().dotOrder;
            return startCell_dotOrder > endCell_dotOrder ? startCell_dotOrder : endCell_dotOrder;
        }
    }

});

var PositionManager = cc.Class.extend({
    origin_x: 0,
    origin_y: 0,
    cell_width: 100,
    cell_height: 100,

    ctor: function (origin_x, origin_y, cell_width, cell_height) {
        //this._super();
        if (origin_x) this.origin_x = origin_x;
        if (origin_y) this.origin_y = origin_y;
        if (cell_width) this.cell_width = cell_width;
        if (cell_height) this.cell_height = cell_height;
    },

    getXFromCellX: function (cell_x) {
        return (cell_x + 0.5) * this.cell_width;
    },

    getYFromCellY: function (cell_y) {
        return (cell_y + 0.5) * this.cell_height;
    },

    getCellXFromX: function (x) {
        return Math.floor(x / this.cell_width);
    },

    getCellYFromY: function (y) {
        return Math.floor(y / this.cell_height);
    }
});

var PUZZLE_CONFIG = {
    /**
     * Khoảng thời gian nhỏ nhất mà người dùng giữ tay trên màn hình để được coi là long click
     */
    LONG_CLICK: 0,
    /**
     * Khoảng thời gian tối đa giữa 2 lần click, để được coi là double click
     */
    DOUBLE_CLICK: 500,

    autoBreakPath:true
};

var tryCreatePath = function (cell1, cell2, callback) {
    if(callback == undefined) callback = function(){};
    if (cell1.type != CellType.DOT) {
        callback(null);
        return;
    }
    if (Math.abs(cell1.xCell - cell2.xCell) + Math.abs(cell1.yCell - cell2.yCell) != 1) {
        callback(null);
        return;
    }
    var path = new Path(cell1);

    path.tryToAdd(cell2, function (addSucess, isComplete) {
        if (addSucess) {
            // jsb.AudioEngine.play2d(SoundRes.hit_new_cell);
            //Tiến hành delete một số path nếu cần thiết
            tryToDeletePathIfRedundance(cell1, path);
            callback(path, isComplete);
        } else {
            callback(null);
        }
    });
};

var tryToDeletePathIfRedundance = function(dotCell, path){
    //Remove cac path bi trung
    if(path.isCompleted()) {
        var paths = dotCell.getPaths();
        for(var i=0; i<paths.length; i++) {
            if(paths[i] != path && path.checkRedundanceWith(paths[i])) {
                paths[i].deletePath();
            }
        }
    } else {
        var paths = dotCell.getPaths();
        for(var i=0; i<paths.length; i++) {
            if(paths[i] != path && !paths[i].isCompleted()) {
                paths[i].deletePath();
            }
        }
    }

    var maxPath = dotCell.getMaxPath();
    var paths = dotCell.getPaths();

    if(maxPath == 1) {
        if(paths.length > 1) {
            for(var i=0; i<paths.length; i++) {
                if(paths[i] != path) {
                    paths[i].deletePath();
                }
            }
        }
    }
    else if(maxPath == 2) {
        if(paths.length > 2) {
            //Thu loai bo cac path tam
            for(var i=0; i<paths.length; i++) {
                if(!paths[i].isCompleted() && paths[i] != path) {
                    paths[i].deletePath();
                    return;
                }
            }

            //Loai bo path co dotOrderCaoHon

            var maxDotOrder = -1;
            var pathWillBeDelete = null;
            for(var i=0; i<paths.length; i++) {
                if(paths[i] != path) {
                    if(maxDotOrder < paths[i].getMaxDotOrder()) {
                        maxDotOrder = paths[i].getMaxDotOrder();
                        pathWillBeDelete = paths[i];
                    }
                }
            }
            pathWillBeDelete.deletePath();
        }
    }
};

var tryToDeletePathIfRedundanceWithHintPath = function(dotCell, hintPath){

    //Remove cac path bi trung
    var paths = dotCell.getPaths();
    for(var i=0; i<paths.length; i++) {
        if(hintPath.checkRedundanceWith(paths[i])) {
            paths[i].deletePath();
        }
    }

    var maxPath = dotCell.getMaxPath();
    var paths = dotCell.getPaths();
    if(maxPath == 1) {
        for(var i=0; i<paths.length; i++) {
            paths[i].deletePath();
        }
    }
    else if(maxPath == 2) {
        if(paths.length >= 2) {
            //Thu loai bo cac path tam
            for(var i=0; i<paths.length; i++) {
                if(!paths[i].isCompleted()) {
                    paths[i].deletePath();
                    return;
                }
            }
            //Loai bo path co dotOrderCaoHon
            var maxDotOrder = -1;
            var pathWillBeDelete = null;
            for(var i=0; i<paths.length; i++) {
                if(maxDotOrder < paths[i].getMaxDotOrder()) {
                    maxDotOrder = paths[i].getMaxDotOrder();
                    pathWillBeDelete = paths[i];
                }
            }
            pathWillBeDelete.deletePath();
        }
    }
};

var recoveryPath = function(recoveryPoint, cells){

    var path;
    var direction = SEGMENT_DIRECTION.getTopDirection(recoveryPoint, cells[0]);

    // cc.log(recoveryPoint.xCell + " " + recoveryPoint.yCell);
    // cc.log(cells.length);

    if(recoveryPoint.type == CellType.DOT) {
        tryCreatePath(recoveryPoint, cells[0], function(p){
            path = p;
        });
    }
    else {
        path = recoveryPoint.getPath(direction);
    }

    for(var i=0; i<cells.length; i++) {
        path.tryToAdd(cells[i]);
    }
};

var Puzzle = cc.Node.extend({

    n: 0,
    m: 0,
    numberPathNeedCompleted: 0,
    logic_puzzle: null,
    cells: null,
    positionManager: null,
    puzzleCompletedCallback:null,
    touch_dot:null,
    hints:null,
    hintPaths:null,
    // paths: null,

    ctor: function (data, colorManager) {
        this._super();
        this.logic_puzzle = new PuzzleLogic(data);
        this.n = this.logic_puzzle.n;
        this.m = this.logic_puzzle.m;
        this.numberPathNeedCompleted = this.logic_puzzle.getNumberPathNeeded();
        if (colorManager == undefined) {
            this.colorManager = new ColorManager();
        } else {
            this.colorManager = colorManager;
        }
        //this.cells = params.cells;
        this.cells = [];
        for (var i = 0; i < this.n; i++) {
            this.cells[i] = [];
        }
        this.positionManager = new PositionManager();

        for (var i = 0; i < this.n; i++) {
            for (var j = 0; j < this.m; j++) {
                var cell = new CellFactory.createCell(this.colorManager, this.logic_puzzle.map[i][j]);
                this.cells[i][j] = cell;
                cell.x = this.positionManager.getXFromCellX(i);
                cell.y = this.positionManager.getYFromCellY(j);
                this.addChild(cell);
                cell.xCell = i;
                cell.yCell = j;
            }
        }

        this.hints = [];
        for(var i=0; i<this.logic_puzzle.hints.length; i++) {
            var logicHint = this.logic_puzzle.hints[i];
            var hintCells = [];
            for(var k=0; k<logicHint.length; k++) {
                hintCells.push(this.cells[logicHint[k].x][logicHint[k].y]);
            }
            this.hints.push(new HintPath(hintCells));
        }
        this._sortHint();

        this.setContentSize(this.n * CellConfig.cell_width, this.m * CellConfig.cell_height);
        // this.paths = [];
        // this.touch_dot = new cc.Sprite(PuzzleResource.touch_dot);
        this.touch_dot = GUIRes.createSpriteWithRes(GUIRes.touch_dot);
        // this.touch_dot.setPosition(0, 0);
        this.addChild(this.touch_dot);
        this.touch_dot.setVisible(false);
        this.touch_dot.setBlendFunc(cc.SRC_ALPHA, cc.ONE);
        // src = cc.SRC_ALPHA;
        // dst = cc.ONE_MINUS_SRC_ALPHA;
        this.addTouchListener();
    },

    getLogicPuzzleWithHint:function(){
        var _this = this;

        var getCompletedPaths = function(){
            var paths = [];
            for (var i = 0; i < _this.n; i++) {
                for (var j = 0; j < _this.m; j++) {
                    if(_this.cells[i][j].type == CellType.DOT) {
                        var dotPaths = _this.cells[i][j].getPaths();
                        for(var k=0; k<dotPaths.length; k++) {
                            var path = dotPaths[k];
                            if(paths.indexOf(path) == -1) {
                                paths.push(path);
                            }
                        }
                    }
                }
            }
            return paths;
        };

        var changePathsToLogicPaths = function(paths){
            var logicPaths = [];
            for(var i=0; i<paths.length; i++) {
                var path = paths[i];
                var logicPath = [];
                for(var k=0; k<path.cells.length; k++) {
                    logicPath.push({x:path.cells[k].xCell, y:path.cells[k].yCell});
                }
                logicPaths.push(logicPath);
            }
            return logicPaths;
        };

        this.logic_puzzle.hints = changePathsToLogicPaths(getCompletedPaths());
        this.logic_puzzle.map = undefined;
        this.logic_puzzle.__instanceId = undefined;
        return this.logic_puzzle;
    },

    savePuzzleWithHintToFile:function(filename){
        var _this = this;

        var getCompletedPaths = function(){
            var paths = [];
            for (var i = 0; i < _this.n; i++) {
                for (var j = 0; j < _this.m; j++) {
                    if(_this.cells[i][j].type == CellType.DOT) {
                        var dotPaths = _this.cells[i][j].getPaths();
                        for(var k=0; k<dotPaths.length; k++) {
                            var path = dotPaths[k];
                            if(paths.indexOf(path) == -1) {
                                paths.push(path);
                            }
                        }
                    }
                }
            }
            return paths;
        };

        var changePathsToLogicPaths = function(paths){
            var logicPaths = [];
            for(var i=0; i<paths.length; i++) {
                var path = paths[i];
                var logicPath = [];
                for(var k=0; k<path.cells.length; k++) {
                    logicPath.push({x:path.cells[k].xCell, y:path.cells[k].yCell});
                }
                logicPaths.push(logicPath);
            }
            return logicPaths;
        };

        this.logic_puzzle.hints = changePathsToLogicPaths(getCompletedPaths());
        this.logic_puzzle.map = undefined;
        this.logic_puzzle.__instanceId = undefined;
        jsb.fileUtils.writeStringToFile(LZString.compressToUTF16(JSON.stringify(this.logic_puzzle)), filename);
    },


    /**
     * Kiem tra dam bao hint path ko bi trung voi mot path da co san hay khong.
     * @param hintPath
     */
    isHintPathDuplicatedWithPath:function(hintPath){
        var paths = hintPath._getStartCell().getPaths();
        for(var i=0; i<paths.length; i++) {
            if(hintPath.checkDuplicateWithPath(paths[i]))
                return true;
        }
        return false;
    },

    // isAllHintShowed:function(){
    //     for(var i=0; i<this.hints.length; i++) {
    //         if (this.hints[i].isShow() == false)
    //             return false;
    //     }
    //     return true;
    // },

    needToShowHint:function(){
        for(var i=0; i<this.hints.length; i++) {
            if ((this.hints[i].isShow() == false) && (this.isHintPathDuplicatedWithPath(this.hints[i]) == false))
                return true;
        }
        return false;
    },

    deleteWrongPath:function(){
        for (var i = 0; i < this.n; i++) {
            for (var j = 0; j < this.m; j++) {
                if(this.cells[i][j].type == CellType.DOT) {
                    var paths = this.cells[i][j].getPaths();
                    for(var p=0; p<paths.length; p++) {
                        var willBeDeleted = true;
                        for(var k=0; k<this.hints.length; k++) {
                            if(this.hints[k].isOkPathWithThisHint(paths[p])) {
                                willBeDeleted = false;
                                break;
                            }
                        }
                        if(willBeDeleted) paths[p].deletePath();
                    }
                }
            }
        }
    },

    /**
     * Sắp xếp gợi ý theo thứ tự từ ngắn nhất đến dài nhất
     * @private
     */
    _sortHint:function(){
        this.hints.sort(function(a, b) {
            return a.cells.length - b.cells.length;
        });
    },

    hint:function(callback){
        if(callback == undefined) callback = GUIUtil.nullFuntion;
        for(var i=0; i<this.hints.length; i++) {
            if(this.hints[i].isShow() == false) {
                if(this.isHintPathDuplicatedWithPath(this.hints[i]) == false) {
                    this.hints[i].show();
                    this.deleteWrongPath();
                    callback(GUIConstant.error.NONE);
                    return;
                }
            }
        }
        callback(GUIConstant.error.ALL_HINT_SHOWED);
    },

    // _browsePaths:function(callback){
    //     for(var i=0; i<this.logic_puzzle.dot_sequences.length; i++) {
    //
    //     }
    // },
    //
    // _browseTempPath:function(callback){
    //
    // },
    //
    // browseCompletedPath:function(callback){
    //
    // },

    // getPath: function (cell) {
    //     for (var i = 0; i < this.paths.length; i++) {
    //         if (this.paths[i].isContainsCell(cell)) {
    //             return this.paths[i];
    //         }
    //     }
    //     return null;
    // },

    getColorManager: function () {
        return this.colorManager;
    },

    scaleToFitArea: function (width, height) {
        var scaleFactor = 1;
        if ((this.n * CellConfig.cell_width) / (this.m * CellConfig.cell_height) > width / height) {
            scaleFactor = width / (this.n * CellConfig.cell_width);
        } else {
            scaleFactor = height / (this.m * CellConfig.cell_height);
        }
        this.setScale(scaleFactor);
    },

    getNumberPathCompleted: function () {
        var _this = this;
        var numberPathCompleted = 0;
        this.logic_puzzle.browseAllDotPosition(function (x, y) {
            var dotCell = _this.cells[x][y];
            var paths = dotCell.getPaths();
            for (var i = 0; i < paths.length; i++) {
                if (paths[i].isCompleted()) {
                    numberPathCompleted++;
                }
            }
        });
        return numberPathCompleted / 2;
    },

    isPuzzleCompleted: function () {
        return this.getNumberPathCompleted() == this.numberPathNeedCompleted;
    },

    setPuzzleCompletedCallback:function(callback){
        this.puzzleCompletedCallback = callback;
    },

    onPuzzleCompleted:function(){
        if(this.puzzleCompletedCallback)
            this.puzzleCompletedCallback(this);
    },

    addTouchListener: function () {
        var STATE = {
            NONE: 0,
            ON_TOP: 1,
            ON_DOT: 2
        };
        var state = STATE.NONE;

        var _this = this;
        var current_cell = null;
        var current_path = null;

        var checkTouchInPuzzle = function (touch) {
            var pos = _this.convertToNodeSpace(touch.getLocation());
            if (pos.x >= 0 && pos.x <= _this.n * CellConfig.cell_width
                && pos.y >= 0 && pos.y <= _this.m * CellConfig.cell_height) {
                return true;
            } else {
                return false;
            }
        };

        var enableLightPathsOfDot = function (cell) {
            var paths = cell.getPaths();
            for (var i = 0; i < paths.length; i++) {
                paths[i].setLight(true);
            }
        };

        var disableLightPathsOfDot = function (cell) {
            var paths = cell.getPaths();
            for (var i = 0; i < paths.length; i++) {
                paths[i].setLight(false);
            }
        };

        var disableLightAllPaths = function () {

        };

        var getPathOfDotCellAndCell = function (dotCell, cell) {
            var paths = dotCell.getPaths();
            for (var i = 0; i < paths.length; i++) {
                if (paths[i].hasCell(cell)) {
                    return paths[i];
                }
            }
            return null;
        };

        var time_start_touch = 0;
        var cell_touch = null;

        var tickDoubleClick = function (cell) {
            var currentTime = cc.sys.now();
            if (cell_touch == cell) {
                if (currentTime - time_start_touch < PUZZLE_CONFIG.DOUBLE_CLICK) {
                    onDoubleClick(cell);
                    resetDoubleClick();
                } else {
                    time_start_touch = currentTime;
                }
            } else {
                time_start_touch = currentTime;
                cell_touch = cell;
            }
        };

        var resetDoubleClick = function () {
            time_start_touch = 0;
            cell_touch = null;
        };

        var onDoubleClick = function (cell) {
            if (cell.type == CellType.DOT) {
                var paths = cell.getPaths();
                for (var i = 0; i < paths.length; i++) {
                    paths[i].deletePath();
                }
                state = STATE.ON_DOT;
            } else {
                var paths = cell.getPaths();
                if (paths.length > 0) paths[0].deletePath();
                _this.touch_dot.setVisible(false);
                state = STATE.NONE;
            }
        };

        var onPathComplete = function(path){
            path._getTopCell().elasticDot();
            path._getStartCell().elasticDot();
            jsb.AudioEngine.play2d(SoundRes.path_complete);
            tryToDeletePathIfRedundance(path._getTopCell(), path);
            if(_this.isPuzzleCompleted()) {
                _this.touch_dot.setVisible(false);
                _this.onPuzzleCompleted();
            }
        };

        var checkDotCompleted = function(cellDot){
            var paths = cellDot.getPaths();
            var max = cellDot.getMaxPath();
            if(paths.length < max)
                return false;
            for(var i=0; i<paths.length; i++) {
                if(!paths[i].isCompleted())
                    return false;
            }
            return true;
        };

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                var pos = _this.convertToNodeSpace(touch.getLocation());

                if (!checkTouchInPuzzle(touch)) {
                    return false;
                }

                /** Xác định ô mà người chơi chạm vào */
                var current_cell_x = _this.positionManager.getCellXFromX(pos.x);
                var current_cell_y = _this.positionManager.getCellYFromY(pos.y);
                current_cell = _this.cells[current_cell_x][current_cell_y];

                if (CellType.isFillable(current_cell.type) && !current_cell.isEmpty()) {
                    current_path = current_cell.getPaths()[0];
                    current_path.setLight(true);
                    if (current_path.checkCellAtTop(current_cell)) {
                        state = STATE.ON_TOP;
                    } else {
                        current_path.cutPath(current_cell);
                        state = STATE.ON_TOP;
                    }
                    _this.touch_dot.setColor(_this.colorManager.getColor(current_path.colorOrder));
                    _this.touch_dot.setPosition(pos);
                    _this.touch_dot.setVisible(true);
                    tickDoubleClick(current_cell);
                    return true;
                }

                if (current_cell.type == CellType.DOT) {
                    state = STATE.ON_DOT;
                    current_path = null;
                    var paths = current_cell.getPaths();
                    for(var i=0; i < paths.length; i++) {
                        if(!paths[i].isCompleted()) {
                            paths[i].deletePath();
                        }
                    }
                    enableLightPathsOfDot(current_cell);
                    _this.touch_dot.setColor(_this.colorManager.getColor(current_cell.colorOrder));
                    _this.touch_dot.setPosition(pos);
                    _this.touch_dot.setVisible(true);
                    tickDoubleClick(current_cell);
                    return true;
                }

                return false;
            },

            onTouchMoved: function (touch, event) {
                if (!checkTouchInPuzzle(touch)) {
                    return;
                }
                var pos = _this.convertToNodeSpace(touch.getLocation());
                _this.touch_dot.setPosition(pos);
                var cell_x = _this.positionManager.getCellXFromX(pos.x);
                var cell_y = _this.positionManager.getCellYFromY(pos.y);
                var cell = _this.cells[cell_x][cell_y];

                var distance_move = Math.abs(cell.xCell - current_cell.xCell) + Math.abs(cell.yCell - current_cell.yCell);

                if (distance_move != 1)
                    return;

                resetDoubleClick();

                // if(PUZZLE_CONFIG.autoBreakPath) {
                //     if(CellType.isFillableNotBridge(cell.type) && !cell.isEmpty() && cell.colorOrder != current_path.colorOrder) {
                //         cell.getPath().deletePath();
                //     }
                //
                // }

                switch (state) {
                    case STATE.ON_TOP:
                        /**
                         *
                         * 1. Nếu cell nằm ở ô áp chót của path (có nghĩa người chơi đang đi ngược lại)
                         *      Tiến hành cutTop(function(isCutAll){
                             *          if(isCutAll) {
                             *              removePath(currentPath)
                             *              current_path = null
                             *              current_cell = cell
                             *              state = ON_DOT
                             *              enableLightPathsOfDot(current_cell);
                             *          }
                             *      })
                         *
                         * 2. Nếu không thì thử add
                         * Path.tryToAdd(cell, function(canAdd, isComplete){
                             *     if(canAdd){
                             *          current_cell = cell;
                             *     }
                             *     if(isComplete) {
                             *          current_path = null;
                             *          current_cell = cell;
                             *          state = ON_DOT
                             *          Thực hiện cắt path ở dot nếu cần thiết
                             *          Thực hiện hiệu ứng sáng ở 2 dot
                             *          enableLightPathsOfDot(current_cell) (dòng này cần xem xét lại, nhỡ người chơi nối xong, thả tay ngay lập tức ra thì sao)
                             *     }
                             * })
                         *
                         */
                        if (current_path._getBeforeTopCell() == cell) {
                            var topCell = current_path._getTopCell();
                            var topDirection = current_path._getDirectionTopCell();
                            current_path.cutTop(function (isCutAll) {
                                current_cell = cell;
                                if (isCutAll) {
                                    //remove path ra khoi cuoc choi
                                    state = STATE.ON_DOT;
                                    current_path = null;
                                    enableLightPathsOfDot(current_cell);
                                }
                            });
                            topCell.recoveryCellsCut(topDirection);
                        } else {
                            current_path.tryToAdd(cell, function (canAdd, isComplete) {
                                if (canAdd) {
                                    // jsb.AudioEngine.play2d(SoundRes.hit_new_cell);
                                    current_cell = cell;
                                    if (isComplete) {
                                        onPathComplete(current_path);
                                        if(checkDotCompleted(current_cell)) {
                                            disableLightPathsOfDot(current_cell);
                                            _this.touch_dot.setVisible(false);
                                            state = STATE.NONE;
                                        } else {
                                            state = STATE.ON_DOT;
                                            enableLightPathsOfDot(current_cell);
                                        }
                                    }
                                }
                            });
                        }
                        break;
                    case STATE.ON_DOT:
                        /**
                         * 1.Nếu cell thuộc vào một path của current_cell thì:
                         *      currentPath = path đó
                         *      Thực hiện cut path tại vị trí cell, theo hướng currentCell
                         *      currentPath.cutPathToRemove(cell, current_cell)
                         *      state = STATE.ON_TOP
                         *      currentCell = cell
                         *      disableLightPathsOfDot(current_cell);
                         *      currentPath.setLight(true)
                         *
                         * 2.Nếu cell không thuộc path
                         *      tryToCreatePath(current_cell, cell, function(path){
                             *              if(path != null){
                             *                      disableLightPathsOfDot(current_cell);
                             *                      path.setLight(true);
                             *              }
                             *      })
                         */

                        var path = getPathOfDotCellAndCell(current_cell, cell);

                        if (path) {
                            current_path = path;
                            current_path.cutPathToRemove(cell, current_cell);
                            state = STATE.ON_TOP;
                            disableLightPathsOfDot(current_cell);
                            current_cell = cell;
                            current_path.setLight(true);
                        } else {
                            tryCreatePath(current_cell, cell, function (path) {
                                if (path) {
                                    disableLightPathsOfDot(current_cell);
                                    state = STATE.ON_TOP;
                                    current_path = path;
                                    current_cell = cell;
                                    current_path.setLight(true);
                                }
                            });
                        }
                        break;
                }
            },

            onTouchEnded: function (touch, event) {
                /**
                 *
                 * 2.Tắt hết tất cả đèn đóm chiếu sáng
                 *
                 */
                _this.touch_dot.setVisible(false);
                if (current_path) {
                    current_path.setLight(false);
                }
                if(state == STATE.ON_DOT) {
                    disableLightPathsOfDot(current_cell);
                }
                for (var i = 0; i < _this.n; i++) {
                    for (var j = 0; j < _this.m; j++) {
                        var cell = _this.cells[i][j];
                        if(cell.resetCellsCut) {
                            cell.resetCellsCut();
                        }
                    }
                }
                state = STATE.NONE;
            }
        }, this);
    }
});
