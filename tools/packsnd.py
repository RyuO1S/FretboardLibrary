# Reads the downloaded soundfont files as plain text, pulls out each note's MP3, checks it, and packs one file per guitar.
import re, base64, json, struct, sys, os
src = sys.argv[1]; out = sys.argv[2]
NAMES = {'C':0,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'Gb':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
SETS = {
  'steel': 'MusyngKite/acoustic_guitar_steel-mp3.js',
  'nylon': 'MusyngKite/acoustic_guitar_nylon-mp3.js',
  'clean': 'MusyngKite/electric_guitar_clean-mp3.js',
  'jazz': 'MusyngKite/electric_guitar_jazz-mp3.js',
  'muted': 'MusyngKite/electric_guitar_muted-mp3.js',
  'overdrive': 'MusyngKite/overdriven_guitar-mp3.js',
  'distortion': 'MusyngKite/distortion_guitar-mp3.js',
}
pat = re.compile(r'"([A-G]b?)(-?\d)"\s*:\s*"data:audio/mpe?g?3?;base64,([A-Za-z0-9+/=]+)"')
total = 0
for key, rel in SETS.items():
    text = open(os.path.join(src, rel), encoding='ascii', errors='strict').read()
    notes = {}
    for nm, octv, b64 in pat.findall(text):
        midi = (int(octv) + 1) * 12 + NAMES[nm]
        if not (40 <= midi <= 88): continue
        data = base64.b64decode(b64, validate=True)
        if not (data[:3] == b'ID3' or (data[0] == 0xFF and (data[1] & 0xE0) == 0xE0)):
            raise SystemExit(f'{key} {nm}{octv}: not an MP3')
        notes[midi] = data
    missing = [m for m in range(40, 89) if m not in notes]
    blob = b''; index = {}
    for m in sorted(notes):
        index[str(m)] = [len(blob), len(notes[m])]
        blob += notes[m]
    head = json.dumps({'notes': index}).encode()
    with open(os.path.join(out, key + '.bin'), 'wb') as f:
        f.write(struct.pack('<I', len(head)) + head + blob)
    total += len(blob)
    print(f'{key:11s} notes {len(notes):2d} missing {missing} size {len(blob)/1024:.0f} KB')
print(f'total {total/1024/1024:.1f} MB')
