/* Music theory engine: spelling, library entries, fretboard dots, drop voicings */
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLAT_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const OPEN = [40, 45, 50, 55, 59, 64]; // low E to high E (MIDI)
const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'E'];
const MAX_FRET = 22;

function accStr(n) {
  return n === 0 ? '' : n > 0 ? '♯'.repeat(n) : '♭'.repeat(-n);
}

function parseNoteName(name) {
  const li = LETTERS.indexOf(name[0]);
  let acc = 0;
  for (const ch of name.slice(1)) {
    if (ch === '♯' || ch === '#') acc++;
    else if (ch === '♭' || ch === 'b') acc--;
  }
  return { li, acc, pc: (((LETTER_PC[li] + acc) % 12) + 12) % 12 };
}

function parseLabel(label) {
  const m = /^(bb|b|#)?(\d+)$/.exec(label);
  const acc = !m[1] ? 0 : m[1] === '#' ? 1 : m[1] === 'b' ? -1 : -2;
  const deg = +m[2];
  const semis = MAJOR[(deg - 1) % 7] + 12 * Math.floor((deg - 1) / 7) + acc;
  return { acc, deg, semis };
}

function spell(rootName, label) {
  const r = parseNoteName(rootName);
  const l = parseLabel(label);
  const letterIdx = (r.li + l.deg - 1) % 7;
  const pc = (((r.pc + l.semis) % 12) + 12) % 12;
  let off = (((pc - LETTER_PC[letterIdx]) % 12) + 12) % 12;
  if (off > 6) off -= 12;
  return { name: LETTERS[letterIdx] + accStr(off), pc, label, semis: l.semis };
}

function fmtLabel(label) {
  return label.replace(/bb/, '♭♭').replace(/b/, '♭').replace(/#/, '♯');
}

/* ---------- Library ---------- */
const ENTRIES = [];
function add(group, name, f, o) {
  ENTRIES.push(Object.assign({ id: 'e' + ENTRIES.length, group, name, f, kind: 'scale', sym: '' }, o || {}));
}

// Scales
add('Scales', 'Major (Ionian)', '1 2 3 4 5 6 7');
add('Scales', 'Natural minor (Aeolian)', '1 2 b3 4 5 b6 b7');
add('Scales', 'Harmonic minor', '1 2 b3 4 5 b6 7');
add('Scales', 'Melodic minor', '1 2 b3 4 5 6 7');
add('Scales', 'Major pentatonic', '1 2 3 5 6');
add('Scales', 'Minor pentatonic', '1 b3 4 5 b7');
add('Scales', 'Blues', '1 b3 4 b5 5 b7');
add('Scales', 'Whole tone', '1 2 3 #4 #5 b7');
add('Scales', 'Diminished (whole-half)', '1 2 b3 4 b5 b6 6 7');
add('Scales', 'Chromatic', '1 b2 2 b3 3 4 b5 5 b6 6 b7 7');

// Modes
add('Modes', 'Ionian', '1 2 3 4 5 6 7');
add('Modes', 'Dorian', '1 2 b3 4 5 6 b7');
add('Modes', 'Phrygian', '1 b2 b3 4 5 b6 b7');
add('Modes', 'Lydian', '1 2 3 #4 5 6 7');
add('Modes', 'Mixolydian', '1 2 3 4 5 6 b7');
add('Modes', 'Aeolian', '1 2 b3 4 5 b6 b7');
add('Modes', 'Locrian', '1 b2 b3 4 b5 b6 b7');

// Dominant scales
add('Dominant scales', 'Dominant (Mixolydian)', '1 2 3 4 5 6 b7');
add('Dominant scales', 'Lydian dominant', '1 2 3 #4 5 6 b7');
add('Dominant scales', 'Altered', '1 b2 b3 3 b5 b6 b7');
add('Dominant scales', 'Phrygian dominant', '1 b2 3 4 5 b6 b7');
add('Dominant scales', 'Diminished (half-whole)', '1 b2 b3 3 #4 5 6 b7');
add('Dominant scales', 'Bebop dominant', '1 2 3 4 5 6 b7 7');

// Arpeggios
const ARP = (name, f, sym) => add('Arpeggios', name, f, { kind: 'arp', sym });
ARP('Major triad', '1 3 5', '');
ARP('Minor triad', '1 b3 5', 'm');
ARP('Diminished triad', '1 b3 b5', '°');
ARP('Augmented triad', '1 3 #5', '+');
ARP('Suspended 2', '1 2 5', 'sus2');
ARP('Suspended 4', '1 4 5', 'sus4');
ARP('Major 7th', '1 3 5 7', 'maj7');
ARP('Dominant 7th', '1 3 5 b7', '7');
ARP('Minor 7th', '1 b3 5 b7', 'm7');
ARP('Half-diminished (m7♭5)', '1 b3 b5 b7', 'm7♭5');
ARP('Diminished 7th', '1 b3 b5 bb7', '°7');
ARP('Minor-major 7th', '1 b3 5 7', 'm(maj7)');
ARP('Major 6th', '1 3 5 6', '6');
ARP('Minor 6th', '1 b3 5 6', 'm6');
ARP('Dominant 7sus4', '1 4 5 b7', '7sus4');
ARP('Major 9th', '1 3 5 7 9', 'maj9');
ARP('Dominant 9th', '1 3 5 b7 9', '9');
ARP('Minor 9th', '1 b3 5 b7 9', 'm9');
ARP('Dominant 7♭9', '1 3 5 b7 b9', '7♭9');
ARP('Dominant 7♯9', '1 3 5 b7 #9', '7♯9');

// Diatonic arpeggios
const DIA = (group, roman, rootLabel, f, sym) =>
  add(group, roman + ' ' + (sym || 'major'), f, { kind: 'diatonic', roman, rootLabel, sym });
const M7 = 'Diatonic 7ths, major key';
DIA(M7, 'I', '1', '1 3 5 7', 'maj7');
DIA(M7, 'ii', '2', '1 b3 5 b7', 'm7');
DIA(M7, 'iii', '3', '1 b3 5 b7', 'm7');
DIA(M7, 'IV', '4', '1 3 5 7', 'maj7');
DIA(M7, 'V', '5', '1 3 5 b7', '7');
DIA(M7, 'vi', '6', '1 b3 5 b7', 'm7');
DIA(M7, 'vii', '7', '1 b3 b5 b7', 'm7♭5');
const N7 = 'Diatonic 7ths, minor key';
DIA(N7, 'i', '1', '1 b3 5 b7', 'm7');
DIA(N7, 'ii', '2', '1 b3 b5 b7', 'm7♭5');
DIA(N7, '♭III', 'b3', '1 3 5 7', 'maj7');
DIA(N7, 'iv', '4', '1 b3 5 b7', 'm7');
DIA(N7, 'v', '5', '1 b3 5 b7', 'm7');
DIA(N7, '♭VI', 'b6', '1 3 5 7', 'maj7');
DIA(N7, '♭VII', 'b7', '1 3 5 b7', '7');
const T3 = 'Diatonic triads, major key';
DIA(T3, 'I', '1', '1 3 5', '');
DIA(T3, 'ii', '2', '1 b3 5', 'm');
DIA(T3, 'iii', '3', '1 b3 5', 'm');
DIA(T3, 'IV', '4', '1 3 5', '');
DIA(T3, 'V', '5', '1 3 5', '');
DIA(T3, 'vi', '6', '1 b3 5', 'm');
DIA(T3, 'vii', '7', '1 b3 b5', '°');

// Drop voicings (4-note chords)
const DROPCHORDS = [
  ['Major 7th', '1 3 5 7', 'maj7'],
  ['Dominant 7th', '1 3 5 b7', '7'],
  ['Minor 7th', '1 b3 5 b7', 'm7'],
  ['Half-diminished (m7♭5)', '1 b3 b5 b7', 'm7♭5'],
  ['Diminished 7th', '1 b3 b5 bb7', '°7'],
  ['Minor-major 7th', '1 b3 5 7', 'm(maj7)'],
  ['Major 6th', '1 3 5 6', '6'],
  ['Minor 6th', '1 b3 5 6', 'm6'],
];
for (const n of [2, 3]) {
  for (const [name, f, sym] of DROPCHORDS) {
    add('Drop ' + n + ' voicings', name, f, { kind: 'drop', drop: n, sym });
  }
}

// Chord tone order, bottom to top, by index into [root, 3rd, 5th, 7th]
const INV = {
  2: [
    ['Root position', [0, 2, 3, 1]],
    ['1st inversion', [1, 3, 0, 2]],
    ['2nd inversion', [2, 0, 1, 3]],
    ['3rd inversion', [3, 1, 2, 0]],
  ],
  3: [
    ['Root position', [0, 3, 1, 2]],
    ['1st inversion', [1, 0, 2, 3]],
    ['2nd inversion', [2, 1, 3, 0]],
    ['3rd inversion', [3, 2, 0, 1]],
  ],
};
// Strings as indexes: 0 = low E ... 5 = high E
const SETS = {
  2: [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]],
  3: [[0, 2, 3, 4], [1, 3, 4, 5]],
};
function setLabel(set) {
  return set.map((s) => 6 - s).join('-');
}

function buildPattern(entry, keyPc, useFlats) {
  const keyName = (useFlats ? FLAT_NAMES : SHARP_NAMES)[keyPc];
  let rootName = keyName;
  if (entry.kind === 'diatonic') rootName = spell(keyName, entry.rootLabel).name;
  const notes = entry.f.split(' ').map((l) => spell(rootName, l));
  return { keyName, rootName, notes };
}

function dotsFor(notes) {
  const byPc = new Map();
  notes.forEach((n) => byPc.set(n.pc, n));
  const dots = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= MAX_FRET; f++) {
      const n = byPc.get((OPEN[s] + f) % 12);
      if (n) dots.push({ s, f, note: n });
    }
  }
  return dots;
}

function findVoicings(notes, order, strings) {
  const want = order.map((i) => notes[i]);
  const res = [];
  for (let f0 = 0; f0 <= MAX_FRET; f0++) {
    let prev = OPEN[strings[0]] + f0;
    if (prev % 12 !== want[0].pc) continue;
    const frets = [f0];
    let ok = true;
    for (let k = 1; k < want.length; k++) {
      const base = OPEN[strings[k]];
      let found = -1;
      for (let f = 0; f <= MAX_FRET; f++) {
        const p = base + f;
        if (p > prev && p % 12 === want[k].pc) { found = f; break; }
      }
      if (found < 0) { ok = false; break; }
      frets.push(found);
      prev = base + found;
    }
    if (!ok) continue;
    const fretted = frets.filter((x) => x > 0);
    const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
    if (span > 4) continue;
    res.push({ strings, frets, tones: want, min: fretted.length ? Math.min(...fretted) : 0, max: fretted.length ? Math.max(...fretted) : 0 });
  }
  return res.sort((a, b) => a.min - b.min);
}

function midiFor(s, f) {
  return OPEN[s] + f;
}

/* ---------- Scale patterns (positions) ----------
   5-6 note scales: 2 notes per string. 7-8 note scales: 3 notes per string.
   Pattern k starts on scale degree k on the low E string and climbs through the scale in pitch order.
   Everything else (arpeggios, chromatic) uses fret windows. */
const WINDOWS = [[0, 5], [3, 8], [6, 11], [9, 14], [12, 17], [15, 20], [17, 22]];

function npsOccurrence(notes, startIdx, f0, per) {
  const n = notes.length;
  let pitch = OPEN[0] + f0;
  const dots = [];
  for (let j = 0; j < 6 * per; j++) {
    const s = Math.floor(j / per);
    const ci = (startIdx + j) % n;
    if (j > 0) pitch += (notes[ci].pc - notes[(ci - 1 + n) % n].pc + 12) % 12;
    const fret = pitch - OPEN[s];
    if (fret < 0 || fret > MAX_FRET) return null;
    dots.push({ s, f: fret, note: notes[ci] });
  }
  return dots;
}

function patternsFor(entry, notes) {
  // The blues scale uses the pentatonic boxes with the blue note (b5) added inside each box.
  const blues = entry.kind === 'scale' && notes.length === 6 && notes.some((x) => x.label === 'b5');
  const core = blues ? notes.filter((x) => x.label !== 'b5') : notes;
  const blue = blues ? notes.find((x) => x.label === 'b5') : null;
  const n = core.length;
  const per = entry.kind === 'scale' ? (n === 5 ? 2 : n === 7 || n === 8 ? 3 : 0) : 0;
  const out = [];
  if (per) {
    for (let k = 0; k < n; k++) {
      const occurrences = [];
      for (let f0 = 0; f0 <= MAX_FRET; f0++) {
        if ((OPEN[0] + f0) % 12 !== core[k].pc) continue;
        const dots = npsOccurrence(core, k, f0, per);
        if (!dots) continue;
        const fr = dots.map((d) => d.f);
        const min = Math.min(...fr);
        const max = Math.max(...fr);
        if (blue) {
          for (let s = 0; s < 6; s++) {
            for (let f = min; f <= max; f++) if ((OPEN[s] + f) % 12 === blue.pc) dots.push({ s, f, note: blue });
          }
        }
        occurrences.push({ dots, min, max });
      }
      occurrences.sort((a, b) => a.min - b.min);
      out.push({ label: 'Pattern ' + (k + 1) + ' · starts on ' + core[k].name, occurrences });
    }
  } else {
    const all = dotsFor(notes);
    for (const [a, b] of WINDOWS) {
      out.push({ label: 'Frets ' + a + '–' + b, occurrences: [{ dots: all.filter((d) => d.f >= a && d.f <= b), min: a, max: b }] });
    }
  }
  return out;
}

/* ---------- Harmonization: chords built by stacking thirds on each degree of a 7-note scale ---------- */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const TRIAD_Q = { '4,7': '', '3,7': 'm', '3,6': '°', '4,8': '+' };
const SEV_Q = {
  '4,7,11': 'maj7', '4,7,10': '7', '3,7,10': 'm7', '3,6,10': 'm7♭5', '3,6,9': '°7',
  '3,7,11': 'm(maj7)', '4,8,11': 'maj7♯5', '4,8,10': '7♯5', '4,6,10': '7♭5', '3,6,11': '°(maj7)',
};
function chordLabel(i, semis) {
  if (i === 0) return '1';
  if (i === 1) return semis === 3 ? 'b3' : '3';
  if (i === 2) return semis === 6 ? 'b5' : semis === 8 ? '#5' : '5';
  return semis === 9 ? 'bb7' : semis === 10 ? 'b7' : '7';
}
function harmonize(notes, entry) {
  if (entry.kind !== 'scale' || notes.length !== 7) return null;
  const build = (size) =>
    notes.map((r, i) => {
      const tones = [0, 2, 4, 6].slice(0, size).map((k) => notes[(i + k) % 7]);
      const semis = tones.map((t) => (t.pc - r.pc + 12) % 12);
      const q = (size === 3 ? TRIAD_Q : SEV_Q)[semis.slice(1).join(',')];
      const sym = q === undefined ? '' : q;
      const m = /^(bb|b|#)?(\d)/.exec(r.label);
      const acc = m[1] === 'bb' ? '♭♭' : m[1] === 'b' ? '♭' : m[1] === '#' ? '♯' : '';
      let num = ROMAN[+m[2] - 1];
      if (semis[1] === 3) num = num.toLowerCase();
      const tag = size === 3
        ? (sym === '°' || sym === '+' ? sym : '')
        : ({ maj7: 'maj7', '7': '7', m7: '7', 'm7♭5': 'ø7', '°7': '°7' }[sym] || sym);
      return {
        roman: acc + num + tag,
        name: r.name + sym,
        sym,
        known: q !== undefined,
        tones: tones.map((t, k) => ({ name: t.name, pc: t.pc, label: chordLabel(k, semis[k]), semis: semis[k] })),
      };
    });
  return { triads: build(3), sevenths: build(4) };
}

/* ---------- Chords related to a key (beyond the seven diatonic ones) ----------
   Row: [roman as triad, roman as 7th chord, root as interval above the tonic, triad formula, 7th formula] */
const SYM_OF = { '1 3 5': '', '1 b3 5': 'm', '1 b3 b5': '°', '1 3 5 b7': '7', '1 b3 5 b7': 'm7', '1 3 5 7': 'maj7', '1 b3 b5 bb7': '°7' };
const T_MAJ = '1 3 5', T_MIN = '1 b3 5', T_DIM = '1 b3 b5';
const S_DOM = '1 3 5 b7', S_MIN7 = '1 b3 5 b7', S_MAJ7 = '1 3 5 7', S_DIM7 = '1 b3 b5 bb7';
const SECONDARY_HINT = 'Each one points at a chord in the key. It adds tension that the next chord resolves.';
const REL = {
  major: [
    { title: 'Secondary dominants', hint: SECONDARY_HINT, rows: [
      ['V/ii', 'V7/ii', '6', T_MAJ, S_DOM],
      ['V/iii', 'V7/iii', '7', T_MAJ, S_DOM],
      ['V/IV', 'V7/IV', '1', T_MAJ, S_DOM],
      ['V/V', 'V7/V', '2', T_MAJ, S_DOM],
      ['V/vi', 'V7/vi', '3', T_MAJ, S_DOM],
    ] },
    { title: 'Borrowed from the parallel minor', hint: 'Chords taken from the minor key on the same tonic. They add a darker colour.', rows: [
      ['iv', 'iv7', '4', T_MIN, S_MIN7],
      ['♭III', '♭IIImaj7', 'b3', T_MAJ, S_MAJ7],
      ['♭VI', '♭VImaj7', 'b6', T_MAJ, S_MAJ7],
      ['♭VII', '♭VII7', 'b7', T_MAJ, S_DOM],
    ] },
    { title: 'Substitutes and leading-tone chords', hint: '♭II is the Neapolitan chord. As a 7th chord it replaces V7 (tritone substitution). vii°7 leads up to I.', rows: [
      ['♭II', '♭II7', 'b2', T_MAJ, S_DOM],
      ['vii°', 'vii°7', '7', T_DIM, S_DIM7],
    ] },
  ],
  minor: [
    { title: 'Dominant chords (harmonic minor)', hint: 'The raised 7th gives a major V and a leading-tone diminished chord. Both pull strongly to i.', rows: [
      ['V', 'V7', '5', T_MAJ, S_DOM],
      ['vii°', 'vii°7', '7', T_DIM, S_DIM7],
    ] },
    { title: 'Secondary dominants', hint: SECONDARY_HINT, rows: [
      ['V/III', 'V7/III', 'b7', T_MAJ, S_DOM],
      ['V/iv', 'V7/iv', '1', T_MAJ, S_DOM],
      ['V/VI', 'V7/VI', 'b3', T_MAJ, S_DOM],
    ] },
    { title: 'Borrowed and colour chords', hint: 'IV comes from the Dorian mode. ♭II is the Neapolitan chord.', rows: [
      ['IV', 'IV7', '4', T_MAJ, S_DOM],
      ['♭II', '♭IImaj7', 'b2', T_MAJ, S_MAJ7],
    ] },
  ],
};
function relatedChords(homeNotes, mode, type) {
  const tonic = homeNotes[0].name;
  return REL[mode].map((g) => ({
    title: g.title,
    hint: g.hint,
    chords: g.rows.map((row) => {
      const f = type === 'seventh' ? row[4] : row[3];
      const root = spell(tonic, row[2]);
      return { roman: type === 'seventh' ? row[1] : row[0], name: root.name + SYM_OF[f], tones: f.split(' ').map((l) => spell(root.name, l)) };
    }),
  }));
}

/* ---------- Chord shapes: playable fingerings found by search ----------
   A shape is 6 numbers, low E to high e: -1 = muted, 0 = open, n = fret.
   Rules: played strings are side by side, at least 4 of them, root in the bass, every essential tone present
   (the 5th may be left out of a 7th chord), a 4-fret span, and no more than 4 fingers (a barre counts as one). */
function fingerCount(fr) {
  // Every fretted note needs a finger. The index finger can bar the lowest fret when the shape has no open strings.
  const byFret = {};
  fr.forEach((x, s) => { if (x > 0) (byFret[x] = byFret[x] || []).push(s); });
  const frets = Object.keys(byFret).map(Number);
  if (!frets.length) return { count: 0, effort: 0, barre: null };
  const minF = Math.min.apply(null, frets);
  const ss = byFret[minF];
  let count = frets.reduce((n, x) => n + byFret[x].length, 0);
  let effort = count;
  let barre = null;
  if (fr.indexOf(0) < 0 && ss.length >= 2) {
    barre = { fret: minF, from: ss[0], to: ss[ss.length - 1] };
    count = count - ss.length + 1;
    effort = count + 1; // a barre is harder than a single finger
  }
  return { count, effort, barre };
}

const SHAPE_CACHE = new Map();
// bass (optional): the note that must be lowest, for slash chords like C/E or A/B
function chordShapes(tones, max, bass) {
  max = max || 4;
  const slash = Number.isInteger(bass) && bass !== tones[0].pc ? bass : null;
  const ck = tones.map((t) => t.pc).join(',') + '|' + max + '|' + (slash === null ? '' : slash);
  if (SHAPE_CACHE.has(ck)) return SHAPE_CACHE.get(ck);
  const pcs = new Set(tones.map((t) => t.pc));
  const bassIsTone = slash === null || pcs.has(slash);
  if (slash !== null) pcs.add(slash);
  const rootPc = slash === null ? tones[0].pc : slash;
  const need = (tones.length >= 4 ? [tones[0].pc, tones[1].pc, tones[3].pc] : tones.map((t) => t.pc)).concat(slash === null ? [] : [slash]);
  const all = [];
  const seen = new Set();
  for (const strict of [true, false]) {
    for (let lo = 0; lo <= 12; lo++) {
      const fmin = Math.max(lo, 1);
      const fmax = Math.min(lo + 3, MAX_FRET);
      const cand = [];
      for (let s = 0; s < 6; s++) {
        const c = [];
        if (lo <= 3 && pcs.has(OPEN[s] % 12)) c.push(0);
        for (let f = fmin; f <= fmax; f++) if (pcs.has((OPEN[s] + f) % 12)) c.push(f);
        cand.push(c);
      }
      const cur = [-1, -1, -1, -1, -1, -1];
      const leaf = () => {
        const played = cur.filter((x) => x >= 0).length;
        if (played < 4) return;
        const first = cur.findIndex((x) => x >= 0);
        const here = new Set();
        cur.forEach((f, s) => { if (f >= 0) here.add((OPEN[s] + f) % 12); });
        if (!need.every((p) => here.has(p))) return;
        const bassPc = (OPEN[first] + cur[first]) % 12;
        if ((strict || slash !== null) && bassPc !== rootPc) return;
        // a bass note that is not in the chord (the B of A/B) belongs only at the bottom
        if (!bassIsTone && cur.some((f, s) => s !== first && f >= 0 && (OPEN[s] + f) % 12 === slash)) return;
        const key = cur.join(',');
        if (seen.has(key)) return;
        const fg = fingerCount(cur);
        if (fg.count > 4) return;
        seen.add(key);
        const fretted = cur.filter((x) => x > 0);
        const mn = fretted.length ? Math.min.apply(null, fretted) : 0;
        const mx = fretted.length ? Math.max.apply(null, fretted) : 0;
        const opens = cur.filter((x) => x === 0).length;
        const omitted = tones.length >= 4 && !here.has(tones[2].pc);
        const score = fg.effort * 1.5 + (6 - played) * 1.6 + (mx - mn) * 0.5 + (omitted ? 0.8 : 0) + mn * 0.3 - opens * 0.2 + (strict ? 0 : 3);
        all.push({ frets: cur.slice(), barre: fg.barre, min: mn, max: mx, fingers: fg.count, score, inversion: bassPc !== rootPc });
      };
      const dfs = (s, phase) => {
        if (s === 6) { if (phase > 0) leaf(); return; }
        cur[s] = -1;
        dfs(s + 1, phase === 0 ? 0 : 2);
        if (phase !== 2) for (const f of cand[s]) { cur[s] = f; dfs(s + 1, 1); }
        cur[s] = -1;
      };
      dfs(0, 0);
    }
    if (all.length) break;
  }
  all.sort((a, b) => a.score - b.score);
  const posOf = (c) => (c.frets.indexOf(0) >= 0 ? 0 : c.min);
  const list = [];
  for (const c of all) {
    if (list.length >= max) break;
    if (list.every((p) => Math.abs(posOf(p) - posOf(c)) >= 3)) list.push(c);
  }
  list.sort((a, b) => posOf(a) - posOf(b) || a.score - b.score);
  const res = { best: all[0] || null, list, all };
  SHAPE_CACHE.set(ck, res);
  return res;
}

/* ---------- Progression workspace helpers (pure: no audio, no page) ----------
   A slot is one chord in the progression:
   { name, roman, tones: [{name, pc, label, semis}], frets: [6 numbers] or null, beats: 1..8 } */
const PROG_MAX = 128;   // plenty of room: a whole song
const SPEEDS = [0.5, 0.75, 1, 1.5, 2];
/* Strumming and picking patterns. steps: one character per step, `grid` steps per beat, the pattern repeats.
   D down-strum  U up-strum (top strings)  d u soft ghost strums  x muted chuck  C "chick" strum of the upper strings
   K short chop (top 3 strings)  B bass note  A alternate bass  P pluck the top 3 notes together  T bass + pluck
   1 2 3 single top notes (1 = highest)  M palm-muted low strings  . rest (let it ring) */
const RHYTHMS = [
  { id: 'hold', name: 'Chord', group: 'Basic', hint: 'One strum that rings for the whole chord.' },
  { id: 'strum', name: 'Quarter strums', group: 'Basic', grid: 2, steps: 'D.D.D.D.', hint: 'A down-strum on every beat.' },
  { id: 'arp', name: 'Arpeggio', group: 'Basic', hint: 'Single notes up the chord and back down, in eighths.' },
  { id: 'pop', name: 'Pop', group: 'Strumming', grid: 2, steps: 'D.DU.UDU', hint: 'Down, down-up, up-down-up: the classic campfire pattern.' },
  { id: 'rock', name: 'Rock 8ths', group: 'Strumming', grid: 2, steps: 'DdDdDdDd', hint: 'Driving down-strokes on every eighth, accent on the beat.' },
  { id: 'folk', name: 'Folk boom-chick', group: 'Strumming', grid: 2, steps: 'B.CuA.Cu', hint: 'Bass note, strum, alternate bass, strum. Country and folk.' },
  { id: 'shuffle', name: 'Blues shuffle', group: 'Strumming', grid: 2, steps: 'DuDuDuDu', swing: 0.67, hint: 'Swung eighths, long-short, long-short.' },
  { id: 'funk', name: 'Funk 16ths', group: 'Strumming', grid: 4, steps: 'DxuxxUxDxuDxUxux', short: true, hint: 'Tight sixteenths: short accents between muted scratches.' },
  { id: 'reggae', name: 'Reggae', group: 'Offbeat', grid: 2, steps: '..K...K.', hint: 'Short chops on beats 2 and 4. Leave space.' },
  { id: 'ska', name: 'Ska', group: 'Offbeat', grid: 2, steps: '.K.K.K.K', hint: 'Short up-stroke chops on every offbeat.' },
  { id: 'bossa', name: 'Bossa nova', group: 'Picking', grid: 2, steps: 'T..PA.P.B.P.AP..', soft: true, hint: 'Thumb plays bass on 1 and 3, fingers pluck a syncopated two-bar figure.' },
  { id: 'travis', name: 'Travis picking', group: 'Picking', grid: 2, steps: 'B3A2B3A1', hint: 'Thumb alternates bass on every beat, fingers pick the offbeats.' },
  { id: 'ballad', name: 'Ballad picking', group: 'Picking', grid: 2, steps: 'B321A123', hint: 'Bass, then fingers roll down and back up the top strings.' },
  { id: 'gallop', name: 'Gallop', group: 'Rock and metal', grid: 4, steps: 'M.MMM.MMM.MMM.MM', short: true, hint: 'Palm-muted eighth plus two sixteenths.' },
  { id: 'waltz', name: 'Waltz 3/4', group: 'Strumming', grid: 2, beats: 3, steps: 'B.C.C.', hint: 'Bass on 1, chord on 2 and 3. Give chords 3 or 6 beats.' },
];
const PROG_STYLES = RHYTHMS.map((r) => r.id);
// patterns people make themselves; the page keeps this list in step with the saved progression
const CUSTOM_RHYTHMS = [];
const STEP_CHARS = 'DdUuxCKBAPT123MS.';
const rhythmOf = (id) => (id && typeof id === 'object' ? id : RHYTHMS.find((r) => r.id === id) || CUSTOM_RHYTHMS.find((r) => r.id === id) || RHYTHMS[0]);
function cleanRhythm(r) {
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !/^c[a-z0-9]{1,24}$/.test(r.id)) return null;
  const grid = [2, 3, 4].indexOf(r.grid) >= 0 ? r.grid : 2;
  const beats = Number.isInteger(r.beats) && r.beats >= 1 && r.beats <= GROOVE_MAX_BEATS ? r.beats : 4;
  const n = grid * beats;
  const steps = (typeof r.steps === 'string' ? r.steps : '').split('').map((c) => (STEP_CHARS.indexOf(c) >= 0 ? c : '.')).join('').slice(0, n).padEnd(n, '.');
  const name = (typeof r.name === 'string' && r.name.trim() ? r.name.trim() : 'My pattern').slice(0, 40);
  // picking patterns: one 6-bit string mask per step (bit 0 = low E ... bit 5 = high e), shown as S in steps
  let picks = null;
  if (Array.isArray(r.picks)) {
    picks = [];
    for (let i = 0; i < n; i++) { const m = r.picks[i]; picks.push(Number.isInteger(m) && m > 0 && m < 64 ? m : 0); }
    if (!picks.some((m) => m)) picks = null;
  }
  const st = picks ? picks.map((m) => (m ? 'S' : '.')).join('') : steps.replace(/S/g, '.');
  return { id: r.id, name, group: 'My patterns', custom: true, grid, beats, steps: st, picks, swing: r.swing ? 0.67 : 0, short: !!r.short, hint: picks ? 'Your own picking pattern.' : 'Your own pattern.' };
}
// re-time a pattern to a new length or subdivision, keeping each stroke at the same moment where it still fits
function regridPicks(picks, grid, beats, newGrid, newBeats) {
  const out = new Array(newGrid * newBeats).fill(0);
  picks.forEach((m, i) => {
    if (!m) return;
    const j = Math.round((i / grid) * newGrid);
    if (j < out.length) out[j] |= m;
  });
  return out;
}
// the note a string sounds in a chord shape; a muted string below the shape plays the bass, a muted one inside is silent
function stringNote(slot, s, midis, bass) {
  if (slot.frets) {
    if (slot.frets[s] >= 0) return OPEN[s] + slot.frets[s];
    const lowest = slot.frets.findIndex((f) => f >= 0);
    return s < lowest ? bass : null;
  }
  return midis[Math.max(0, Math.min(midis.length - 1, s - (6 - midis.length)))];
}
function regridSteps(steps, grid, beats, newGrid, newBeats) {
  const out = new Array(newGrid * newBeats).fill('.');
  steps.split('').forEach((c, i) => {
    if (c === '.') return;
    const j = Math.round((i / grid) * newGrid);
    if (j < out.length && out[j] === '.') out[j] = c;
  });
  return out.join('');
}

function slotMidis(slot) {
  if (slot.frets) {
    const m = [];
    slot.frets.forEach((f, s) => { if (f >= 0) m.push(OPEN[s] + f); });
    return m.sort((a, b) => a - b);
  }
  // no fingering found: stack the chord tones upward from the root near middle C (with a slash bass under them)
  let prev = 48 + ((((slot.tones[0].pc - 48) % 12) + 12) % 12) - 1;
  const up = slot.tones.map((t) => {
    let m = prev + 1;
    while (m % 12 !== t.pc) m++;
    prev = m;
    return m;
  });
  if (Number.isInteger(slot.bass) && slot.bass !== slot.tones[0].pc) { let b = up[0] - 1; while (b % 12 !== slot.bass) b--; up.unshift(b); }
  return up;
}

// What to play for one slot, as times in seconds from the start of the slot. bs = seconds per beat.
// A pattern from RHYTHMS. startBeat keeps long patterns (bossa nova) running across chord changes.
function rhythmPlan(slot, r, bs, startBeat) {
  const midis = slotMidis(slot);
  const n = midis.length;
  const dur = slot.beats * bs;
  const notes = [], hits = [];
  if (!n) return { dur, notes, hits };
  const root = Number.isInteger(slot.bass) ? slot.bass : slot.tones[0].pc;
  const fifth = slot.tones[2] ? slot.tones[2].pc : null;
  const bass = midis.find((m) => m % 12 === root) || midis[0];
  const alt = (fifth !== null && midis.find((m) => m > bass && m % 12 === fifth && m < bass + 12)) || midis.find((m) => m > bass) || bass;
  const upperAll = midis.filter((m) => m > alt);
  const upper = upperAll.length >= 2 ? upperAll : midis.slice(1);
  const top = (k) => midis.slice(-k);
  const grid = r.grid, len = r.steps.length, sd = bs / grid;
  const steps = Math.round(slot.beats * grid);
  const off = Math.round((startBeat || 0) * grid);
  const soft = r.soft ? 0.8 : 1;
  const gapTo = (pos) => { let g = 1; while (g < len && r.steps[(pos + g) % len] === '.') g++; return g; };
  const add = (list, t, spread, vol, ring, cut) => list.forEach((m, k) => notes.push(Object.assign({ t: t + k * spread, midi: m, dur: ring, vol: vol * soft }, cut ? { cut } : {})));
  for (let k = 0; k < steps; k++) {
    const g = off + k;
    const pos = g % len;
    const c = r.steps[pos];
    if (c === '.') continue;
    let t = k * sd;
    if (r.swing && grid === 2 && g % 2 === 1) t = (k - 1) * sd + 2 * sd * r.swing;
    const barLen = grid * (r.beats || 4);
    const acc = g % barLen === 0 ? 1.15 : g % grid === 0 ? 1 : 0.85;
    const ring = r.short ? 0.16 : Math.min(2.6, Math.max(0.25, gapTo(pos) * sd + 0.3));
    const sp = Math.min(0.018, sd * 0.12);
    hits.push({ t, pos });
    if (c === 'D') add(midis, t, sp, 0.17 * acc, ring);
    else if (c === 'd') add(midis, t, sp, 0.09, ring);
    else if (c === 'U') add(top(Math.min(4, n)).reverse(), t, sp, 0.14 * acc, ring);
    else if (c === 'u') add(top(Math.min(4, n)).reverse(), t, sp, 0.075, ring);
    else if (c === 'x') add(g % 2 ? midis.slice().reverse() : midis, t, 0.005, 0.07, 0.05, 900);
    else if (c === 'C') add(upper, t, sp, 0.15 * acc, ring);
    else if (c === 'K') add(top(Math.min(3, n)).reverse(), t, 0.008, 0.16 * acc, 0.13);
    else if (c === 'B') add([bass], t, 0, 0.22 * acc, Math.max(ring, bs * 1.2));
    else if (c === 'A') add([alt], t, 0, 0.2 * acc, Math.max(ring, bs * 1.2));
    else if (c === 'P') add(top(Math.min(3, n)), t, 0.004, 0.13 * acc, ring);
    else if (c === 'T') { add([bass], t, 0, 0.22 * acc, Math.max(ring, bs * 1.2)); add(top(Math.min(3, n)), t, 0.004, 0.13 * acc, ring); }
    else if (c === '1' || c === '2' || c === '3') add([midis[Math.max(0, n - +c)]], t, 0, 0.17 * acc, ring);
    else if (c === 'M') add(midis.slice(0, Math.min(3, n)), t, 0.004, 0.2 * acc, 0.11, 700);
    else if (c === 'S' && r.picks) {
      const list = [];
      for (let s = 0; s < 6; s++) if (r.picks[pos] & (1 << s)) { const m = stringNote(slot, s, midis, bass); if (m !== null && list.indexOf(m) < 0) list.push(m); }
      add(list.sort((a, b) => a - b), t, 0.004, 0.17 * acc, ring);
    }
  }
  return { dur, notes, hits };
}

function slotPlan(slot, style, bs, startBeat) {
  const rh = rhythmOf(style);
  if (rh.steps && rh.id !== 'strum') return rhythmPlan(slot, rh, bs, startBeat);
  const midis = slotMidis(slot);
  const dur = slot.beats * bs;
  const notes = [];
  const strum = (t, spread, vol, ring) => {
    midis.forEach((m, k) => notes.push({ t: t + k * spread, midi: m, dur: ring, vol }));
  };
  if (rh.id === 'arp') {
    // eighth notes, up the chord and back down
    const seq = midis.length > 2 ? midis.concat(midis.slice(1, -1).reverse()) : midis;
    const n = Math.max(1, Math.round(slot.beats * 2));
    for (let i = 0; i < n; i++) {
      notes.push({ t: i * (bs / 2), midi: seq[i % seq.length], dur: Math.min(2.4, Math.max(0.5, bs * 2.2)), vol: i % 2 === 0 ? 0.24 : 0.19 });
    }
  } else if (rh.id === 'strum') {
    // a down-strum on every beat, the first one a little stronger
    for (let b = 0; b < slot.beats; b++) strum(b * bs, Math.min(0.03, bs * 0.08), b === 0 ? 0.19 : 0.15, Math.min(2.6, bs * 1.6 + 0.3));
    const off = Math.round((startBeat || 0) * 2);
    return { dur, notes, hits: Array.from({ length: slot.beats }, (_, b) => ({ t: b * bs, pos: (off + b * 2) % 8 })) };
  } else {
    // one strum that rings for the length of the slot
    strum(0, Math.min(0.045, bs * 0.1), 0.19, Math.min(4.8, dur * 1.1 + 0.5));
  }
  return { dur, notes };
}

// Tap tempo: timestamps in ms. Only the latest run of taps counts (a gap over 2 s starts over).
function tempoFromTaps(taps) {
  const run = [];
  for (let i = taps.length - 1; i >= 0; i--) {
    if (run.length && run[0] - taps[i] > 2000) break;
    run.unshift(taps[i]);
  }
  const r = run.slice(-6);
  if (r.length < 2) return null;
  const avg = (r[r.length - 1] - r[0]) / (r.length - 1);
  return Math.max(40, Math.min(220, Math.round(60000 / avg)));
}

function moveItem(arr, from, to) {
  const a = arr.slice();
  if (from === to || from < 0 || to < 0 || from >= a.length || to >= a.length) return a;
  a.splice(to, 0, a.splice(from, 1)[0]);
  return a;
}

// Checks anything read back from storage before it is trusted
function cleanProg(raw) {
  const out = { slots: [], bpm: 96, speed: 1, style: 'hold', loop: true, click: false, customs: [] };
  if (!raw || typeof raw !== 'object') return out;
  if (Array.isArray(raw.customs)) {
    raw.customs.slice(0, 40).forEach((r) => { const c = cleanRhythm(r); if (c && !out.customs.some((x) => x.id === c.id)) out.customs.push(c); });
  }
  const okStyle = (s) => PROG_STYLES.indexOf(s) >= 0 || out.customs.some((c) => c.id === s);
  if (Array.isArray(raw.slots)) {
    raw.slots.slice(0, PROG_MAX).forEach((s) => {
      if (!s || typeof s.name !== 'string' || !Array.isArray(s.tones) || !s.tones.length || s.tones.length > 8) return;
      const ok = s.tones.every((t) => t && Number.isInteger(t.pc) && t.pc >= 0 && t.pc < 12 && typeof t.name === 'string' && /^(bb|b|#)?\d+$/.test(t.label));
      if (!ok) return;
      const frets = Array.isArray(s.frets) && s.frets.length === 6 && s.frets.every((f) => Number.isInteger(f) && f >= -1 && f <= MAX_FRET) && s.frets.some((f) => f >= 0) ? s.frets.slice() : null;
      out.slots.push({
        name: s.name.slice(0, 24),
        roman: typeof s.roman === 'string' ? s.roman.slice(0, 16) : '',
        tones: s.tones.map((t) => ({ name: t.name.slice(0, 6), pc: t.pc, label: t.label, semis: Number.isFinite(t.semis) ? t.semis : 0 })),
        frets,
        beats: Math.max(1, Math.min(8, Number.isInteger(s.beats) ? s.beats : 4)),
        style: okStyle(s.style) ? s.style : '',
      });
      if (Number.isInteger(s.bass) && s.bass >= 0 && s.bass < 12 && s.bass !== s.tones[0].pc) out.slots[out.slots.length - 1].bass = s.bass;
    });
  }
  if (Number.isFinite(raw.bpm)) out.bpm = Math.max(40, Math.min(220, Math.round(raw.bpm)));
  if (SPEEDS.indexOf(raw.speed) >= 0) out.speed = raw.speed;
  if (okStyle(raw.style)) out.style = raw.style;
  out.loop = raw.loop !== false;
  out.click = raw.click === true;
  return out;
}

/* ---------- Chord search: "Cm7", "F#dim", "Bbmaj7", or just "dim" ---------- */
const ARP_ENTRIES = ENTRIES.filter((e) => e.kind === 'arp');
const QUAL = {
  '': { short: 'Major', alias: ['', 'maj', 'major', 'M'] },
  m: { short: 'm', alias: ['m', 'min', 'minor', '-'] },
  '°': { short: 'dim', alias: ['dim', '°', 'o', 'diminished'] },
  '+': { short: 'aug', alias: ['aug', '+', 'augmented'] },
  sus2: { short: 'sus2', alias: ['sus2'] },
  sus4: { short: 'sus4', alias: ['sus4', 'sus'] },
  maj7: { short: 'maj7', alias: ['maj7', 'M7', 'Δ', 'Δ7', 'ma7', 'major7'] },
  '7': { short: '7', alias: ['7', 'dom7', 'dominant7'] },
  m7: { short: 'm7', alias: ['m7', 'min7', '-7', 'minor7'] },
  'm7♭5': { short: 'm7♭5', alias: ['m7♭5', 'm7b5', 'ø', 'ø7', 'halfdim', 'half-dim', 'halfdiminished'] },
  '°7': { short: 'dim7', alias: ['dim7', '°7', 'o7', 'diminished7'] },
  'm(maj7)': { short: 'm(maj7)', alias: ['m(maj7)', 'mmaj7', 'mM7', 'm/maj7', 'minmaj7'] },
  '6': { short: '6', alias: ['6', 'maj6'] },
  m6: { short: 'm6', alias: ['m6', 'min6'] },
  '7sus4': { short: '7sus4', alias: ['7sus4', '7sus'] },
  maj9: { short: 'maj9', alias: ['maj9', 'M9'] },
  '9': { short: '9', alias: ['9'] },
  m9: { short: 'm9', alias: ['m9', 'min9'] },
  '7♭9': { short: '7♭9', alias: ['7♭9', '7b9'] },
  '7♯9': { short: '7♯9', alias: ['7♯9', '7#9'] },
};
// a chord with another note in the bass (C → C/E). The bass is spelled like the chord, unless told otherwise
function withBass(ch, bass, flats) {
  if (!Number.isInteger(bass) || bass === ch.tones[0].pc) return Object.assign({}, ch, { bass: undefined });
  const inChord = ch.tones.find((t) => t.pc === bass);
  const nm = inChord ? inChord.name : (flats === undefined ? (ch.flats ? FLAT_NAMES : SHARP_NAMES) : (flats ? FLAT_NAMES : SHARP_NAMES))[bass];
  return Object.assign({}, ch, { bass, bassName: nm, name: ch.name.replace(/\/.*$/, '') + '/' + nm });
}
// A chord from the picker list: spelled with the fewest accidentals unless a spelling is forced
function pickerChord(qi, pc, flatsPref, forced) {
  const e = ARP_ENTRIES[qi] || ARP_ENTRIES[0];
  const accs = (fl) => buildPattern(e, pc, fl).notes.reduce((a, t) => a + t.name.length - 1, 0);
  const flats = forced !== undefined ? forced : accs(!flatsPref) < accs(flatsPref) ? !flatsPref : flatsPref;
  const tones = buildPattern(e, pc, flats).notes;
  return { q: qi, root: pc, flats, name: tones[0].name + e.sym, roman: '', tones };
}
function chordSearch(text, flatsPref) {
  const raw = String(text || '').trim().replace(/\s+/g, '');
  if (!raw) return [];
  // a slash chord: the chord, then "/" and the bass note
  const sl = /^(.+)\/([A-Ga-g])(#|♯|b|♭)?$/.exec(raw);
  if (sl) {
    const L = sl[2].toUpperCase();
    const bpc = ((([0, 2, 4, 5, 7, 9, 11][LETTERS.indexOf(L)] + (sl[3] === '#' || sl[3] === '♯' ? 1 : sl[3] ? -1 : 0)) % 12) + 12) % 12;
    return chordSearch(sl[1], flatsPref).map((c) => withBass(c, bpc, sl[3] ? (sl[3] === '#' || sl[3] === '♯' ? false : true) : flatsPref));
  }
  const s = raw;
  const out = [];
  const seen = new Set();
  const push = (qi, pc, forced) => {
    const k = qi + ':' + pc;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(pickerChord(qi, pc, flatsPref, forced));
  };
  const qualsFor = (suf) => {
    const exact = [], loose = [], prefix = [];
    ARP_ENTRIES.forEach((e, qi) => {
      const al = QUAL[e.sym].alias;
      if (al.indexOf(suf) >= 0) exact.push(qi);
      else if (al.some((a) => a.toLowerCase() === suf.toLowerCase())) loose.push(qi);
      else if (suf && al.some((a) => a.toLowerCase().indexOf(suf.toLowerCase()) === 0)) prefix.push(qi);
    });
    if (!suf) return exact.concat(ARP_ENTRIES.map((e, i) => i).filter((i) => exact.indexOf(i) < 0));
    return exact.concat(loose, prefix);
  };
  // 1. a root letter, then the chord type
  const m = /^([A-Ga-g])(#|♯|b|♭)?(.*)$/.exec(s);
  if (m) {
    const L = m[1].toUpperCase();
    const acc = m[2] === '#' || m[2] === '♯' ? 1 : m[2] ? -1 : 0;
    const pc = (([0, 2, 4, 5, 7, 9, 11][LETTERS.indexOf(L)] + acc) % 12 + 12) % 12;
    const forced = acc > 0 ? false : acc < 0 ? true : undefined;
    qualsFor(m[3]).forEach((qi) => push(qi, pc, forced));
  }
  // 2. only a chord type ("dim", "maj7"): that type on every root
  if (s.length >= 2 || !m) {
    const q = qualsFor(s).filter((qi) => {
      const al = QUAL[ARP_ENTRIES[qi].sym].alias;
      return al.some((a) => a && a.toLowerCase().indexOf(s.toLowerCase()) === 0);
    });
    if (q.length) for (let pc = 0; pc < 12; pc++) push(q[0], pc);
  }
  return out.slice(0, 20);
}

/* ---------- Reading a recording of a real guitar: hits, muted / soft, up or down, which string ---------- */
function onePoleLow(x, sr, fc) {
  const y = new Float32Array(x.length);
  const a = Math.exp(-2 * Math.PI * fc / sr);
  let p = 0;
  for (let i = 0; i < x.length; i++) { p = (1 - a) * x[i] + a * p; y[i] = p; }
  return y;
}
// Finds each strum or pluck: when it starts, how loud it is, how fast it dies (muted), and whether the low or high strings sounded first
function analyzeHits(x, sr) {
  const hop = Math.max(1, Math.round(sr * 0.005)), win = hop * 2;
  const lo = onePoleLow(x, sr, 250);
  const hiBase = onePoleLow(x, sr, 700);
  const N = Math.max(0, Math.floor((x.length - win) / hop));
  const env = new Float32Array(N), envL = new Float32Array(N), envH = new Float32Array(N), envT = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    let s = 0, sl = 0, sh = 0, stt = 0;
    for (let k = i * hop; k < i * hop + win; k++) { const v = x[k]; s += v * v; sl += lo[k] * lo[k]; const h = k > 1 ? v - 2 * x[k - 1] + x[k - 2] : 0; sh += h * h; const tr = v - hiBase[k]; stt += tr * tr; }
    env[i] = Math.sqrt(s / win); envL[i] = Math.sqrt(sl / win); envH[i] = Math.sqrt(sh / win); envT[i] = Math.sqrt(stt / win);
  }
  let gmax = 0;
  for (let i = 0; i < N; i++) if (env[i] > gmax) gmax = env[i];
  const hits = [];
  if (!gmax) return { hits, env, hop, sr };
  // how much louder the next 30 ms are than the 30 ms before, in the band that jumps most (strums spread over ~60 ms,
  // so a slow window catches them even when the last chord is still ringing)
  const mean = (e, a, b) => { let s = 0, n = 0; for (let k = Math.max(0, a); k < Math.min(N, b); k++) { s += e[k]; n++; } return n ? s / n : 0; };
  const floor = gmax * 0.01;
  const ratio = new Float32Array(N);
  for (let i = 1; i < N; i++) {
    let r = 0;
    [env, envL, envH].forEach((e) => { const before = mean(e, i - 6, i), next = mean(e, i, i + 6); r = Math.max(r, (next + floor) / (before + floor)); });
    ratio[i] = r;
  }
  let last = -1e9;
  for (let i = 1; i < N - 1; i++) {
    if (ratio[i] < 1.4) continue;
    // the strongest jump nearby is the start
    let isMax = true;
    for (let k = Math.max(1, i - 6); k <= Math.min(N - 1, i + 6); k++) if (ratio[k] > ratio[i]) { isMax = false; break; }
    if (!isMax) continue;
    let pk = 0, pi = i;
    for (let k = i; k < Math.min(N, i + 16); k++) if (env[k] > pk) { pk = env[k]; pi = k; }
    if (pk < gmax * 0.03 || i - last < 12) continue;
    last = i;
    const before = mean(env, i - 6, i);
    // start time: where the level first rises a third of the way from what was ringing to this hit's peak
    let st = Math.max(0, i - 2);
    while (st < pi && env[st] < before + (pk - before) * 0.3) st++;
    // muted test: how much of this hit's own energy is left 120 ms after its peak
    const own = Math.max(1e-9, pk - before);
    // averaged over a few frames so the beating of ringing strings does not fool it
    const after = Math.max(0, mean(env, pi + 10, pi + 18) - mean(env, i - 8, i - 1));
    const band = (e) => { let m = 0; for (let k = Math.max(0, i - 2); k < Math.min(N, i + 16); k++) m = Math.max(m, e[k]); const base = mean(e, i - 6, i); for (let k = Math.max(0, i - 2); k < Math.min(N, i + 16); k++) if (e[k] - base >= (m - base) * 0.5) return k; return i; };
    const dl = band(envL), dh = band(envT);
    // how noisy the attack is: a muted chuck is mostly scrape, a soft strum still has pitch
    const bright = (mean(envH, i, i + 6) - mean(envH, i - 8, i - 1)) / Math.max(1e-9, mean(env, i, i + 6) - mean(env, i - 8, i - 1) * 0.5);
    hits.push({ t: (st * hop + win / 2) / sr, peak: own, decay: after / own, bright, dir: dl < dh - 1 ? 'down' : dh < dl - 1 ? 'up' : null });
  }
  return { hits, env, hop, sr };
}
// muted = a noisy scrape that dies away fast; soft (ghost) = clearly quieter than the player's normal hits
function classifyHits(hits) {
  const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const mb = med(hits.map((h) => h.bright || 0));
  const isMute = (h) => (h.bright || 0) >= Math.max(0.9, mb * 2) && h.decay < 0.45;
  const loud = med(hits.filter((h) => !isMute(h)).map((h) => h.peak));
  return hits.map((h) => Object.assign({}, h, { kind: isMute(h) ? 'mute' : loud && h.peak < loud * 0.45 ? 'ghost' : 'hit' }));
}
// the smallest repeating gap between hits = one step of the grid
function estimateStep(hits) {
  const iois = [];
  for (let i = 1; i < hits.length; i++) { const d = hits[i].t - hits[i - 1].t; if (d >= 0.07) iois.push(d); }
  if (!iois.length) return null;
  const cands = [];
  iois.forEach((d) => [1, 2, 3, 4].forEach((k) => { if (d / k >= 0.07) cands.push(d / k); }));
  let best = null;
  cands.sort((a, b) => b - a).forEach((s) => {
    const err = iois.reduce((e, d) => { const k = Math.max(1, Math.round(d / s)); return e + Math.abs(d - k * s) / s; }, 0) / iois.length;
    if (err < 0.12 && (!best || s > best)) best = s;
  });
  return best || Math.min.apply(null, iois);
}
// Turns analysed hits into pattern boxes. dirMode 'beat': down on the beat and on even steps, up between (how most players move); 'sound': from the recording.
function hitsToPattern(hits, o) {
  const grid = o.grid, step = o.step, maxBeats = o.maxBeats || 8;
  if (!hits.length || !step) return null;
  const t0 = hits[0].t;
  const placed = [];
  hits.forEach((h) => {
    const i = Math.round((h.t - t0) / step);
    if (i < 0 || i >= maxBeats * grid) return;
    const prev = placed.find((p) => p.i === i);
    if (prev) { if (h.peak > prev.h.peak) prev.h = h; return; }
    placed.push({ i, h });
  });
  const lastI = placed.reduce((m, p) => Math.max(m, p.i), 0);
  // whole bars: 2, 4 or 8 beats, unless a length was asked for
  const need = Math.ceil((lastI + 1) / grid);
  const beats = o.beats || Math.min(maxBeats, need <= 2 ? 2 : need <= 4 ? 4 : 8);
  const n = beats * grid;
  const steps = new Array(n).fill('.'), picks = new Array(n).fill(0);
  placed.forEach(({ i, h }) => {
    if (i >= n) return;
    if (o.mode === 'pick') { if (h.string !== undefined && h.string !== null && h.kind !== 'mute') picks[i] |= 1 << h.string; return; }
    const down = o.dirMode === 'sound' && h.dir ? h.dir === 'down' : i % 2 === 0;
    steps[i] = h.kind === 'mute' ? 'x' : h.kind === 'ghost' ? (down ? 'd' : 'u') : down ? 'D' : 'U';
  });
  return { beats, steps: steps.join(''), picks };
}
/* ---------- Groove: a free take (any tempo, any length, with pauses) -> tempo, grid and a looping pattern ----------
   Hits: { t (s), peak?, kind? ('hit' | 'ghost' | 'mute'), dir? ('down' | 'up'), ch? (a pattern letter), mask? / string? (picking) }
   o: { mode 'strum'|'pick', dirMode 'beat'|'sound', bpm + t0 (when played to a click), grid (2|3|4 to force), tempoX (0.5 | 2) } */
const GROOVE_MAX_BEATS = 16;
function grooveTrack(hits, unit, t0, firm) {
  // follows the player like a drummer would: each hit nudges where the next grid line is expected and how long a step is
  const a = firm ? 0.25 : 0.5, b = firm ? 0.03 : 0.12, lim = firm ? 0.05 : 0.15;
  let u = unit, at = t0, ai = 0, errSum = 0;
  const idx = [];
  hits.forEach((h, k) => {
    let i = ai + Math.round((h.t - at) / u);
    if (k && i <= idx[k - 1]) i = idx[k - 1];        // squeezed into the previous step (merged later)
    const pred = at + (i - ai) * u;
    const err = h.t - pred;
    errSum += Math.min(0.5, Math.abs(err) / u);
    const gap = Math.max(1, i - ai);
    at = pred + a * err; ai = i;
    u = Math.max(unit * (1 - lim), Math.min(unit * (1 + lim), u + (b * err) / gap));
    idx.push(i);
  });
  return { idx, err: errSum / hits.length, unit: u };
}
function grooveFromHits(raw, o) {
  o = o || {};
  const pick = o.mode === 'pick';
  const sorted = (raw || []).filter((h) => h && Number.isFinite(h.t)).slice().sort((x, y) => x.t - y.t);
  const hits = [];
  sorted.forEach((h0) => {
    const h = Object.assign({}, h0);
    if (!h.mask && Number.isInteger(h.string) && h.string >= 0) h.mask = 1 << h.string;
    const p = hits[hits.length - 1];
    if (p && h.t - p.t < 0.045) {                    // one strum crossing six strings is one hit
      const m = (p.mask || 0) | (h.mask || 0), t = p.t;
      if ((h.peak || 0) > (p.peak || 0)) Object.assign(p, h);
      p.t = t; p.mask = m;
      return;
    }
    hits.push(h);
  });
  if (hits.length < 2) return null;
  const med = (arr) => { const s = arr.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
  const mp = med(hits.map((h) => h.peak || 1)) || 1;
  const acc = hits.map((h) => Math.max(0.3, Math.min(2, (h.peak || 1) / mp)) * (h.kind === 'mute' ? 0.5 : h.kind === 'ghost' ? 0.6 : 1) * (h.dir === 'down' ? 1.2 : h.dir === 'up' ? 0.8 : 1));
  const accSum = acc.reduce((s, v) => s + v, 0);
  const clicked = Number.isFinite(o.bpm) && o.bpm > 0 && Number.isFinite(o.t0);
  // every reading of the take worth considering: step length, steps per beat (g), which step is the beat (p)
  const cands = [];
  const consider = (tr, g, p, extra) => {
    const bpm = 60 / (g * tr.unit);
    if (bpm < 40 || bpm > 230) return;
    let on = 0, dirN = 0, dirOk = 0;
    tr.idx.forEach((i, k) => {
      const r = (((i - p) % g) + g) % g;
      if (r === 0) on += acc[k];
      if (hits[k].dir) { dirN++; const shouldDown = g === 3 ? r !== 1 : r % 2 === 0; if ((hits[k].dir === 'down') === shouldDown) dirOk++; }
    });
    const prior = Math.exp(-Math.pow(Math.log2(bpm / 100), 2) / (2 * 0.55 * 0.55));
    const first = (((tr.idx[0] - p) % g) + g) % g === 0 ? 0.12 : 0;
    const score = on / accSum + (dirN ? 0.6 * (dirOk / dirN) : 0.3) + 0.5 * prior - 2 * tr.err - (g === 4 ? 0.03 : g === 3 ? 0.08 : 0) - (extra || 0) + first;
    cands.push({ tr, g, p, bpm, score });
  };
  if (clicked) {
    const beat = 60 / o.bpm;
    // a pickup before the first click is fine: the grid simply starts earlier
    [2, 3, 4].forEach((g) => { const tr = grooveTrack(hits, beat / g, o.t0, true); const lo = Math.min(0, tr.idx[0]); if (lo < 0) tr.idx = tr.idx.map((i) => i - Math.floor(lo / g) * g); consider(tr, g, 0, 0); });
    cands.forEach((c) => { c.score = -4 * c.tr.err - (c.g === 4 ? 0.03 : c.g === 3 ? 0.06 : 0); });
  } else {
    const u0 = estimateStep(hits);
    if (!u0) return null;
    // the smallest gap played might be one step, or two or four (slow chops, a pause-heavy groove)
    [1, 2, 4].forEach((d) => {
      const tr = grooveTrack(hits, u0 / d, hits[0].t, false);
      [2, 3, 4].forEach((g) => { for (let p = 0; p < g; p++) consider(tr, g, p, d === 1 ? 0 : d === 2 ? 0.08 : 0.16); });
    });
  }
  if (!cands.length) return null;
  let pool = o.grid ? cands.filter((c) => c.g === o.grid) : cands;
  if (!pool.length) pool = cands;
  pool.sort((x, y) => y.score - x.score);
  let best = pool[0];
  if (o.tempoX && o.tempoX !== 1) {
    const want = best.bpm * o.tempoX;
    const near = pool.filter((c) => Math.abs(Math.log2(c.bpm / want)) < 0.2);
    if (near.length) best = near[0];
  }
  const { tr, p } = best;
  let g = best.g;
  // which beat is "1": usually the first one you played; a strongly accented other beat can win
  const beatOf = (i) => Math.floor((i - p) / g);
  const bFirst = beatOf(tr.idx[0]);
  let q = ((bFirst % 4) + 4) % 4;
  if (!clicked) {
    const sc = [0, 0, 0, 0];
    tr.idx.forEach((i, k) => { if ((((i - p) % g) + g) % g === 0) sc[((beatOf(i) % 4) + 4) % 4] += acc[k]; });
    sc[q] += 0.35 * sc.reduce((s, v) => s + v, 0) / 4 + 0.5;
    q = sc.indexOf(Math.max.apply(null, sc));
  } else q = 0;
  let barBeat = bFirst - ((((bFirst - q) % 4) + 4) % 4);
  const start = p + barBeat * g;
  // symbols on a grid starting at bar 1
  const cells = new Map();
  tr.idx.forEach((i, k) => {
    const pos = i - start;
    const h = hits[k];
    const prev = cells.get(pos);
    if (prev && (prev.h.peak || 0) >= (h.peak || 0)) { if (pick) prev.mask |= h.mask || 0; return; }
    cells.set(pos, { h, mask: (h.mask || 0) | (prev ? prev.mask : 0) });
  });
  const symOf = (pos, c) => {
    if (pick) return c.h.kind === 'mute' ? 0 : c.mask;
    const h = c.h;
    if (h.ch) return h.ch;
    const r = pos % g;
    const down = o.dirMode === 'sound' && h.dir ? h.dir === 'down' : h.dir ? h.dir === 'down' : (g === 3 ? r !== 1 : r % 2 === 0);
    return h.kind === 'mute' ? 'x' : h.kind === 'ghost' ? (down ? 'd' : 'u') : down ? 'D' : 'U';
  };
  let maxPos = 0;
  cells.forEach((c, pos) => { if (pos > maxPos) maxPos = pos; });
  const fullBeats = Math.max(4, Math.ceil((maxPos + 1) / g / 4) * 4);
  const rest = pick ? 0 : '.';
  const seqOf = (beats) => { const a = new Array(beats * g).fill(rest); cells.forEach((c, pos) => { if (pos >= 0 && pos < a.length) a[pos] = symOf(pos, c); }); return a; };
  // the shortest stretch that keeps repeating is the pattern (majority vote per step later)
  const loopOf = (seq) => {
    const n = seq.length, found = [];
    for (const lb of [4, 8, 16]) {
      const len = lb * g;
      if (len * 2 > n) break;
      let tot = 0, ok = 0;
      for (let j = 0; j < len; j++) {
        const vals = [];
        for (let s = j; s < n; s += len) vals.push(seq[s]);
        if (vals.every((v) => v === rest)) continue;
        const cnt = new Map();
        vals.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
        tot++; ok += Math.max.apply(null, Array.from(cnt.values())) / vals.length;
      }
      if (tot) found.push({ L: lb, agree: ok / tot });
    }
    const tight = found.find((f) => f.agree >= 0.9);
    if (tight) return tight;
    const ok = found.filter((f) => f.agree >= 0.72).sort((x, y) => y.agree - x.agree)[0];
    return ok || { L: 0, agree: 0 };
  };
  let totalBeats = fullBeats, seq = seqOf(fullBeats), lp = loopOf(seq);
  // a lone strum on the "1" after the last bar is usually the ending, not part of the groove: drop it when that fits better
  if (fullBeats > 4) {
    let inLast = 0, lastOnOne = false;
    cells.forEach((c, pos) => { if (pos >= (fullBeats - 4) * g) { inLast++; if (pos === (fullBeats - 4) * g && c.h.kind !== 'mute') lastOnOne = true; } });
    if (inLast === 1 && lastOnOne) {
      const s2 = seqOf(fullBeats - 4), l2 = loopOf(s2);
      if (l2.agree >= lp.agree || (!lp.L && fullBeats - 4 <= GROOVE_MAX_BEATS)) { totalBeats = fullBeats - 4; seq = s2; lp = l2; }
    }
  }
  const n = seq.length;
  let L = lp.L;
  const agree = lp.agree;
  const truncated = !L && totalBeats > GROOVE_MAX_BEATS;
  if (!L) L = Math.min(totalBeats, GROOVE_MAX_BEATS);
  const len = L * g;
  let pat = [];
  for (let j = 0; j < len; j++) {
    const vals = [];
    for (let s = j; s < n; s += len) vals.push(seq[s]);
    const cnt = new Map();
    vals.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
    let top = vals[0], topN = 0;
    cnt.forEach((c, v) => { if (c > topN || (c === topN && v !== rest && top === rest)) { top = v; topN = c; } });
    pat.push(top);
  }
  let unit = tr.unit, swing = false;
  // simplest way to write it: 16ths with nothing on the in-between steps are 8ths; triplets that skip the middle are swing
  if (!o.grid && g === 4 && pat.every((v, j) => j % 2 === 0 || v === rest)) { pat = pat.filter((v, j) => j % 2 === 0); g = 2; unit *= 2; }
  if (!o.grid && g === 3 && pat.every((v, j) => j % 3 !== 1 || v === rest) && pat.some((v, j) => j % 3 === 2 && v !== rest)) {
    pat = pat.filter((v, j) => j % 3 !== 1); g = 2; swing = true; unit *= 1.5;
  }
  // the tempo you held on average across the take (the tracker's last step length only says where you ended up)
  const span = tr.idx[tr.idx.length - 1] - tr.idx[0];
  const avgUnit = span > 0 ? (hits[hits.length - 1].t - hits[0].t) / span : tr.unit;
  const bpm = Math.round(60 / (best.g * (clicked ? tr.unit : avgUnit)));
  const beatT = best.g * tr.unit;
  const restBeats = [];
  for (let b = 0; b < L; b++) if (pat.slice(b * g, (b + 1) * g).every((v) => v === rest)) restBeats.push(b + 1);
  const out = {
    bpm, grid: g, swing, beats: L, reps: Math.max(1, Math.round(totalBeats / L)), totalBeats, truncated, agree,
    steps: pick ? pat.map((m) => (m ? 'S' : '.')).join('') : pat.join(''),
    picks: pick ? pat.slice() : null,
    restBeats,
    // where the grid sits in the take, for drawing it
    startT: hits[0].t - (tr.idx[0] - start) * tr.unit, beatT, hitsN: hits.length,
  };
  return out;
}
// pitch of a single picked note (autocorrelation), in Hz, or 0
function detectPitch(x, sr, start, len) {
  const a = Math.max(0, Math.floor(start * sr)), n = Math.min(x.length - a, Math.floor(len * sr));
  if (n < 256) return 0;
  const minLag = Math.floor(sr / 1100), maxLag = Math.min(Math.floor(sr / 70), n - 1);
  let e0 = 0;
  for (let i = 0; i < n; i++) e0 += x[a + i] * x[a + i];
  if (!e0) return 0;
  const d = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = 0; i + lag < n; i++) { const v = x[a + i] - x[a + i + lag]; s += v * v; }
    d[lag] = s;
  }
  // cumulative mean normalised difference (YIN)
  let run = 0, best = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    run += d[lag];
    const cm = lag < minLag || !run ? 1 : (d[lag] * lag) / run;
    if (lag >= minLag && cm < 0.15) { best = lag; while (best + 1 <= maxLag && d[best + 1] < d[best]) best++; break; }
  }
  if (!best) { let m = Infinity; for (let lag = minLag; lag <= maxLag; lag++) if (d[lag] < m) { m = d[lag]; best = lag; } }
  return best ? sr / best : 0;
}
// Which string a picked note came from: of the strings the chord shape plays, the one whose note got
// suddenly louder at the hit (works even while earlier notes are still ringing)
function goertzel(x, sr, start, len, f) {
  const a = Math.max(0, Math.floor(start * sr)), n = Math.min(x.length - a, Math.floor(len * sr));
  if (n < 32) return 0;
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < n; i++) { const hw = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)); const s0 = x[a + i] * hw + c * s1 - s2; s2 = s1; s1 = s0; }
  return (s1 * s1 + s2 * s2 - c * s1 * s2) / (n * n);
}
function stringForHit(x, sr, t, slot) {
  if (!slot.frets) return null;
  let best = null, bg = 0;
  slot.frets.forEach((fr, s) => {
    if (fr < 0) return;
    const f = 440 * Math.pow(2, (OPEN[s] + fr - 69) / 12);
    const pw = (st) => goertzel(x, sr, st, 0.06, f) + 0.5 * goertzel(x, sr, st, 0.06, 2 * f);
    const g = pw(t + 0.015) - pw(t - 0.075);
    if (g > bg) { bg = g; best = s; }
  });
  return best;
}
// which string of the chord shape played that pitch
function stringForPitch(slot, hz) {
  if (!hz || !slot.frets) return null;
  const m = 69 + 12 * Math.log2(hz / 440);
  let best = null, bd = 99;
  slot.frets.forEach((f, s) => { if (f < 0) return; const d = Math.abs(OPEN[s] + f - m); if (d < bd) { bd = d; best = s; } });
  if (bd <= 1.5) return best;
  // octave slip in the pitch reading: match the note name instead
  const pc = ((Math.round(m) % 12) + 12) % 12;
  best = null; bd = 99;
  slot.frets.forEach((f, s) => { if (f < 0) return; const mm = OPEN[s] + f; if (mm % 12 === pc && Math.abs(mm - m) < bd) { bd = Math.abs(mm - m); best = s; } });
  return best;
}

/* ---------- Common chord progressions, built in any key ----------
   Each step: [roman as triads, roman as 7th chords, root as an interval above the tonic, triad symbol, 7th symbol] */
const CHORD_FORMULA = { '': '1 3 5', m: '1 b3 5', '°': '1 b3 b5', '+': '1 3 #5', '7': '1 3 5 b7', maj7: '1 3 5 7', m7: '1 b3 5 b7', 'm7♭5': '1 b3 b5 b7', '°7': '1 b3 b5 bb7', sus4: '1 4 5' };
const COMMON_PROGS = [
  { id: '251', genres: ['Jazz', 'Bossa nova', 'K-pop'], mode: 'major', name: '2–5–1', alt: 'ii – V – I', tag: 'Jazz', hint: 'The most important move in jazz: the ii chord leads to V, and V pulls home to I. Learn it in every key.',
    steps: [['ii', 'ii7', '2', 'm', 'm7'], ['V', 'V7', '5', '', '7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: 'axis', genres: ['Pop', 'K-pop', 'C-pop', 'Rock'], mode: 'major', name: 'Pop anthem', alt: 'I – V – vi – IV', tag: 'Pop', hint: 'Heard in hundreds of hit songs. Bright, then a little sad on vi, then hopeful on IV.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['vi', 'vi7', '6', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7']] },
  { id: '50s', genres: ['Pop', 'C-pop', 'Oldies'], mode: 'major', name: "'50s doo-wop", alt: 'I – vi – IV – V', tag: 'Pop', hint: 'The classic ballad loop of the 1950s and 60s.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['vi', 'vi7', '6', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7']] },
  { id: 'sad', genres: ['Pop', 'K-pop', 'J-pop'], mode: 'major', name: 'Emotional pop', alt: 'vi – IV – I – V', tag: 'Pop', hint: 'The pop anthem started on vi, so it sounds more minor and moody.',
    steps: [['vi', 'vi7', '6', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['I', 'Imaj7', '1', '', 'maj7'], ['V', 'V7', '5', '', '7']] },
  { id: '145', genres: ['Rock', 'Folk', 'Country'], mode: 'major', name: 'Three-chord rock', alt: 'I – IV – V – I', tag: 'Rock / folk', hint: 'The three main chords of a key. Countless folk, country and rock songs use only these.',
    steps: [['I', 'I7', '1', '', '7'], ['IV', 'IV7', '4', '', '7'], ['V', 'V7', '5', '', '7'], ['I', 'I7', '1', '', '7']] },
  { id: 'blues', genres: ['Blues', 'Rock'], mode: 'major', name: '12-bar blues', alt: 'I I I I · IV IV I I · V IV I V', tag: 'Blues', hint: 'Twelve bars, one chord per bar. The foundation of blues and rock and roll. Sounds best with 7th chords.',
    steps: [['I', 'I7', '1', '', '7'], ['I', 'I7', '1', '', '7'], ['I', 'I7', '1', '', '7'], ['I', 'I7', '1', '', '7'], ['IV', 'IV7', '4', '', '7'], ['IV', 'IV7', '4', '', '7'],
      ['I', 'I7', '1', '', '7'], ['I', 'I7', '1', '', '7'], ['V', 'V7', '5', '', '7'], ['IV', 'IV7', '4', '', '7'], ['I', 'I7', '1', '', '7'], ['V', 'V7', '5', '', '7']] },
  { id: 'turn', genres: ['Jazz', 'City pop'], mode: 'major', name: 'Jazz turnaround', alt: 'I – vi – ii – V', tag: 'Jazz', hint: 'Loops back to the start of a tune. Ends on V so it wants to begin again.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['vi', 'vi7', '6', 'm', 'm7'], ['ii', 'ii7', '2', 'm', 'm7'], ['V', 'V7', '5', '', '7']] },
  { id: 'circle', genres: ['Jazz', 'Classical', 'J-pop'], mode: 'major', name: 'Circle progression', alt: 'iii – vi – ii – V – I', tag: 'Jazz / classical', hint: 'Each chord falls a fifth to the next, all the way home. Follow it on the circle of fifths.',
    steps: [['iii', 'iii7', '3', 'm', 'm7'], ['vi', 'vi7', '6', 'm', 'm7'], ['ii', 'ii7', '2', 'm', 'm7'], ['V', 'V7', '5', '', '7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: 'canon', genres: ['Classical', 'C-pop', 'J-pop', 'Pop'], mode: 'major', name: 'Pachelbel’s Canon', alt: 'I – V – vi – iii – IV – I – IV – V', tag: 'Classical / pop', hint: 'The famous wedding piece. Its bass line steps down and many pop songs borrow it.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['vi', 'vi7', '6', 'm', 'm7'], ['iii', 'iii7', '3', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['I', 'Imaj7', '1', '', 'maj7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7']] },
  { id: 'm251', genres: ['Jazz', 'Bossa nova'], mode: 'minor', name: 'Minor 2–5–1', alt: 'iiø – V – i', tag: 'Jazz', hint: 'The 2–5–1 in a minor key: a half-diminished ii, a dominant V, home to minor i.',
    steps: [['ii°', 'iiø7', '2', '°', 'm7♭5'], ['V', 'V7', '5', '', '7'], ['i', 'i7', '1', 'm', 'm7']] },
  { id: 'andalusian', genres: ['Flamenco', 'Rock', 'Film'], mode: 'minor', name: 'Andalusian cadence', alt: 'i – ♭VII – ♭VI – V', tag: 'Flamenco / rock', hint: 'Steps down to a dramatic major V. Spanish and flamenco flavour.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['V', 'V7', '5', '', '7']] },
  { id: 'epic', genres: ['Rock', 'Film', 'K-pop'], mode: 'minor', name: 'Epic minor', alt: 'i – ♭VI – ♭III – ♭VII', tag: 'Rock / film', hint: 'A powerful minor loop used in rock ballads and film music.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['♭III', '♭IIImaj7', 'b3', '', 'maj7'], ['♭VII', '♭VII7', 'b7', '', '7']] },
  { id: 'minor145', genres: ['Blues', 'Classical'], mode: 'minor', name: 'Minor blues shape', alt: 'i – iv – V – i', tag: 'Blues / classical', hint: 'The three main chords of a minor key, with a major V for a strong pull home.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['iv', 'iv7', '4', 'm', 'm7'], ['V', 'V7', '5', '', '7'], ['i', 'i7', '1', 'm', 'm7']] },
  { id: 'minorpop', genres: ['Pop', 'Rock'], mode: 'minor', name: 'Minor pop loop', alt: 'i – ♭VII – ♭VI – ♭VII', tag: 'Pop / rock', hint: 'Rocks back and forth between the top three chords of the natural minor.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['♭VII', '♭VII7', 'b7', '', '7']] },
  // J-pop, anime, city pop
  { id: 'royal', genres: ['J-pop', 'Anime', 'C-pop'], mode: 'major', name: 'Royal road (王道進行)', alt: 'IV – V – iii – vi', tag: 'J-pop / anime', hint: 'The signature J-pop chorus: it lifts from IV to V, then lands on the minor chords instead of going home, so it feels bittersweet and keeps moving. Very common in anime themes.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['iii', 'iii7', '3', 'm', 'm7'], ['vi', 'vi7', '6', 'm', 'm7']] },
  { id: 'royalhome', genres: ['J-pop', 'Anime'], mode: 'major', name: 'Royal road, going home', alt: 'IV – V – iii – vi – ii – V – I', tag: 'J-pop / anime', hint: 'The royal road continued down the circle of fifths (vi – ii – V – I) until it resolves. A big, satisfying chorus ending.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['iii', 'iii7', '3', 'm', 'm7'], ['vi', 'vi7', '6', 'm', 'm7'], ['ii', 'ii7', '2', 'm', 'm7'], ['V', 'V7', '5', '', '7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: 'royalsec', genres: ['J-pop', 'K-pop', 'Anime'], mode: 'major', name: 'Royal road with a push', alt: 'IV – V – III – vi', tag: 'J-pop / K-pop', hint: 'The royal road with iii turned major (III, the V of vi). That borrowed chord pulls hard into vi: a dramatic pre-chorus or chorus lift.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['III', 'III7', '3', '', '7'], ['vi', 'vi7', '6', 'm', 'm7']] },
  { id: 'komuro', genres: ['J-pop', 'C-pop', 'Anime'], mode: 'major', name: 'Komuro progression (小室進行)', alt: 'vi – IV – V – I', tag: 'J-pop / C-pop', hint: 'Named after producer Tetsuya Komuro. Starts on the minor vi and climbs back home to I, so every repeat feels like a payoff. In Chinese pop it is the "6451" universal progression.',
    steps: [['vi', 'vi7', '6', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: '6453', genres: ['J-pop', 'Anime'], mode: 'major', name: '6–4–5–3', alt: 'vi – IV – V – iii', tag: 'J-pop', hint: 'The Komuro progression ending on iii instead of home. It stays unresolved, so it suits verses and bittersweet moments; many songs use 6–4–5–3 in the verse and 6–4–5–1 in the chorus.',
    steps: [['vi', 'vi7', '6', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['iii', 'iii7', '3', 'm', 'm7']] },
  { id: 'marusa', genres: ['J-pop', 'City pop', 'R&B / soul'], mode: 'major', name: 'Just the Two of Us (丸サ進行)', alt: 'IVmaj7 – III7 – vi7 – v7 I7', tag: 'City pop / J-pop', hint: 'The jazzy loop from the 1981 soul hit, now everywhere in J-pop. The major III7 pulls into vi, then a minor v and I7 lead back to IV. Floating, stylish and a little melancholy. Best with 7th chords.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['III', 'III7', '3', '', '7'], ['vi', 'vi7', '6', 'm', 'm7'], ['v', 'v7', '5', 'm', 'm7'], ['I', 'I7', '1', '', '7']] },
  // C-pop (Mandopop / Cantopop)
  { id: '4536251', genres: ['C-pop', 'J-pop', 'Ballad'], mode: 'major', name: '4536251', alt: 'IV – III – vi – ii – V – I', tag: 'C-pop', hint: 'A favourite of Chinese-language ballads, named by its scale numbers. It falls down the circle of fifths from III to I, so it sounds rich and keeps pulling forward until it lands home.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['III', 'III7', '3', '', '7'], ['vi', 'vi7', '6', 'm', 'm7'], ['ii', 'ii7', '2', 'm', 'm7'], ['V', 'V7', '5', '', '7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: '4321', genres: ['C-pop', 'R&B / soul', 'Neo-soul'], mode: 'major', name: 'Stepping down 4–3–2–1', alt: 'IV – iii – ii – I', tag: 'C-pop / R&B', hint: 'Each chord is one step lower than the last, a smooth slide home. With 7th chords (IVmaj7 – iii7 – ii7 – Imaj7) it is a classic R&B and neo-soul sound.',
    steps: [['IV', 'IVmaj7', '4', '', 'maj7'], ['iii', 'iii7', '3', 'm', 'm7'], ['ii', 'ii7', '2', 'm', 'm7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: '1564', genres: ['C-pop', 'Pop'], mode: 'major', name: 'Canon, first half', alt: 'I – V – vi – iii – IV', tag: 'C-pop / pop', hint: 'The opening of the Canon progression, used on its own in many Mandopop and Cantopop ballads before it turns to IV – I – IV – V or IV – V – I.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['V', 'V7', '5', '', '7'], ['vi', 'vi7', '6', 'm', 'm7'], ['iii', 'iii7', '3', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7']] },
  // K-pop, R&B, gospel, rock
  { id: 'kpoplift', genres: ['K-pop', 'Pop'], mode: 'major', name: 'Pre-chorus lift', alt: 'ii – iii – IV – V', tag: 'K-pop', hint: 'Climbs step by step to the V chord, building tension right before the chorus drops.',
    steps: [['ii', 'ii7', '2', 'm', 'm7'], ['iii', 'iii7', '3', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['V', 'V7', '5', '', '7']] },
  { id: 'gospel', genres: ['Gospel', 'R&B / soul', 'Pop'], mode: 'major', name: 'Minor plagal (gospel)', alt: 'I – IV – iv – I', tag: 'Gospel / soul', hint: 'IV turns minor (iv, borrowed from the minor key) before going home. A warm, tearful "amen" sound used in gospel, soul and big ballads.',
    steps: [['I', 'Imaj7', '1', '', 'maj7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['iv', 'iv7', '4', 'm', 'm7'], ['I', 'Imaj7', '1', '', 'maj7']] },
  { id: 'mixo', genres: ['Rock', 'Folk'], mode: 'major', name: 'Mixolydian rock', alt: 'I – ♭VII – IV – I', tag: 'Rock', hint: 'The borrowed ♭VII chord gives a laid-back classic-rock and anthem sound, instead of the usual V.',
    steps: [['I', 'I7', '1', '', '7'], ['♭VII', '♭VIImaj7', 'b7', '', 'maj7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['I', 'I7', '1', '', '7']] },
  { id: 'neosoul', genres: ['Neo-soul', 'R&B / soul', 'Jazz'], mode: 'major', name: 'Neo-soul loop', alt: 'ii7 – iii7 – IVmaj7 – iii7', tag: 'Neo-soul', hint: 'Rocks gently around ii, iii and IV without ever landing on I, so it floats. Play it with 7th chords for the smooth neo-soul colour.',
    steps: [['ii', 'ii7', '2', 'm', 'm7'], ['iii', 'iii7', '3', 'm', 'm7'], ['IV', 'IVmaj7', '4', '', 'maj7'], ['iii', 'iii7', '3', 'm', 'm7']] },
  // minor keys
  { id: 'mroyal', genres: ['J-pop', 'Anime'], mode: 'minor', name: 'Royal road in minor', alt: '♭VI – ♭VII – v – i', tag: 'J-pop / anime', hint: 'The royal road shape in a minor key: up from ♭VI to ♭VII, then down to the minor home. Dramatic and emotional, common in anime openings.',
    steps: [['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['v', 'v7', '5', 'm', 'm7'], ['i', 'i7', '1', 'm', 'm7']] },
  { id: 'mroyalV', genres: ['J-pop', 'Anime', 'C-pop'], mode: 'minor', name: 'Minor climb to V', alt: '♭VI – ♭VII – V – i', tag: 'J-pop / C-pop', hint: 'Like the minor royal road, but with a major V for a much stronger pull home. A favourite for powerful minor-key choruses.',
    steps: [['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['V', 'V7', '5', '', '7'], ['i', 'i7', '1', 'm', 'm7']] },
  { id: 'mcircle', genres: ['K-pop', 'Pop', 'Jazz'], mode: 'minor', name: 'Minor circle', alt: 'i – iv – ♭VII – ♭III', tag: 'K-pop / pop', hint: 'Falls by fifths through the minor key (i, iv, ♭VII, ♭III), ending on the bright relative major. Moody but hopeful.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['iv', 'iv7', '4', 'm', 'm7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['♭III', '♭IIImaj7', 'b3', '', 'maj7']] },
  { id: 'aeolian', genres: ['K-pop', 'Rock', 'Film'], mode: 'minor', name: 'Aeolian cadence', alt: 'i – ♭VI – ♭VII – i', tag: 'Rock / K-pop', hint: 'Climbs ♭VI – ♭VII back to the minor home: a powerful, heroic minor ending used in rock, film and dark pop.',
    steps: [['i', 'i7', '1', 'm', 'm7'], ['♭VI', '♭VImaj7', 'b6', '', 'maj7'], ['♭VII', '♭VII7', 'b7', '', '7'], ['i', 'i7', '1', 'm', 'm7']] },
];
function progChords(def, tonicName, seventh) {
  return def.steps.map((s) => {
    const sym = seventh ? s[4] : s[3];
    const root = spell(tonicName, s[2]);
    return { roman: seventh ? s[1] : s[0], name: root.name + sym, tones: CHORD_FORMULA[sym].split(' ').map((l) => spell(root.name, l)) };
  });
}

/* ---------- Modelled guitar strings (Karplus–Strong with a tuned loop) ----------
   A burst of noise shaped like a pick or a finger goes round a delay line as long as one cycle of the note;
   a gentle low-pass on each trip makes the high harmonics die first, the way a real string does. */
const GUITARS = {
  steel:   { name: 'Acoustic (steel)', bright: 0.85, pick: 0.13, damp: 0.16, t60: 8, tilt: 0.45, len: 2.8, gain: 1.0 },
  nylon:   { name: 'Classical (nylon)', bright: 0.32, pick: 0.22, damp: 0.4, t60: 5.5, tilt: 0.45, len: 2.6, gain: 1.25 },
  clean:   { name: 'Electric clean', bright: 0.6, pick: 0.17, damp: 0.24, t60: 10, tilt: 0.35, len: 3.0, gain: 1.0 },
  jazz:    { name: 'Electric jazz', bright: 0.35, pick: 0.25, damp: 0.42, t60: 8, tilt: 0.5, len: 3.0, gain: 1.15 },
  crunch:  { name: 'Electric crunch', bright: 0.7, pick: 0.15, damp: 0.22, t60: 9, tilt: 0.35, len: 3.0, gain: 0.8 },
};
function ksRender(sr, freq, g, seed) {
  const len = Math.floor(sr * g.len);
  const out = new Float32Array(len);
  const N = sr / freq;
  const damp = g.damp;
  const L = Math.max(2, Math.floor(N - damp - 0.1));
  const frac = N - damp - L;                       // the rest of the cycle, made up by an all-pass filter
  const C = (1 - frac) / (1 + frac);
  // how much is lost per trip so the note fades in t60 seconds (high notes a little faster)
  const t60 = g.t60 * Math.pow(110 / freq, g.tilt);
  const rho = Math.pow(10, -3 / (t60 * freq));
  // excitation: one cycle of shaped noise, with a notch from the pluck position
  let s = seed || 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const ex = new Float32Array(L + 1);
  let lp = 0;
  for (let i = 0; i <= L; i++) { lp += g.bright * (rnd() - lp); ex[i] = lp; }
  const P = Math.max(1, Math.round(L * g.pick));
  const ex2 = new Float32Array(L + 1);
  let mean = 0;
  for (let i = 0; i <= L; i++) { ex2[i] = ex[i] - (i >= P ? ex[i - P] : 0); mean += ex2[i]; }
  mean /= L + 1;
  const M = L + 4;
  const hist = new Float32Array(M);
  let w = 0, apX = 0, apY = 0, peak = 0;
  for (let n = 0; n < len; n++) {
    const d1 = hist[(w - L + M) % M], d2 = hist[(w - L - 1 + M) % M];
    const lo = rho * ((1 - damp) * d1 + damp * d2);
    const ap = C * lo + apX - C * apY;
    apX = lo; apY = ap;
    const y = (n <= L ? ex2[n] - mean : 0) + ap;
    hist[w] = y;
    w = (w + 1) % M;
    out[n] = y;
    const a = Math.abs(y);
    if (a > peak) peak = a;
  }
  if (peak > 0) for (let n = 0; n < len; n++) out[n] /= peak;
  // a soft start so there is no click
  for (let n = 0; n < Math.min(len, 32); n++) out[n] *= n / 32;
  return out;
}

/* ---------- What usually comes next: common chord moves, by job in the key ----------
   strong = the move the ear expects; common = used all the time; colour = a surprise or a borrowed flavour */
function romanBase(r) {
  return String(r).replace('maj7', '').replace('ø7', '°').replace('°7', '°').replace(/7/g, '');
}
const NEXT = {
  major: {
    'I': [['IV', 'strong', 'Steps away from home. Bright and open.'], ['V', 'strong', 'Builds tension that wants to come back.'], ['vi', 'common', 'The sad cousin of I.'], ['ii', 'common', 'Starts a 2–5–1.'], ['iii', 'colour', 'A soft, dreamy step.'], ['V/vi', 'colour', 'Pulls hard toward vi.'], ['♭VII', 'colour', 'Borrowed rock flavour.']],
    'ii': [['V', 'strong', 'The 2–5: the most common move in jazz.'], ['vii°', 'common', 'Another way to lead home.'], ['IV', 'colour', 'Steps down gently.'], ['V/V', 'colour', 'Extra push toward V.']],
    'iii': [['vi', 'strong', 'Falls a fifth, round the circle.'], ['IV', 'common', 'Steps up to IV.'], ['ii', 'colour', 'Slides toward a 2–5.']],
    'IV': [['V', 'strong', 'Lifts to V, ready to go home.'], ['I', 'common', 'The "amen" ending.'], ['ii', 'common', 'A gentle step down.'], ['iv', 'colour', 'Borrowed minor iv: bittersweet.'], ['vi', 'colour', 'Turns the mood darker.']],
    'V': [['I', 'strong', 'Home! The strongest ending there is.'], ['vi', 'common', 'A surprise ending (deceptive cadence).'], ['IV', 'colour', 'A rock and blues move.']],
    'vi': [['ii', 'strong', 'Falls a fifth toward V.'], ['IV', 'common', 'Pop’s favourite move.'], ['V', 'common', 'Climbs back toward home.'], ['iii', 'colour', 'A wistful step down.']],
    'vii°': [['I', 'strong', 'Resolves up to home.'], ['iii', 'colour', 'A softer landing.']],
    'V/ii': [['ii', 'strong', 'Resolves to the chord it points at.']], 'V/iii': [['iii', 'strong', 'Resolves to the chord it points at.']],
    'V/IV': [['IV', 'strong', 'Resolves to the chord it points at.']], 'V/V': [['V', 'strong', 'Resolves to the chord it points at.']],
    'V/vi': [['vi', 'strong', 'Resolves to the chord it points at.']],
    'iv': [['I', 'strong', 'A bittersweet return home.'], ['V', 'common', 'Heads for V.']],
    '♭III': [['♭VI', 'common', 'Falls a fifth.'], ['IV', 'common', 'Steps back into the key.']],
    '♭VI': [['♭VII', 'strong', 'An epic climb...'], ['V', 'common', 'Drops a half step to V.']],
    '♭VII': [['I', 'strong', 'Rock-style return home.'], ['IV', 'common', 'Steps down to IV.']],
    '♭II': [['I', 'strong', 'Slides down a half step to home (tritone substitute).'], ['V', 'common', 'The Neapolitan leading to V.']],
  },
  minor: {
    'i': [['iv', 'strong', 'Steps away from home.'], ['V', 'strong', 'Tension that wants to come back.'], ['♭VI', 'common', 'Warm and dramatic.'], ['♭VII', 'common', 'Rock and folk favourite.'], ['ii°', 'common', 'Starts a minor 2–5–1.'], ['♭III', 'colour', 'Opens up to the relative major.']],
    'ii°': [['V', 'strong', 'The minor 2–5.']],
    '♭III': [['♭VI', 'strong', 'Falls a fifth.'], ['iv', 'common', 'Heads back to minor.'], ['♭VII', 'common', 'Climbs a step.']],
    'iv': [['V', 'strong', 'Lifts to V, ready to go home.'], ['i', 'common', 'A soft return home.'], ['♭VII', 'common', 'Rock-style move.']],
    'v': [['i', 'common', 'A gentle return home.'], ['♭VI', 'common', 'Keeps it moving.']],
    'V': [['i', 'strong', 'Home! The strongest ending.'], ['♭VI', 'common', 'A surprise ending (deceptive cadence).']],
    '♭VI': [['♭VII', 'strong', 'An epic climb...'], ['V', 'common', 'Steps down to V (the Andalusian move).'], ['iv', 'colour', 'Gentle and sad.'], ['♭III', 'colour', 'Brighter and lifting.']],
    '♭VII': [['♭III', 'strong', 'Falls a fifth.'], ['i', 'common', 'Back home, rock style.'], ['♭VI', 'common', 'Steps back down.']],
    'vii°': [['i', 'strong', 'Resolves up to home.']],
    'IV': [['i', 'common', 'Dorian flavour, back home.'], ['♭VII', 'common', 'Keeps the Dorian sound.']],
    '♭II': [['V', 'strong', 'The Neapolitan leading to V.']],
    'V/III': [['♭III', 'strong', 'Resolves to the chord it points at.']], 'V/iv': [['iv', 'strong', 'Resolves to the chord it points at.']],
    'V/VI': [['♭VI', 'strong', 'Resolves to the chord it points at.']],
  },
};
function nextMoves(roman, mode) {
  return (NEXT[mode === 'minor' ? 'minor' : 'major'][romanBase(roman)] || []).map(([to, kind, why]) => ({ to, kind, why }));
}

/* ---------- Hearing chords: which notes are sounding (a chroma), then which chord fits best ---------- */
function fftInPlace(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}
const CHROMA_N = 4096;
const HANN = (() => { const w = new Float32Array(CHROMA_N); for (let i = 0; i < CHROMA_N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (CHROMA_N - 1)); return w; })();
// Makes a ~11 kHz copy of the sound: plenty for guitar notes, and four times less work
function downTo11k(x, sr) {
  const f = Math.max(1, Math.round(sr / 11025));
  const n = Math.floor(x.length / f);
  const y = new Float32Array(n);
  // a simple low-pass first (two one-pole passes), then keep every f-th sample
  const a = Math.exp(-2 * Math.PI * 2200 / sr);
  let p1 = 0, p2 = 0, k = 0;
  for (let i = 0; i < n * f; i++) {
    p1 = (1 - a) * x[i] + a * p1; p2 = (1 - a) * p1 + a * p2;
    if (i % f === f - 1) y[k++] = p2;
  }
  return { x: y, sr: sr / f };
}
// One frame (CHROMA_N samples from `start`): how strongly each of the 12 notes sounds, plus the same for the bass alone
// tune: how far (in semitones, -0.5 to 0.5) the guitar is from standard A = 440 tuning; the notes are read relative to it
function chromaFrame(x, sr, start, tune) {
  const tn = tune || 0;
  const re = new Float64Array(CHROMA_N), im = new Float64Array(CHROMA_N);
  let e = 0;
  for (let i = 0; i < CHROMA_N; i++) { const v = x[start + i] || 0; e += v * v; re[i] = v * HANN[i]; }
  fftInPlace(re, im);
  const half = CHROMA_N / 2;
  const mag = new Float64Array(half);
  let mx = 0;
  for (let i = 1; i < half; i++) { mag[i] = Math.hypot(re[i], im[i]); if (mag[i] > mx) mx = mag[i]; }
  const chroma = new Float64Array(12), bass = new Float64Array(12);
  const binHz = sr / CHROMA_N;
  const lo = Math.floor(75 / binHz), hi = Math.min(half - 2, Math.ceil(1700 / binHz));
  let lowest = -1;
  const peaks = [];
  for (let i = Math.max(2, lo); i <= hi; i++) {
    const m = mag[i];
    if (m < mx * 0.04 || m < mag[i - 1] || m < mag[i + 1]) continue;
    // where exactly the peak sits between bins
    const a = mag[i - 1], c = mag[i + 1];
    const d = (a - c) / (2 * (a - 2 * m + c) || 1);
    peaks.push({ f: (i + d) * binHz, m });
  }
  // a peak that is the 3rd, 5th or 6th harmonic of a lower peak is mostly overtone, not a played note
  const near = (f) => peaks.find((p) => Math.abs(p.f - f) < Math.max(binHz * 1.2, f * 0.025));
  let ts = 0, tc = 0;   // which way the notes lean from the semitone grid (for working out the tuning)
  peaks.forEach((p) => {
    let w = Math.sqrt(p.m);
    for (const h of [3, 5, 6]) { const q = near(p.f / h); if (q && q.m > p.m * 0.25) { w *= 0.3; break; } }
    const raw = 69 + 12 * Math.log2(p.f / 440);
    ts += w * Math.sin(2 * Math.PI * raw); tc += w * Math.cos(2 * Math.PI * raw);
    const midi = raw - tn;
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    const off = Math.abs(midi - Math.round(midi));
    w *= (1 - off) * (p.f < 900 ? 1 : 900 / p.f);
    chroma[pc] += w;
    if (p.f < 260) { bass[pc] += w; if (lowest < 0 && p.m > mx * 0.12) lowest = pc; }
  });
  // the bass note: the lowest note whose fundamental is really there and whose overtones back it up
  // (more reliable than "the lowest peak": a low string's fundamental is often weaker than its overtones)
  const at = (f) => { const i = Math.round(f / binHz); let m = 0; for (let j = i - 1; j <= i + 1; j++) if (j > 0 && j < half) m = Math.max(m, mag[j]); return m; };
  const cands = [];
  let sMax = 0;
  for (let m = 38; m <= 66; m++) {
    const f0 = 440 * Math.pow(2, (m - tn - 69) / 12);
    const a1 = at(f0), sc = a1 + 0.8 * at(2 * f0) + 0.6 * at(3 * f0) + 0.4 * at(4 * f0);
    cands.push({ m, a1, sc });
    if (sc > sMax) sMax = sc;
  }
  let low = -1;
  for (let k = 0; k < cands.length; k++) {
    const c = cands[k];
    if (c.a1 < mx * 0.04 || c.sc < sMax * 0.45) continue;
    if ((k && cands[k - 1].a1 > c.a1) || (k + 1 < cands.length && cands[k + 1].a1 > c.a1)) continue;
    low = c.m % 12;
    break;
  }
  return { chroma, bass, lowest: low >= 0 ? low : lowest, rms: Math.sqrt(e / CHROMA_N), ts, tc };
}
// the tuning from the leaning of many notes: their average offset from the nearest semitone (a circular average)
function tuneFrom(ts, tc) {
  if (!ts && !tc) return 0;
  const v = Math.atan2(ts, tc) / (2 * Math.PI);
  // nearly half a semitone out could be either way: then assume standard tuning rather than guess wrong
  return Math.abs(v) > 0.4 ? 0 : v;
}
// The chord types the listener knows (each with its notes and how much each note counts)
const HEAR_TYPES = [
  { sym: '', iv: [0, 4, 7], w: [1, 0.9, 0.8], bias: 1 },
  { sym: 'm', iv: [0, 3, 7], w: [1, 0.9, 0.8], bias: 1 },
  { sym: '7', iv: [0, 4, 7, 10], w: [1, 0.85, 0.75, 0.8], bias: 0.95 },
  { sym: 'maj7', iv: [0, 4, 7, 11], w: [1, 0.85, 0.75, 0.8], bias: 0.95 },
  { sym: 'm7', iv: [0, 3, 7, 10], w: [1, 0.85, 0.75, 0.8], bias: 0.95 },
  { sym: 'sus4', iv: [0, 5, 7], w: [1, 0.9, 0.8], bias: 0.95 },
  { sym: 'sus2', iv: [0, 2, 7], w: [1, 0.9, 0.8], bias: 0.95 },
  { sym: '°', iv: [0, 3, 6], w: [1, 0.9, 0.9], bias: 0.93 },
  // the darker and stranger ones: dim7 and aug repeat every few frets, so their root comes from the bass note
  { sym: '°7', iv: [0, 3, 6, 9], w: [1, 0.9, 0.9, 0.9], bias: 0.94 , refine: true },
  { sym: 'm7♭5', iv: [0, 3, 6, 10], w: [1, 0.85, 0.85, 0.8], bias: 0.94 , refine: true },
  { sym: '+', iv: [0, 4, 8], w: [1, 0.9, 0.9], bias: 0.92 , refine: true },
  { sym: '6', iv: [0, 4, 7, 9], w: [1, 0.85, 0.75, 0.8], bias: 0.91 , refine: true },
  { sym: 'm6', iv: [0, 3, 7, 9], w: [1, 0.85, 0.75, 0.8], bias: 0.91 , refine: true },
  { sym: '7sus4', iv: [0, 5, 7, 10], w: [1, 0.85, 0.75, 0.8], bias: 0.93 , refine: true },
  // ninth chords: five notes, often played without the 5th; mostly found by extendOf below
  { sym: '9', iv: [0, 4, 7, 10, 2], w: [1, 0.85, 0.6, 0.8, 0.75], bias: 0.88 },
  { sym: 'maj9', iv: [0, 4, 7, 11, 2], w: [1, 0.85, 0.6, 0.8, 0.75], bias: 0.88 },
  { sym: 'm9', iv: [0, 3, 7, 10, 2], w: [1, 0.85, 0.6, 0.8, 0.75], bias: 0.88 },
];
const HEAR_TEMPLATES = (() => {
  const out = [];
  for (let r = 0; r < 12; r++) HEAR_TYPES.forEach((t, ti) => {
    const v = new Float64Array(12);
    t.iv.forEach((s, k) => { v[(r + s) % 12] = t.w[k]; });
    let n = 0;
    for (let i = 0; i < 12; i++) n += v[i] * v[i];
    n = Math.sqrt(n);
    for (let i = 0; i < 12; i++) v[i] /= n;
    out.push({ root: r, type: ti, sym: t.sym, v, bias: t.bias, refine: !!t.refine });
  });
  return out;
})();
// Scores every chord against one chroma; the best come first
const HEAR_LOW = { w: 0.06 };
const HEAR_7 = { b7: 0.45, maj7: 0.45, m7: 0.5 };
function scoreChroma(chroma, bass, low) {
  let n = 0, bm = 0;
  for (let i = 0; i < 12; i++) { n += chroma[i] * chroma[i]; if (bass && bass[i] > bm) bm = bass[i]; }
  n = Math.sqrt(n);
  if (!n) return [];
  // types marked refine are never guessed from the template alone: the note check (extendOf) finds them
  return HEAR_TEMPLATES.filter((t) => !t.refine).map((t) => {
    let s = 0;
    for (let i = 0; i < 12; i++) s += t.v[i] * chroma[i];
    s = (s / n) * t.bias;
    if (bass && bm > 0) s += 0.07 * (bass[t.root] / bm);   // guitar chords usually have their root lowest
    if (low >= 0 && t.root === low) s += HEAR_LOW.w;       // and the lowest note heard is the strongest hint at the root
    return { root: t.root, type: t.type, sym: t.sym, score: s };
  }).sort((a, b) => b.score - a.score);
}
// What chord is this one moment of sound? (used for live listening)
// prior(root, sym) may add a small bonus (for example to chords that belong to the key in use)
// sevenths: templates alone mix up C and Cmaj7 (the 3rd's overtone lands on the 7th), so the 7th is decided by how strong it is
// next to the three notes of the triad (measured on recorded guitars)
function seventhOf(chroma, r, sym, allow) {
  const fam = { '': 'M', '7': 'M', maj7: 'M', m: 'm', m7: 'm' }[sym];
  if (!fam) return sym;
  const tri = (chroma[r] + chroma[(r + (fam === 'M' ? 4 : 3)) % 12] + chroma[(r + 7) % 12]) / 3;
  if (!(tri > 0)) return sym;
  const b7 = chroma[(r + 10) % 12] / tri, M7 = chroma[(r + 11) % 12] / tri;
  const ok = (s) => !allow || allow.has(s);
  if (fam === 'M') return b7 >= HEAR_7.b7 && b7 > M7 && ok('7') ? '7' : M7 >= HEAR_7.maj7 && ok('maj7') ? 'maj7' : '';
  return b7 >= HEAR_7.m7 && ok('m7') ? 'm7' : 'm';
}
// After the templates pick the root: which notes are really there, measured against the root, 3rd and 5th
// (thresholds measured on recorded guitars). This is what tells C from C6, Cmaj7, C9, Cdim from Cm, Csus4 from C7sus4.
const HEAR_9 = { n9: 0.45 };
const HEAR_X = { third: 0.25, sus4: 0.67, sus2: 0.5, dim5: 0.27, aug5: 0.4, six: 0.3, dim7: 0.3, s7: 0.45, susRatio: 2 };
const HEAR_FALLBACK = { '°7': '°', 'm7♭5': 'm7', '+': '', '6': '', 'm6': 'm', '7sus4': 'sus4', '9': '7', maj9: 'maj7', m9: 'm7' };
function extendOf(chroma, r, sym, allow) {
  const X = HEAR_X;
  const ok = (s) => !allow || allow.has(s);
  const c = chroma, M3 = c[(r + 4) % 12], m3 = c[(r + 3) % 12], p5 = c[(r + 7) % 12];
  const base = (c[r] + p5 + Math.max(M3, m3)) / 3;
  if (!(base > 0)) return sym;
  const g = (i) => c[(r + i) % 12] / base;
  // a sus chord's 2nd or 4th rings far louder than any 3rd (a faint 3rd is usually the last chord still ringing)
  const th = Math.max(g(3), g(4));
  const sus = g(5) >= X.sus4 && g(5) > X.susRatio * th && g(5) > g(2) ? 4 : g(2) >= X.sus2 && g(2) > X.susRatio * 1.25 * th && g(10) < X.s7 && g(11) < X.s7 ? 2 : 0;
  const hasM = !sus && g(4) >= X.third && g(4) >= g(3), hasm = !sus && g(3) >= X.third && g(3) > g(4);
  let out;
  if (sus === 4) out = g(10) >= X.s7 ? '7sus4' : 'sus4';
  else if (sus === 2) out = 'sus2';
  else if (hasm && g(6) >= X.dim5 && g(6) > g(7)) out = g(9) >= X.dim7 && g(9) > g(10) ? '°7' : g(10) >= X.s7 ? 'm7♭5' : '°';
  else if (hasM && g(8) >= X.aug5 && g(8) > g(7)) out = '+';
  else if (hasM || hasm) {
    out = seventhOf(chroma, r, hasM ? '' : 'm');
    if ((out === '' || out === 'm') && g(9) >= X.six && g(10) < X.s7) out = hasM ? '6' : 'm6';
    const up = { 7: '9', maj7: 'maj9', m7: 'm9' }[out];
    // the 5th's own overtone lands on the 9th (G × 3 = D), so part of what sounds there is not a played 9th
    if (up && g(2) - 0.5 * g(7) >= HEAR_9.n9) out = up;
  } else if (g(5) >= X.sus4 && g(5) > g(2)) out = g(10) >= X.s7 ? '7sus4' : 'sus4';
  else if (g(2) >= X.sus2) out = 'sus2';
  else out = sym;
  // only some chord types allowed (Simple mode): fall back to the plainer chord of the same family
  let f = out;
  while (f !== undefined && !ok(f)) f = HEAR_FALLBACK[f];
  return f === undefined ? sym : f;
}
// allow: only these chord types (for example just major, minor and 7 for beginners)
const HEAR_SLASH = { bassShare: 0.45, swap: 0.08 };
// how well one chord's notes match the sound (0..1)
function chordFit(chroma, root, sym) {
  const t = HEAR_TEMPLATES.find((x) => x.root === root && x.sym === sym);
  if (!t) return 0;
  let n = 0, s = 0;
  for (let i = 0; i < 12; i++) { n += chroma[i] * chroma[i]; s += t.v[i] * chroma[i]; }
  return n ? (s / Math.sqrt(n)) * t.bias : 0;
}
// lowSure: the bass note has held steady for a while (only then is it trusted to make a slash chord or move the root)
function hearChord(chroma, bass, rms, prior, low, allow, lowSure) {
  if (!(rms > 0.004)) return null;
  const hasLow = Number.isInteger(low) && low >= 0;
  const pick = (lw) => {
    let list = scoreChroma(chroma, bass, lw);
    if (allow) list = list.filter((c) => allow.has(c.sym));
    if (prior) { list.forEach((c) => { c.score += prior(c.root, c.sym) || 0; }); list.sort((a, b) => b.score - a.score); }
    return list;
  };
  let list = pick(hasLow ? low : -1);
  if (!list.length) return null;
  const typeOf = (sym) => HEAR_TYPES.findIndex((h) => h.sym === sym);
  const settle = (c) => { const sym = extendOf(chroma, c.root, c.sym, allow); return sym === c.sym ? c : { root: c.root, type: typeOf(sym), sym, score: c.score }; };
  let best = settle(list[0]);
  let slash;
  if (hasLow && lowSure !== false && best.root !== low) {
    // most guitar chords are played with the root lowest: if the bass note makes a chord that fits nearly as well, that is the one
    // (C6 rather than Am7, C7sus4 rather than Fsus4, and the root of a dim7 or aug, which repeat every few frets)
    const s2 = extendOf(chroma, low, '', allow);
    let bm = 0;
    for (let i = 0; i < 12; i++) if (bass[i] > bm) bm = bass[i];
    if (s2 && typeOf(s2) >= 0 && (!allow || allow.has(s2)) && chordFit(chroma, low, s2) >= chordFit(chroma, best.root, best.sym) - HEAR_SLASH.swap) {
      best = { root: low, type: typeOf(s2), sym: s2, score: best.score };
    } else if (bm > 0 && bass[low] >= HEAR_SLASH.bassShare * bm) {
      // otherwise a clear bass note that is not in the root's place: a slash chord (C/E, A/B, Am/G), named by what fits the upper notes best
      const free = pick(-1)[0];
      if (free && free.root !== low) best = settle(free);
      if (best.root !== low) slash = low;
    }
  }
  if (best !== list[0]) list = [best].concat(list.filter((c) => !(c.root === best.root && c.sym === best.sym)));
  // when it is not sure, offer the slash reading as the first other guess (tap it to correct)
  if (hasLow && slash === undefined && best.root === low) {
    const free = settle(pick(-1).find((c) => c.root !== low) || list[0]);
    // (not when it is the same notes under another name: Am7 and C6/A sound the same)
    const notes = (c) => { const h = HEAR_TYPES.find((x) => x.sym === c.sym); return h ? h.iv.map((i) => (c.root + i) % 12).sort((a, b) => a - b).join() : ''; };
    if (free.root !== low && notes(free) !== notes(best)) list.splice(1, 0, Object.assign({}, free, { bass: low }));
  }
  const next = list.find((c) => c.root !== best.root || c.type !== best.type);
  const margin = best.score - (next ? next.score : 0);
  // how sure: a strong match that clearly beats the runner-up
  const conf = Math.max(0, Math.min(1, (best.score - 0.62) / 0.3)) * Math.max(0.25, Math.min(1, margin / 0.05));
  return { root: best.root, sym: best.sym, type: best.type, score: best.score, margin, conf, bass: slash, others: list.slice(1, 4) };
}
// A whole recording: chords over time, like a chord track in a DAW
function chordTrack(x, sr, opts) {
  const o = opts || {};
  const d = downTo11k(x, sr);
  const hop = 1024;
  // first listen for the guitar's tuning (a guitar a little sharp or flat should still read right), then read the chords
  let TS = 0, TC = 0;
  for (let s = 0; s + CHROMA_N <= d.x.length; s += hop * 3) { const f = chromaFrame(d.x, d.sr, s, 0); TS += f.ts; TC += f.tc; }
  const tune = o.tune !== undefined ? o.tune : tuneFrom(TS, TC);
  const frames = [];
  let peakRms = 0;
  for (let s = 0; s + CHROMA_N <= d.x.length; s += hop) {
    const f = chromaFrame(d.x, d.sr, s, tune);
    f.t = (s + CHROMA_N / 2) / d.sr;
    frames.push(f);
    if (f.rms > peakRms) peakRms = f.rms;
  }
  if (!frames.length) return { segments: [], frames: 0, key: null, dur: x.length / sr };
  // smooth each frame with its neighbours (about a third of a second)
  const K = 2;
  const sm = frames.map((f, i) => {
    const c = new Float64Array(12), b = new Float64Array(12);
    const lv = new Float64Array(12);
    for (let k = -K; k <= K; k++) { const g = frames[i + k]; if (!g) continue; const w = 1 - Math.abs(k) / (K + 1); for (let p = 0; p < 12; p++) { c[p] += w * g.chroma[p]; b[p] += w * g.bass[p]; } if (g.lowest >= 0) lv[g.lowest] += w; }
    let low = -1, lb = 0;
    for (let p = 0; p < 12; p++) if (lv[p] > lb) { lb = lv[p]; low = p; }
    return { c, b, low: lb >= 1.2 ? low : -1 };
  });
  const S = HEAR_TEMPLATES.length;           // the last state (S) means "no chord"
  const quiet = (f) => f.rms < Math.max(0.004, peakRms * 0.06);
  const emit = frames.map((f, i) => {
    const e = new Float64Array(S + 1);
    if (quiet(f)) { for (let k = 0; k < S; k++) e[k] = 0; e[S] = 10; return e; }
    const sc = scoreChroma(sm[i].c, sm[i].b, sm[i].low);
    sc.forEach((c) => { e[c.root * HEAR_TYPES.length + c.type] = o.allow && !o.allow.has(c.sym) ? 0 : 12 * c.score; });
    const top = o.allow ? sc.find((c) => o.allow.has(c.sym)) : sc[0];
    if (top) {
      const s7 = extendOf(sm[i].c, top.root, top.sym, o.allow);
      const ti = HEAR_TYPES.findIndex((h) => h.sym === s7);
      if (s7 !== top.sym && ti >= 0) e[top.root * HEAR_TYPES.length + ti] = 12 * top.score + 0.05;
    }
    e[S] = 12 * 0.45;
    return e;
  });
  // the best path through the chords, paying a price for every change (so one odd frame does not split a chord)
  const SWITCH = o.switchCost || 2.2;
  let prev = emit[0].slice();
  const back = [];
  for (let i = 1; i < frames.length; i++) {
    let bi = 0;
    for (let k = 1; k <= S; k++) if (prev[k] > prev[bi]) bi = k;
    const cur = new Float64Array(S + 1), bk = new Int16Array(S + 1);
    for (let k = 0; k <= S; k++) {
      const stay = prev[k], jump = prev[bi] - SWITCH;
      if (stay >= jump) { cur[k] = stay + emit[i][k]; bk[k] = k; } else { cur[k] = jump + emit[i][k]; bk[k] = bi; }
    }
    back.push(bk);
    prev = cur;
  }
  let st = 0;
  for (let k = 1; k <= S; k++) if (prev[k] > prev[st]) st = k;
  const path = new Int16Array(frames.length);
  path[frames.length - 1] = st;
  for (let i = frames.length - 2; i >= 0; i--) { st = back[i][st]; path[i] = st; }
  // join equal neighbours into segments
  const hopSec = hop / d.sr;
  const segs = [];
  for (let i = 0; i < frames.length; i++) {
    const s = path[i];
    const last = segs[segs.length - 1];
    if (last && last.state === s) { last.end = frames[i].t + hopSec / 2; last.n++; last.sum += emit[i][s] / 12; }
    else segs.push({ state: s, start: i ? frames[i].t - hopSec / 2 : 0, end: frames[i].t + hopSec / 2, n: 1, sum: emit[i][s] / 12 });
  }
  const minLen = o.minSec || 0.35;
  const out = [];
  segs.forEach((g) => {
    const tooShort = g.end - g.start < minLen;
    const prevOut = out[out.length - 1];
    if (tooShort && prevOut) { prevOut.end = g.end; return; }
    if (g.state === S) { out.push({ none: true, start: g.start, end: g.end }); return; }
    const t = HEAR_TEMPLATES[g.state];
    out.push({ root: t.root, sym: t.sym, type: t.type, start: g.start, end: g.end, confidence: g.sum / g.n });
  });
  // join again after the merges, and drop silent ends
  const joined = [];
  out.forEach((g) => {
    const l = joined[joined.length - 1];
    if (l && !!l.none === !!g.none && (g.none || (l.root === g.root && l.sym === g.sym))) l.end = g.end;
    else joined.push(g);
  });
  // name each chord once more from all of its frames together: the note check, the bass note and slash chords
  joined.forEach((g) => {
    if (g.none) return;
    const c = new Float64Array(12), b = new Float64Array(12), lv = new Float64Array(12);
    let n = 0;
    frames.forEach((f, i) => { if (f.t < g.start || f.t > g.end || quiet(f)) return; n++; for (let p = 0; p < 12; p++) { c[p] += sm[i].c[p]; b[p] += sm[i].b[p]; } if (f.lowest >= 0) lv[f.lowest]++; });
    if (!n) return;
    let low = -1, lb = 0;
    for (let p = 0; p < 12; p++) if (lv[p] > lb) { lb = lv[p]; low = p; }
    const h = hearChord(c, b, 1, null, lb >= n * 0.5 ? low : -1, o.allow);
    if (h) { g.root = h.root; g.sym = h.sym; g.type = h.type; if (h.bass !== undefined) g.bass = h.bass; else delete g.bass; }
  });
  const chords = joined.filter((g) => !g.none);
  // overall key from everything that sounded
  const tot = new Float64Array(12);
  frames.forEach((f, i) => { if (!quiet(f)) for (let p = 0; p < 12; p++) tot[p] += sm[i].c[p]; });
  return { segments: chords, frames: frames.length, key: guessKey(tot, chords), dur: x.length / sr, tune };
}

/* ---------- Tuner ---------- */
// Exact pitch of one ringing string (YIN with a smooth peak between samples): good to about a cent, from about 60 Hz up
function tunerPitch(x, sr) {
  // half rate is plenty for guitar strings, and four times less work
  const half = sr > 30000;
  const n0 = half ? Math.floor(x.length / 2) : x.length;
  const y = new Float32Array(n0);
  if (half) for (let i = 0; i < n0; i++) y[i] = (x[2 * i] + x[2 * i + 1]) * 0.5; else y.set(x.subarray ? x.subarray(0, n0) : x.slice(0, n0));
  const fs = half ? sr / 2 : sr;
  let e = 0;
  for (let i = 0; i < n0; i++) e += y[i] * y[i];
  const rms = Math.sqrt(e / n0);
  const minLag = Math.floor(fs / 1200), maxLag = Math.min(Math.floor(fs / 60), Math.floor(n0 / 2));
  const W = n0 - maxLag;
  if (W < 256) return { f: 0, rms, clarity: 0 };
  const d = new Float32Array(maxLag + 2);
  for (let lag = 1; lag <= maxLag + 1 && lag < n0 - W; lag++) {
    let s = 0;
    for (let i = 0; i < W; i++) { const v = y[i] - y[i + lag]; s += v * v; }
    d[lag] = s;
  }
  // cumulative mean normalised difference
  const cm = new Float32Array(maxLag + 2);
  cm[0] = 1;
  let run = 0;
  for (let lag = 1; lag <= maxLag + 1; lag++) { run += d[lag]; cm[lag] = run ? (d[lag] * lag) / run : 1; }
  let best = -1;
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (cm[lag] < 0.15) { while (lag + 1 <= maxLag && cm[lag + 1] < cm[lag]) lag++; best = lag; break; }
  }
  if (best < 0) { let m = Infinity; for (let lag = minLag; lag <= maxLag; lag++) if (cm[lag] < m) { m = cm[lag]; best = lag; } if (m > 0.35) return { f: 0, rms, clarity: 1 - m }; }
  // between samples: fit a parabola through the dip
  const a = cm[best - 1], b = cm[best], c = cm[best + 1];
  const den = a - 2 * b + c;
  const shift = den ? Math.max(-1, Math.min(1, (a - c) / (2 * den))) : 0;
  return { f: fs / (best + shift), rms, clarity: 1 - b };
}
const TUNINGS = [
  { id: 'std', name: 'Standard (E A D G B E)', notes: [40, 45, 50, 55, 59, 64] },
  { id: 'dropd', name: 'Drop D (D A D G B E)', notes: [38, 45, 50, 55, 59, 64] },
  { id: 'half', name: 'Half step down (E♭ A♭ D♭ G♭ B♭ E♭)', notes: [39, 44, 49, 54, 58, 63] },
  { id: 'whole', name: 'Whole step down (D G C F A D)', notes: [38, 43, 48, 53, 57, 62] },
  { id: 'dropc', name: 'Drop C (C G C F A D)', notes: [36, 43, 48, 53, 57, 62] },
  { id: 'dadgad', name: 'DADGAD', notes: [38, 45, 50, 55, 57, 62] },
  { id: 'openg', name: 'Open G (D G D G B D)', notes: [38, 43, 50, 55, 59, 62] },
  { id: 'opend', name: 'Open D (D A D F♯ A D)', notes: [38, 45, 50, 54, 57, 62] },
  { id: 'opene', name: 'Open E (E B E G♯ B E)', notes: [40, 47, 52, 56, 59, 64] },
];
// which string you are tuning, and how far off: cents (100 = one fret), for a reference A
function tunerRead(f, tuning, a4, lockString) {
  if (!(f > 0)) return null;
  const midi = 69 + 12 * Math.log2(f / (a4 || 440));
  let s = Number.isInteger(lockString) && lockString >= 0 ? lockString : -1;
  if (s < 0) { let bd = Infinity; tuning.notes.forEach((m, i) => { const dd = Math.abs(midi - m); if (dd < bd) { bd = dd; s = i; } }); }
  const target = tuning.notes[s];
  const near = Math.round(midi);
  return { midi, near, cents: (midi - near) * 100, string: s, target, toTarget: (midi - target) * 100 };
}
// Which key fits a set of notes and chords best (Krumhansl's key profiles, plus a nudge toward the chords' own roots)
const KEY_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KEY_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function guessKey(chroma, chords) {
  const c = new Float64Array(12);
  for (let i = 0; i < 12; i++) c[i] = chroma ? chroma[i] : 0;
  (chords || []).forEach((g) => {
    const t = HEAR_TYPES[g.type] || HEAR_TYPES[0];
    const w = Math.max(0.1, g.end - g.start);
    t.iv.forEach((s) => { c[(g.root + s) % 12] += w * 0.5; });
  });
  const corr = (a, b) => {
    const ma = a.reduce((s, v) => s + v, 0) / 12, mb = b.reduce((s, v) => s + v, 0) / 12;
    let n = 0, da = 0, db = 0;
    for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
    return da && db ? n / Math.sqrt(da * db) : 0;
  };
  let best = null;
  for (let r = 0; r < 12; r++) {
    for (const mode of ['major', 'minor']) {
      const prof = mode === 'major' ? KEY_MAJOR : KEY_MINOR;
      const rot = new Array(12);
      for (let i = 0; i < 12; i++) rot[(r + i) % 12] = prof[i];
      let s = corr(c, rot);
      // a key whose home chord is actually played (first or last especially) is more likely
      if (chords && chords.length) {
        const home = (g) => g.root === r && (mode === 'major' ? (g.sym === '' || g.sym === 'maj7') : (g.sym === 'm' || g.sym === 'm7'));
        if (chords.some(home)) s += 0.05;
        if (home(chords[0]) || home(chords[chords.length - 1])) s += 0.06;
      }
      if (!best || s > best.score) best = { root: r, mode, score: s };
    }
  }
  return best && best.score > 0.2 ? best : null;
}

/* ---------- Analysing a progression: its key, each chord's number and job, cadences, and familiar patterns ---------- */
const DEG_NUM = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const SYM_SUFFIX = { '': '', m: '', '°': '°', '+': '+', sus2: 'sus2', sus4: 'sus4', maj7: 'maj7', '7': '7', m7: '7', 'm7♭5': 'ø7', '°7': '°7', 'm(maj7)': '(maj7)', '6': '6', m6: '6', '7sus4': '7sus4', maj9: 'maj9', '9': '9', m9: '9', '7♭9': '7♭9', '7♯9': '7♯9' };
const MINORISH = new Set(['m', '°', 'm7', 'm7♭5', '°7', 'm(maj7)', 'm6', 'm9']);
const KEY_STEPS = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
// what kind of chord a set of notes is, counted from its root (null when it has no standard name)
function chordSym(root, pcs) {
  const want = Array.from(new Set(pcs.map((p) => ((p % 12) + 12) % 12))).sort((a, b) => a - b).join();
  for (const e of ARP_ENTRIES) {
    const got = Array.from(new Set(buildPattern(e, root, true).notes.map((n) => n.pc))).sort((a, b) => a - b).join();
    if (got === want) return e.sym;
  }
  return null;
}
function romanOf(root, sym, pcs, tonic) {
  const rel = ((root - tonic) % 12 + 12) % 12;
  let num = DEG_NUM[rel];
  const minor = sym !== null ? MINORISH.has(sym) : (pcs.indexOf((root + 3) % 12) >= 0 && pcs.indexOf((root + 4) % 12) < 0);
  if (minor) num = num.replace(/[IV]+/, (x) => x.toLowerCase());
  return num + (sym !== null ? SYM_SUFFIX[sym] || '' : '');
}
function keyScale(tonic, mode) { return KEY_STEPS[mode].map((s) => (tonic + s) % 12); }
// slots: [{ tones: [{pc}], beats }] with the root first. hint: { hk, hm } (the key in use, a tie-breaker)
function analyzeProg(slots, hint) {
  const chords = (slots || []).filter((s) => s && s.tones && s.tones.length).map((s) => {
    const pcs = s.tones.map((t) => t.pc);
    const root = pcs[0];
    const bass = Number.isInteger(s.bass) && s.bass !== root ? s.bass : null;
    return { name: s.name, root, pcs, keyPcs: bass === null || pcs.indexOf(bass) >= 0 ? pcs : pcs.concat([bass]), bass, sym: chordSym(root, pcs), beats: s.beats || 4 };
  });
  if (!chords.length) return null;
  const total = chords.reduce((a, c) => a + c.beats, 0);
  const isTonicChord = (c, t, m) => c.root === t && (m === 'major' ? !MINORISH.has(c.sym) && c.sym !== '7' : MINORISH.has(c.sym) || c.sym === null && c.pcs.indexOf((t + 3) % 12) >= 0);
  const scored = [];
  for (let t = 0; t < 12; t++) {
    for (const m of ['major', 'minor']) {
      const sc = keyScale(t, m);
      if (m === 'minor') sc.push((t + 11) % 12);   // the raised 7th of harmonic minor (for V and vii°)
      let s = 0;
      chords.forEach((c) => {
        const inn = c.keyPcs.filter((p) => sc.indexOf(p) >= 0).length / c.keyPcs.length;
        s += c.beats * (inn + (inn === 1 ? 0.3 : 0));
      });
      s /= total;
      if (isTonicChord(chords[0], t, m)) s += 0.25;
      if (isTonicChord(chords[chords.length - 1], t, m)) s += 0.3;
      if (chords.some((c) => isTonicChord(c, t, m))) s += 0.15;
      if (hint && hint.hk === t && hint.hm === m) s += 0.04;
      scored.push({ tonic: t, mode: m, score: s });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const key = scored[0];
  const T = key.tonic, M = key.mode;
  const scale = keyScale(T, M);
  const minorExtra = M === 'minor' ? [(T + 11) % 12] : [];
  const parallel = keyScale(T, M === 'major' ? 'minor' : 'major');
  const out = chords.map((c, i) => {
    const rel = ((c.root - T) % 12 + 12) % 12;
    const roman = romanOf(c.root, c.sym, c.pcs, T);
    const diatonic = c.pcs.every((p) => scale.indexOf(p) >= 0 || (minorExtra.indexOf(p) >= 0 && (rel === 7 || rel === 11)));
    let kind = diatonic ? 'diatonic' : 'chromatic', label = roman, target = null;
    const dominantish = c.sym === '' || c.sym === '7' || c.sym === '9' || c.sym === '7♭9' || c.sym === '7♯9';
    if (!diatonic && dominantish) {
      // a secondary dominant: the V of another chord in the key (its root is a fifth above that chord's root)
      const tr = (c.root + 5) % 12, trel = ((tr - T) % 12 + 12) % 12;
      if (scale.indexOf(tr) >= 0 && trel !== 0) {
        const tq = M === 'major' ? { 2: 'ii', 4: 'iii', 5: 'IV', 7: 'V', 9: 'vi' }[trel] : { 3: '♭III', 5: 'iv', 7: 'v', 8: '♭VI', 10: '♭VII' }[trel];
        if (tq) { kind = 'secondary'; target = tq; label = 'V' + (c.sym === '' ? '' : SYM_SUFFIX[c.sym]) + '/' + tq; }
      }
    }
    if (kind === 'chromatic' && c.pcs.every((p) => parallel.indexOf(p) >= 0)) kind = 'borrowed';
    let fn = '';
    const base = roman.replace(/(maj7|7|9|6|sus2|sus4|ø7|°7|\(maj7\)|7sus4|maj9|7♭9|7♯9)$/, '').replace(/[°+ø]$/, '');
    if (kind === 'secondary') fn = 'D';
    else if (M === 'major') fn = { 0: 'T', 4: 'T', 9: 'T', 2: 'PD', 5: 'PD', 7: 'D', 11: 'D', 8: 'PD', 10: 'PD', 3: 'T', 1: 'PD' }[rel] || '';
    else fn = { 0: 'T', 3: 'T', 8: 'PD', 2: 'PD', 5: 'PD', 7: 'D', 11: 'D', 10: 'D', 1: 'PD' }[rel] || '';
    return { name: c.name, root: c.root, sym: c.sym, roman, label, base, kind, target, fn, rel, bass: c.bass };
  });
  // what happens from one chord to the next (and from the last back to the first, since progressions loop)
  const notes = [];
  const isI = (x) => x && x.rel === 0 && x.kind !== 'secondary';
  const isV = (x) => x && x.rel === 7 && x.kind !== 'secondary' && !MINORISH.has(x.sym);
  const isVii = (x) => x && x.rel === 11 && (x.sym === '°' || x.sym === 'm7♭5' || x.sym === '°7');
  const isIV = (x) => x && x.rel === 5 && x.kind !== 'secondary';
  const isvi = (x) => x && ((M === 'major' && x.rel === 9) || (M === 'minor' && x.rel === 8));
  const isii = (x) => x && x.rel === 2;
  const seen = new Set();
  const add = (k, txt, at) => { if (seen.has(k)) return; seen.add(k); notes.push({ kind: k.split(':')[0], text: txt, at }); };
  const n = out.length;
  for (let i = 0; i < n; i++) {
    const a = out[i], b = out[(i + 1) % n], c = out[(i + 2) % n];
    const wrap = i === n - 1;
    if (n < 2 || (wrap && n < 3)) break;
    const where = wrap ? ' (when it loops back to the start)' : '';
    if (isii(a) && isV(b) && isI(c) && n >= 3) add('251:' + i, `${a.name} → ${b.name} → ${c.name} is a 2–5–1 (${a.roman} – ${b.roman} – ${c.roman}): the strongest way home, and the heart of jazz.`, i);
    if ((isV(a) || isVii(a)) && isI(b)) add('auth:' + a.name + b.name, `${a.name} → ${b.name} is an authentic cadence (${a.roman} → ${b.roman})${where}: tension resolving home. It sounds finished.`, i);
    if (isIV(a) && isI(b)) add('plagal:' + a.name + b.name, `${a.name} → ${b.name} is a plagal cadence (${a.roman} → ${b.roman})${where}, the soft "amen" ending.`, i);
    if (isV(a) && isvi(b)) add('decep:' + a.name + b.name, `${a.name} → ${b.name} is a deceptive cadence (${a.roman} → ${b.roman})${where}: the ear expects home, and gets a surprise.`, i);
    if (a.kind === 'secondary' && b.base && a.target && b.base.toLowerCase() === a.target.toLowerCase() && !wrap) add('sec:' + i, `${a.name} is a secondary dominant (${a.label}): it borrows a V chord to pull hard into ${b.name}.`, i);
  }
  out.forEach((x, i) => {
    if (x.kind === 'secondary' && !seen.has('sec:' + i)) add('sec2:' + x.name, `${x.name} works as ${x.label}: the V of ${x.target}. It sounds strongest when ${x.target} comes right after it.`, i);
    if (x.kind === 'borrowed') add('bor:' + x.name, `${x.name} (${x.roman}) is borrowed from the parallel ${M === 'major' ? 'minor' : 'major'} key: it adds a ${M === 'major' ? 'darker, bittersweet' : 'brighter'} colour.`, i);
    if (x.kind === 'chromatic') add('chr:' + x.name, `${x.name} (${x.roman}) is outside the key: a bold, surprising colour. Make sure the melody avoids clashing notes over it.`, i);
  });
  const last = out[n - 1];
  if (n >= 2 && isV(last)) add('half', `It ends on ${last.name} (V), a half cadence: it sounds unfinished and pulls you back to the start.`, n - 1);
  else if (n >= 2 && isI(last)) add('home', `It ends on ${last.name}, the home chord, so it sounds resolved.`, n - 1);
  if (n >= 3) {
    let run = 1, best = 1;
    for (let i = 1; i < n; i++) { if (((out[i - 1].root - out[i].root) % 12 + 12) % 12 === 7) { run++; best = Math.max(best, run); } else run = 1; }
    if (best >= 3) add('fifths', `${best} chords in a row fall by fifths (one step anticlockwise on the circle each time): the strongest kind of chord movement.`, 0);
  }
  // familiar progressions inside this one (anywhere, also across the loop). A song can borrow a progression
  // in a nearby key (the J-pop royal road F – G – Em – Am is in C even when the song sits in A minor), so every key is tried, the song's own first
  const norm = (s) => s.replace(/[°ø+]/g, '');
  const baseIn = (c, t) => romanOf(c.root, c.sym, c.pcs, t).replace(/(maj7|7|9|6|sus2|sus4|ø7|°7|\(maj7\)|7sus4|maj9|7♭9|7♯9)$/, '').replace(/[°+ø]$/, '');
  const matches = [];
  const tryKey = (t, m) => {
    const bases = chords.map((c) => norm(baseIn(c, t)));
    COMMON_PROGS.forEach((p) => {
      if (p.mode !== m || matches.some((x) => x.id === p.id)) return;
      const seq = p.steps.map((st) => norm(st[0]));
      if (seq.length > n || seq.length < 3) return;
      for (let s0 = 0; s0 < n; s0++) {
        let ok = true;
        for (let k = 0; k < seq.length && ok; k++) ok = bases[(s0 + k) % n] === seq[k];
        if (ok) { matches.push({ id: p.id, name: p.name, alt: p.alt, hint: p.hint, at: s0, tonic: t, mode: m, sameKey: t === T && m === M }); break; }
      }
    });
  };
  tryKey(T, M);
  tryKey(M === 'major' ? (T + 9) % 12 : (T + 3) % 12, M === 'major' ? 'minor' : 'major');   // the relative key
  for (let t = 0; t < 12; t++) for (const m of ['major', 'minor']) tryKey(t, m);
  // prefer what was found in the song's own key or its relative, then longer patterns
  matches.sort((a, b) => (b.sameKey - a.sameKey) || (COMMON_PROGS.find((p) => p.id === b.id).steps.length - COMMON_PROGS.find((p) => p.id === a.id).steps.length));
  const fit = Math.round(100 * out.filter((x) => x.kind === 'diatonic').length / n);
  return { key: { tonic: T, mode: M, fit, alt: scored.slice(1, 3).map((k) => ({ tonic: k.tonic, mode: k.mode })) }, chords: out, notes, matches };
}
// a chord from a Roman numeral in a key: its root and chord type
function chordFromRoman(roman, tonic) {
  const m = /^(♭|♯)?(iii|ii|iv|i|vii|vi|v|III|II|IV|I|VII|VI|V)(.*)$/.exec(String(roman));
  if (!m) return null;
  const nums = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'], steps = [0, 2, 4, 5, 7, 9, 11];
  const d = nums.indexOf(m[2].toUpperCase());
  if (d < 0) return null;
  const root = (tonic + steps[d] + (m[1] === '♭' ? -1 : m[1] === '♯' ? 1 : 0) + 12) % 12;
  const lower = m[2] === m[2].toLowerCase();
  const rest = m[3] || '';
  let sym = lower ? 'm' : '';
  if (rest.indexOf('°') >= 0) sym = '°';
  else if (rest.indexOf('ø') >= 0) sym = 'm7♭5';
  else if (rest === '7') sym = lower ? 'm7' : '7';
  else if (rest === 'maj7') sym = 'maj7';
  return { root, sym };
}

/* ---------- Hearing a scale: which notes were played, then which scales fit them ---------- */
// weights: how long each of the 12 notes sounded. opts: { first, last, lowest } (note numbers 0–11) help pick the home note
function scaleMatches(weights, opts) {
  const o = opts || {};
  const mx = Math.max.apply(null, weights);
  if (!(mx > 0)) return [];
  const played = [];
  for (let p = 0; p < 12; p++) if (weights[p] > mx * 0.08) played.push(p);
  const tot = played.reduce((a, p) => a + weights[p], 0);
  const out = [];
  const seen = new Set();
  ENTRIES.filter((e) => e.kind === 'scale' && (e.group === 'Scales' || e.group === 'Modes')).forEach((e) => {
    for (let r = 0; r < 12; r++) {
      const set = Array.from(new Set(buildPattern(e, r, true).notes.map((n) => n.pc)));
      const sig = r + ':' + set.slice().sort((a, b) => a - b).join();
      if (seen.has(sig)) continue;   // Ionian = Major, Aeolian = Natural minor: list each once
      seen.add(sig);
      const inn = played.filter((p) => set.indexOf(p) >= 0);
      const cov = inn.reduce((a, p) => a + weights[p], 0) / tot;
      const missing = set.filter((p) => played.indexOf(p) < 0);
      const extra = played.filter((p) => set.indexOf(p) < 0);
      const tonic = (weights[r] / mx) * 0.6 + (r === o.first ? 0.35 : 0) + (r === o.last ? 0.5 : 0) + (r === o.lowest ? 0.3 : 0);
      const score = cov * 10 - missing.length * 0.7 + (played.indexOf(r) >= 0 ? tonic : -2) - (set.length > 8 ? 0.6 : 0);
      out.push({ id: e.id, name: e.name, group: e.group, root: r, size: set.length, cov, missing, extra, score });
    }
  });
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, 8);
}

if (typeof module !== 'undefined') {
  module.exports = { spell, buildPattern, dotsFor, findVoicings, patternsFor, harmonize, relatedChords, chordShapes, ENTRIES, INV, SETS, SHARP_NAMES, FLAT_NAMES, OPEN, fmtLabel, slotMidis, slotPlan, tempoFromTaps, moveItem, cleanProg, PROG_MAX, SPEEDS, chordSearch, pickerChord, QUAL, ARP_ENTRIES, RHYTHMS, rhythmOf, CUSTOM_RHYTHMS, cleanRhythm, regridSteps, regridPicks, stringNote, analyzeHits, classifyHits, estimateStep, hitsToPattern, detectPitch, stringForPitch, stringForHit, COMMON_PROGS, progChords, GUITARS, ksRender, romanBase, nextMoves, fftInPlace, chromaFrame, downTo11k, scoreChroma, hearChord, chordTrack, guessKey, HEAR_TYPES, CHROMA_N, tuneFrom, withBass, analyzeProg, chordFromRoman, chordSym, romanOf, keyScale, scaleMatches, grooveFromHits, GROOVE_MAX_BEATS, HEAR_LOW, HEAR_7, HEAR_9, HEAR_X, HEAR_SLASH, tunerPitch, tunerRead, TUNINGS };
}
