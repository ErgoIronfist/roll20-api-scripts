# PrivateFlavorMessages
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