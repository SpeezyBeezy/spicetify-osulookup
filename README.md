# osuLookup

A Spicetify extension that adds a context menu entry to any track, opening an osu! beatmap search for that song.

Right-click a track → **Search on osu!** → opens `osu.ppy.sh/beatmapsets` in your browser with the artist and title pre-filled.

Settings are available in the profile dropdown under **osu! Lookup Settings**, where you can configure game mode, beatmap status, NSFW visibility, and general filters. All settings persist across sessions.

---

## Installation

You have to patch spotify with [spicetify](https://spicetify.app/) first!
Go read the [spicetify installation guide ](https://spicetify.app/docs/getting-started)

### Windows

<details>
<summary>Show steps</summary>

1. Copy `osuLookup.js` to:
   ```
   %appdata%\spicetify\Extensions\
   ```
   You can paste that path directly into the File Explorer address bar.

2. Open a terminal and run:
   ```
   spicetify config extensions osuLookup.js
   spicetify apply
   ```

</details>

### Linux / macOS

<details>
<summary>Show steps</summary>

1. Copy `osuLookup.js` to the spicetify config folder 
The folder is usally either
   ```
   ~/.config/spicetify/Extensions/
   ```
   Or
   ```
   ~/.spicetify/Extensions/
   ```
   But you can just do the `spicetify config-dir` command to open up the correct config folder just place the `osuLookup.js` inside the `/Extensions` folder 
2. Run:
   ```
   spicetify config extensions osuLookup.js
   spicetify apply
   ```

</details>

---

## Removal

<details>
<summary>Show steps</summary>

Append a `-` after the filename to unregister it, then apply:

```
spicetify config extensions osuLookup.js-
spicetify apply
```

</details>

---

## Notes
- Only appears on single track selections, not albums or playlists. 
- The first listed artist is used for the search query.
- Requires your Spicetify and Spotify to be uptodate 
- Only tested ts on linux lmk if it works on mac and windows 
- Could implement the osu api for better results and maybe beatmap search inside spotify itself? 
- And yes this is some vibecoded slop 😔 
