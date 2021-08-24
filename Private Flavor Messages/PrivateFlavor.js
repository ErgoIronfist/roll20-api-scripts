
/*
  Author: Ergo Ironfist
  Version: 0.2
  Date: 08/01/2021

  Inspired by Phillip Tran's Hidden Roll Messages and Stephen Lindberg's World Map discovery, this script is a combination of both and will look for a token within a given distance
  and if found will roll for the moving player token and provide flavor text via private message to the player.


The script reads a JASON string from the tokens GM notes that contains the attribute to roll, the success required and an
on pass and on fail message.

The token currently has two configurations options in the JSON, resettoken will true or false if set to false the token will NOT be reset on a failed check.
The second atrribute is rollattrib if set to true a dice roll based on DICE will be added to the result
this allows for rols using bonuses like perception_bonus setting it to false will just use the attribute like passive_wisdom.

I use this mostly to roll passives for a player when they walk by a secret door, trap, on anything else I would normally check
for them if they are not actually searching.

Place the white-tower token marker on the token and the Jason in the GM Notes and set aura_1 to the distance you want. Place the location token on the GM Layer.


Json for token:
{

    "rollattrib": false,
    "resettoken": false,
    "attr": "passive_wisdom",
    "pass": 5,
    "on_pass": "While surveying the area you notice  a  masonry block on the floor that has an unmortared edge on it.",
    "on_fail": "The goblin bodies appear to have been chewed on by rats." //The fail message.

}

on_fail is optional and may be left off if there is no fail maeeage. In this case be sure to remove the comma afyer the on_pass message.



a whisper from "Your Intuition" is sent to the player and a pass/fail and copy of the text is whispered to the GM.

NOTES:
This script requires the Vctor Math and collision detection scripts to run.
The character token should have its name displayed.


08/02/2021 EI  Added functionality to choose between useing a passive trait like passive and not rolling or rolling with a bonus, and the option not to reset the tokin on a failed attempt

*/
var PrivateFlavorMessage = (function () {
    var DICE = 20;
    var PIXELS_PER_SQUARE = 70;
    var VERSION = '0.3';
    var resetToken = Boolean(false);
    var rollResult = Boolean(false);

    /**
     * Causes a location to become discovered.
     * @param {Graphic} location      The location that is being discovered.
     * @param {Graphic} discoverer    The token that discovered the location.
     */
  function discoverLocation(location, discoverer) {
       
        toBack(location);
        let character = getObj('character', discoverer.get('represents'));
        rollTest(discoverer, location, character);
       

      // log("rollResult: " + rollResult);
     //  log("resetToken: " + resetToken);

      // Failed the check, reset token if it is set to reset it. If not reset the token remains active for the next player that intersects it.
    

          if (resetToken) {
              location.set('aura1_radius', '');
              location.set('status_white-tower', false);
          }

     
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
        let rollYN = 1;
        let json = getGMNoteData(location);
        
        let attr = json["attr"];
        let passValue = json["pass"];
        let msgPass = json["on_pass"];
        let msgFail = json["on_fail"];
        let msgGM = "";
        rollYN = Boolean(json["rollattrib"]);
        resetToken = Boolean(json["resettoken"]);
       
        if (rollYN) {
            let diceRoll = ((DICE != 0) ? randomInteger(DICE) : 0);
             result = parseInt(getAttrByName(character.id, attr)) + diceRoll;
        } else {

            result = parseInt(getAttrByName(character.id, attr));
        }

        let recipient = discoverer.get("name").split(" ")[0]; // get first name only

        if (result >= passValue) {
            rollResult = true;
            let command = "/w " + recipient + " " + msgPass;

            msgGM = msgPass;
        
            sendChat("Your Intuition", command, null, { noarchive: true });
        }
        else if (msgFail != undefined) {
            let command = "/w " + recipient + " " + msgFail;
            msgGM = msgFail;
            sendChat("Your Intuition", command, null, { noarchive: true });
            rollResult = false;

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