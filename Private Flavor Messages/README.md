# PrivateFlavorMessages

  Author: Ergo Ironfist
  Version: 0.1
  Date: 08/01/2021

  Inspired by Phillip Tran's Hidden Roll Messages and Stephen Lindberg's World Map discovery, this script is a combination of both and will look for a token on the GM layer that is 
  within a given distance of a players token, and if found will roll for the moving player token and provide flavor text via private message to the player.

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

A whisper from "Your Intuition" is sent to the player and a pass/fail and copy of the text is whispered to the GM.
