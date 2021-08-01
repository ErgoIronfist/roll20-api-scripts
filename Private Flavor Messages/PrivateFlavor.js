
/*
  Author: Ergo Ironfist
  Version: 0.1
  Date: 08/01/2021

  Inspired by Phillip Tran's Hidden Roll Messages and Stephen Lindberg's World Map discovery, this script is a combination of both and will look for a token within a given distance
  and if found will roll for the moving player token and provide flavor text via private message to the player.

The script reads a JASON string from the tokens GM notes that contains the attribute to roll, the success required and an
on pass ans on fail message.

I use this mostly to roll passives for a player when they walk by a secret door, trap, on anything else I would normally check
for them if they are not actually searching.

Place the white-tower token marker on the token and the Jason in the GM Notes and set aura_1 to the distance you want. Place the location token on the GM Layer.


Json for token:
{

    "attr": "perception_bonus", // The attribute to use. Must match the exact name on the character sheet
    "pass": 20, //The value needed to pass the roll check
    "on_pass": "There is a masonry block that seems a little offset from the others. It looks as if it sticks out a little on one side.", //The sucess message
    "on_fail": "The goblin bodies appear to have been chewed on by rats." //The fail message

}

a whisper from "Your Intuition" is sent to the player and a pass/fail and copy of the text is whispered to the GM.

*/
var PrivateFlavorMessage = (function () {
    var DICE = 20;
    var PIXELS_PER_SQUARE = 70;
    var VERSION = '0.1';

    /**
     * Causes a location to become discovered.
     * @param {Graphic} location      The location that is being discovered.
     * @param {Graphic} discoverer    The token that discovered the location.
     */
    function discoverLocation(location, discoverer) {
        location.set('aura1_radius', '');
        location.set('status_white-tower', false);
        toBack(location);
        let character = getObj('character', discoverer.get('represents'));
        rollTest(discoverer, location, character);
    }

    /**
     * Gets the discovery distance for a location based on its aura's radius.
     * @param {Graphic} location
     * @return {number}
     */
    function getDiscoveryDistance(location) {
        var radiusUnits = location.get('aura1_radius');
        var pageId = location.get('_pageid');
        var page = getObj('page', pageId);
        var pageScale = page.get('scale_number');

        return radiusUnits / pageScale * PIXELS_PER_SQUARE + location.get('width') / 2;
    }

    /**
     * Returns the first undiscovered location the token is in range of, or null
     * if the token is not in range of an undiscvered location.
     * @param {Graphic} token
     * @return {Graphic[]}
     */
    function getLocationCollisions(token) {
        var pageId = token.get('_pageid');
        var tokenPt = _getTokenPt(token);

        return _.filter(getLocationTokens(pageId), function (location) {
            var locationPt = _getTokenPt(location);
            var dist = VecMath.dist(tokenPt, locationPt);
            var threshold = getDiscoveryDistance(location);
            return (dist <= threshold);
        });
    }

    /**
     * Returns all location tokens on some page.
     * Undiscovered locations reside on the gm layer.
     * @param {string} pageId
     * @return {Graphic[]}
     */
    function getLocationTokens(pageId) {
        return findObjs({
            _pageid: pageId,
            _type: "graphic",
            'status_white-tower': true,
            layer: "gmlayer"
        });
    }

    /**
     * Gets the location of a token as a point.
     * @private
     * @param {Graphic}
     * @return {vec2}
     */
    function _getTokenPt(token) {
        var x = token.get("left");
        var y = token.get("top");
        return [x, y];
    }

    /**
     * Initialization log
     */
    on('ready', function () {
        log('Initialized Private Flavor Messages v' + VERSION);
    });

    /**
     * When a graphic on the objects layer moves, run the script to see if it
     * passed through any traps.
     */
    on("change:graphic:lastmove", function (obj, prev) {
        var activePage = Campaign().get('playerpageid');

        // Check if the moved token came within range of any locations.
        if (obj.get("layer") === "objects" && obj.get("represents")) {
            var locations = getLocationCollisions(obj);
            _.each(locations, function (location) {
                discoverLocation(location, obj);
            });
        }
    });

    return {
        discoverLocation: discoverLocation,
        getDiscoveryDistance: getDiscoveryDistance,
        getLocationCollisions: getLocationCollisions,
        getLocationTokens: getLocationTokens
    };

    /* Get the GM Notes, Test the roll, send a whisper to the player and GM */

    function rollTest(discoverer, location, character) {
        let json = getGMNoteData(location);
        let attr = json["attr"];
        let passValue = json["pass"];
        let msgPass = json["on_pass"];
        let msgFail = json["on_fail"];
        let msgGM = "";
        let diceRoll = ((DICE != 0) ? randomInteger(DICE) : 0);
        let result = parseInt(getAttrByName(character.id, attr)) + diceRoll;
        let recipient = discoverer.get("name").split(" ")[0]; // get first name only

        if (result >= passValue) {

            let command = "/w " + recipient + " " + msgPass;
            msgGM = msgPass;
            log("CHAT SEND Pass " + command);
            sendChat("Your Intuition", command, null, { noarchive: true });

        }
        else if (msgFail != undefined) {
            let command = "/w " + recipient + " " + msgFail;
            msgGM = msgFail;
            sendChat("Your Intuition", command, null, { noarchive: true });

        }
        /* Let the GM know the results */
        let command = "/w gm <b>" + discoverer.get("name").split(" ")[0] + " | " + (result >= passValue) + "</b><br>" + msgGM;
        sendChat("PFM", command, null, { noarchive: true });
    };

    function getGMNoteData(location) {
        var decode
        let gmNote = location.get("gmnotes");

        gmNote = decodeURIComponent(gmNote).toString().replace(/<\/?[^>]+>/gi, ''); // Remove HTML
        gmNote = gmNote.replace(/&nbsp;/g, ""); // Remove non breaking whitespaces
        gmNote = gmNote.replace(/\n/g, ""); // Remove newlines

        try {

            if (gmNote.length == 0)
                throw "not valid Json";

            let json = JSON.parse(gmNote);
            return json;
        }
        catch (err) {
            sendChat("/w  gm  Status: <b>FAILED</b> \n Json Formatter: https://jsonformatter.curiousconcept.com/", null, { noarchive: true });

        }
    }


})();