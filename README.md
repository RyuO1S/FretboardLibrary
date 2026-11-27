# Fretboard Library

A guitar music-theory site: interactive chord shapes on the welcome page, scales and chords on the fretboard, a key explorer with the circle of fifths, a progression workspace with strumming and picking patterns, a chord listener and tuner, and a Studio for writing or recording solos over your own progression and exporting them as MIDI. The Studio's scale map can highlight played notes and show the whole fretboard.

## Run it on your own computer

The chord listener's live mode needs the microphone, and browsers only allow that on `https://` pages or on `localhost`.

```sh
./build.sh
python3 -m http.server 8000
```

Then open http://localhost:8000 in Chrome, Edge or Safari and press **Listen live**.

## Files

- `src/head.html`: styles and page markup
- `src/theory.js`: the music engine (scales, chords, rhythm, recording, chord analysis and MIDI export)
- `src/ui.js`: the app, including the Studio, lessons and scale map
- `config.js`: optional Supabase settings for account-based progression sync
- `snd/`: guitar samples (one MP3 per instrument, with a JSON index of where each note starts)
- `build.sh`: joins the sources into `index.html`

## Credits

Guitar sounds: Musyng Kite soundfont, licensed CC BY-SA 3.0, prepared as MIDI.js soundfonts by Benjamin Gleitzman (github.com/gleitz/midi-js-soundfonts, MIT).
