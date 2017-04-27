var GUIRes = {

    bg: "gui/bg.png",
    button_load_puzzle: "gui/button_load_puzzle.png",
    button_load_puzzle_disable: "gui/button_load_puzzle_disable.png",
    button_load_puzzle_pressed: "gui/button_load_puzzle_pressed.png",

    block: "puzzle/block.png",
    bridge: "puzzle/bridge.png",
    bridge_fill_horizontal: "puzzle/bridge_fill_horizontal.png",
    bridge_fill_horizontal_light: "puzzle/bridge_fill_horizontal_light.png",
    bridge_fill_vertical: "puzzle/bridge_fill_vertical.png",
    bridge_fill_vertical_light: "puzzle/bridge_fill_vertical_light.png",
    bridge_top_horizontal: "puzzle/bridge_top_horizontal.png",
    bridge_top_horizontal_light: "puzzle/bridge_top_horizontal_light.png",
    bridge_top_vertical: "puzzle/bridge_top_vertical.png",
    bridge_top_vertical_light: "puzzle/bridge_top_vertical_light.png",
    cell_bg: "puzzle/cell_bg.png",
    dot: "puzzle/dot.png",
    go_straight_direction: "puzzle/go_straight_direction.png",
    puzzle_border: "puzzle/puzzle_border.png",
    segment_current: "puzzle/segment_current.png",
    segment_current_light: "puzzle/segment_current_light.png",
    segment_endpoint: "puzzle/segment_endpoint.png",
    segment_endpoint_light: "puzzle/segment_endpoint_light.png",
    segment_straight: "puzzle/segment_straight.png",
    segment_straight_light: "puzzle/segment_straight_light.png",
    segment_turn: "puzzle/segment_turn.png",
    segment_turn_light: "puzzle/segment_turn_light.png",
    stone: "puzzle/stone.png",
    touch_dot: "puzzle/touch_dot.png",
    turn_direction: "puzzle/turn_direction.png",
    bg_splash_screen: "splashscreen/bg_splash_screen.png",
    brand_name: "splashscreen/brand_name.png",
    connecting_txt: "splashscreen/connecting_txt.png",
    loading_bar: "splashscreen/loading_bar.png",
    loading_bar_bg: "splashscreen/loading_bar_bg.png",
    loading_txt: "splashscreen/loading_txt.png",
    logo: "splashscreen/logo.png",
    slogan: "splashscreen/slogan.png",
    updating_txt: "splashscreen/updating_txt.png",

    impact_font: "res/font/impact.ttf",
    falling_sky_font:"res/font/fallingsky.ttf",
    urw_chancery:"res/font/urw_chancery.ttf",
    arapey_italic:"res/font/arapey_italic.ttf",

    getLinkForSprite: function (link) {
        // cc.log(link);
        if (link.indexOf("res/") == 0) {
            return link;
        } else {
            return "#" + link;
        }
    },

    createSpriteWithRes:function(link){
        if (link.indexOf("res/") == 0) {
            return new cc.Sprite(link);
        } else {
            return new cc.Sprite(cc.spriteFrameCache.getSpriteFrame(link));
        }
    },

    getTypeTexture: function (link) {
        if (link.indexOf("res/") == 0) {
            return ccui.Widget.LOCAL_TEXTURE;
        } else {
            return ccui.Widget.PLIST_TEXTURE;
        }
    }

};
