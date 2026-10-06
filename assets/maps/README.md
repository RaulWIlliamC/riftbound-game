# Game maps

Every map has one folder here with `map.json` identifying its name, world dimensions, and renderer or artwork. Current maps: `sanctuary`, `arena`, and `whispering-ruins`. The arena uses a generated grid floor, so it does not need a background PNG. All Sanctuary and Whispering Ruins map artwork is stored in their respective folders.

The editor at `/previews/ruins-collision.html` discovers new folders containing `map.json` on the local development server. `catalog.json` supplies the same list on hosts without directory listings.

To register the next uploaded PNG:

```
node scripts/register-map.mjs map-id "Map name" /absolute/path/to/map.png
```

This creates its folder, copies the artwork, writes metadata, and adds it to the portable catalog. Refresh the editor to select it. Registering artwork makes it editable; adding a playable destination still requires scene/travel integration.

Each map's collision JSON lives in its folder. Export files identify the map and its dimensions. Drafts and applied test maps are separate per map and per browser. Whispering Ruins `collisions.json` is the user's imported export; `collisions.js` mirrors it for synchronous game startup. Regenerate that module whenever importing a newer JSON. Applying an editor draft tests it in the current browser; exporting and importing into this folder makes it part of the project.
