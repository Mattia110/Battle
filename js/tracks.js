'use strict';
// ===================== TRACKS (eigene Kompositionen) =====================
// play(M, t, bar, s, spb): wird für jedes 16tel aufgerufen. s = 0..15, spb = Sekunden pro 16tel.

const GALLOP = [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15];
const up12 = n => midi(n) + 12;

// ---------------------------------------------------------------- 1) STURMFRONT
// Main Theme: treibender Electro-Rock, D-Moll, 148 BPM
const SF = {
  rootsRiff: ['D2', 'Bb1', 'F2', 'C2'],
  padRiff: [['D3', 'F3', 'A3', 'D4'], ['Bb2', 'D3', 'F3', 'Bb3'], ['F3', 'A3', 'C4', 'F4'], ['C3', 'E3', 'G3', 'C4']],
  stabRiff: [['D2', 'A2', 'D3'], ['Bb1', 'F2', 'Bb2'], ['F2', 'C3', 'F3'], ['C2', 'G2', 'C3']],
  rootsCh: ['D2', 'Bb1', 'C2', 'A1'],
  padCh: [['D3', 'F3', 'A3', 'D4'], ['Bb2', 'D3', 'F3', 'Bb3'], ['C3', 'E3', 'G3', 'C4'], ['A2', 'C#3', 'E3', 'A3']],
  stabCh: [['D3', 'A3', 'D4'], ['Bb2', 'F3', 'Bb3'], ['C3', 'G3', 'C4'], ['A2', 'E3', 'A3']],
  lead: [
    [['D5', 0, 3], ['F5', 3, 3], ['A5', 6, 2], ['G5', 8, 4], ['F5', 12, 2], ['E5', 14, 2]],
    [['F5', 0, 6], ['D5', 6, 2], ['Bb4', 8, 4], ['D5', 12, 4]],
    [['E5', 0, 3], ['G5', 3, 3], ['C6', 6, 2], ['Bb5', 8, 4], ['A5', 12, 2], ['G5', 14, 2]],
    [['A5', 0, 6], ['G5', 6, 2], ['E5', 8, 4], ['C#5', 12, 4]],
    [['D5', 0, 3], ['F5', 3, 3], ['A5', 6, 2], ['G5', 8, 4], ['F5', 12, 2], ['E5', 14, 2]],
    [['F5', 0, 4], ['G5', 4, 4], ['A5', 8, 4], ['Bb5', 12, 4]],
    [['C6', 0, 6], ['Bb5', 6, 2], ['A5', 8, 4], ['G5', 12, 4]],
    [['A5', 0, 12], ['C#6', 12, 4]],
  ],
};

const TRACK_STURMFRONT = {
  name: 'STURMFRONT', sub: 'Main Theme · Electro-Rock', bpm: 148, loopFrom: 1,
  arr: [['intro', 4], ['riff', 8], ['build', 4], ['chorus', 8], ['break', 4], ['riff', 8], ['build', 4], ['chorus2', 8]],
  play(M, t, bar, s, spb) {
    const { name, b } = M.section(this, bar);
    if (name === 'intro') {
      if (s === 0 && b === 0) M.pad(t, SF.padRiff[0], 64 * spb, { v: 0.035, a: 2.5, cut: 700, dry: true });
      if (b < 3 && [0, 3, 6].includes(s)) M.stab(t, SF.stabRiff[0], spb * 2, 0.1 + b * 0.02);
      if (b < 3 && s === 0) M.kick(t, 0.9);
      if (b === 2 && s === 0) M.riser(t, 32 * spb);
      if (b === 3 && s % 2 === 0) M.tom(t, 60 + s * 5, 0.4 + s / 24);
      if (b === 3 && s >= 12) M.snare(t, 0.5 + (s - 12) * 0.15);
      return;
    }
    if (name === 'riff') {
      const ci = Math.floor(b / 2) % 4, root = SF.rootsRiff[ci];
      if (b === 0 && s === 0) M.crash(t);
      if ([0, 3, 8, 10].includes(s) || (b % 2 === 1 && s === 14)) M.kick(t, 1);
      if (s === 4 || s === 12) M.snare(t, 1);
      if (s % 2 === 0) M.hat(t, s % 4 === 2 ? 0.9 : 0.5);
      if (GALLOP.includes(s)) M.bass(t, (s === 7 || s === 15) ? up12(root) : root, spb * 0.95, { v: 0.3, cut: 2000 });
      const stabs = b % 2 === 0 ? [0, 3, 6, 10] : [0, 3, 6, 14];
      if (stabs.includes(s)) M.stab(t, SF.stabRiff[ci], spb * 1.6, 0.11);
      if (s === 0 && b % 2 === 0) M.pad(t, SF.padRiff[ci], 32 * spb, { v: 0.02, cut: 900 });
      return;
    }
    if (name === 'build') {
      const k = b * 16 + s;
      if (b === 0 && s === 0) M.riser(t, 64 * spb);
      if (s % 4 === 0 && b < 3) M.kick(t, 1);
      const every = b < 2 ? 4 : b === 2 ? 2 : 1;
      if (s % every === 0) M.snare(t, 0.25 + (k / 64) * 0.75);
      if (s % 2 === 0 && !(b === 3 && s >= 12)) M.bass(t, 'D2', spb * 1.8, { v: 0.28, cut: 500 + k * 60, cutEnd: 300 });
      return;
    }
    if (name === 'chorus' || name === 'chorus2') {
      const ci = b % 4, root = SF.rootsCh[ci];
      if (s % 4 === 0) M.kick(t, 1, true);
      if (s === 4 || s === 12) M.snare(t, 1);
      M.hat(t, s % 2 ? 0.35 : 0.65);
      if (b % 4 === 0 && s === 0) M.crash(t);
      if (s % 4 !== 0) M.bass(t, s % 4 === 2 ? up12(root) : root, spb * 0.9, { v: 0.3, cut: 2600 });
      if (s === 0) { M.pad(t, SF.padCh[ci], 16 * spb, { v: 0.028, cut: 1800 }); M.stab(t, SF.stabCh[ci], spb * 3, 0.1); }
      M.phrase(t, s, spb, SF.lead[b % 8], (tt, n, d) => M.lead(tt, n, d, { v: 0.085 }));
      if (name === 'chorus2') M.pluck(t, up12(SF.padCh[ci][[0, 1, 2, 3, 2, 1, 2, 3][s % 8]]), { v: 0.035, dec: 0.1 });
      return;
    }
    if (name === 'break') {
      const ci = b % 4, root = SF.rootsRiff[ci];
      if (s === 0) M.kick(t, 1);
      if (s === 8) M.snare(t, 0.9, true);
      if (s % 4 === 2) M.hat(t, 0.4);
      M.pluck(t, up12(SF.padRiff[ci][[0, 1, 2, 3, 2, 1, 0, 1][s % 8]]), { v: 0.05, dec: 0.14 });
      if (s === 0) {
        M.pad(t, SF.padRiff[ci], 16 * spb, { v: 0.035, cut: 1200 });
        M.bass(t, root, 16 * spb, { v: 0.22, dist: false, cut: 700, cutEnd: 200 });
      }
      if (b === 3 && s === 0) M.riser(t, 16 * spb);
    }
  },
};

// ---------------------------------------------------------------- 2) DONNERGIPFEL
// Episch / Hybrid-Orchester: Taikos, Streicher-Ostinato, Bläser, E-Moll, 90 BPM
const DG = {
  roots: ['E2', 'C2', 'G2', 'D2'],
  pads: [['E3', 'G3', 'B3', 'E4'], ['C3', 'E3', 'G3', 'C4'], ['G2', 'B2', 'D3', 'G3'], ['D3', 'F#3', 'A3', 'D4']],
  brass: [
    [['E4', 0, 6], ['G4', 6, 2], ['B4', 8, 8]],
    [['C5', 0, 6], ['B4', 6, 2], ['G4', 8, 8]],
    [['D5', 0, 6], ['B4', 6, 2], ['G4', 8, 4], ['A4', 12, 4]],
    [['F#4', 0, 8], ['A4', 8, 4], ['D5', 12, 4]],
    [['E5', 0, 8], ['D5', 8, 4], ['B4', 12, 4]],
    [['C5', 0, 8], ['E5', 8, 8]],
    [['D5', 0, 4], ['B4', 4, 4], ['G4', 8, 8]],
    [['A4', 0, 8], ['F#4', 8, 8]],
  ],
};
const OSTI = [0, 0, 12, 0, 7, 0, 12, 7, 0, 0, 12, 0, 7, 12, 7, 12];

const TRACK_DONNERGIPFEL = {
  name: 'DONNERGIPFEL', sub: 'Episch · Taiko & Orchester', bpm: 90, loopFrom: 1, gain: 1.6,
  arr: [['intro', 4], ['main', 8], ['brass', 8]],
  play(M, t, bar, s, spb) {
    const { name, b } = M.section(this, bar);
    const ci = b % 4, root = midi(DG.roots[ci]);
    if (s === 0) M.pad(t, DG.pads[ci], 16 * spb, { v: name === 'intro' ? 0.03 : 0.04, a: 0.6, cut: 1300 });
    const ov = name === 'intro' ? 0.02 + b * 0.008 : 0.05;
    M.pluck(t, root + 12 + OSTI[s], { type: 'sawtooth', v: ov * (s % 4 === 0 ? 1.4 : 1), dec: 0.11, cut: 1800, echo: false });
    if (name === 'intro') {
      if (s === 0 || s === 8) M.tom(t, 55, 0.8);
      if (b === 3 && s >= 8 && s % 2 === 0) M.tom(t, 90, 0.6 + s / 30);
      return;
    }
    if ([0, 6, 8, 11, 12].includes(s)) M.tom(t, s === 0 || s === 8 ? 55 : 75, s === 0 ? 1 : 0.7);
    if (b % 4 === 3 && s >= 13) M.tom(t, 120, 0.7);
    if (s === 8) M.snare(t, 0.7, true);
    if (s % 2 === 0) M.hat(t, 0.3);
    if (s === 0 && b % 4 === 0) M.crash(t, 0.7);
    if (s === 0) M.bass(t, root, 16 * spb, { v: 0.2, dist: false, cut: 500, cutEnd: 150, dry: true });
    if (name === 'brass') M.phrase(t, s, spb, DG.brass[b % 8], (tt, n, d) => M.lead(tt, n, d, { v: 0.08, a: 0.08, cut: 1800 }));
  },
};

// ---------------------------------------------------------------- 3) OPEN SPACE
// House, A-Moll, 122 BPM
const OS = {
  roots: ['A1', 'F1', 'D2', 'E2'],
  chords: [['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['D3', 'F3', 'A3', 'C4'], ['E3', 'G#3', 'B3', 'D4']],
  hook: [
    [['E5', 0, 2], ['E5', 3, 1], ['D5', 4, 2], ['C5', 6, 2], ['A4', 8, 4], ['C5', 12, 2], ['D5', 14, 2]],
    [['E5', 0, 4], ['F5', 4, 2], ['E5', 6, 2], ['C5', 8, 8]],
    [['D5', 0, 2], ['D5', 3, 1], ['C5', 4, 2], ['A4', 6, 2], ['F4', 8, 4], ['A4', 12, 4]],
    [['G#4', 0, 4], ['B4', 4, 4], ['D5', 8, 4], ['E5', 12, 4]],
  ],
};
const TRACK_OPENSPACE = {
  name: 'OPEN SPACE', sub: 'House · Büro-Groove', bpm: 122, loopFrom: 1, gain: 1.15,
  arr: [['intro', 4], ['groove', 8], ['hook', 8]],
  play(M, t, bar, s, spb) {
    const { name, b } = M.section(this, bar);
    const ci = b % 4, root = midi(OS.roots[ci]);
    if (s % 4 === 0) M.kick(t, 1, true);
    if (s % 4 === 2) M.hat(t, 0.7, true);
    if (name === 'intro') {
      if (s === 0) M.pad(t, OS.chords[ci], 16 * spb, { v: 0.03, cut: 600 + b * 250 });
      if (b === 3 && s === 0) M.riser(t, 16 * spb);
      return;
    }
    if (s === 4 || s === 12) M.clap(t, 1);
    M.hat(t, s % 2 ? 0.15 : 0.25);
    if (s % 4 === 2) M.bass(t, root + 12 + (s === 14 ? 7 : 0), spb * 1.6, { v: 0.3, dist: false, type: 'square', cut: 1100, cutEnd: 300, q: 8 });
    if (s === 3 || s === 10) OS.chords[ci].forEach(n => M.pluck(t, n, { type: 'sawtooth', v: 0.028, dec: 0.22, cut: 2600 }));
    if (s === 0 && b === 0) M.crash(t, 0.6);
    if (name === 'hook') M.phrase(t, s, spb, OS.hook[ci], (tt, n, d) => M.lead(tt, n, d, { type: 'square', v: 0.06, cut: 2600 }));
  },
};

// ---------------------------------------------------------------- 4) NEON DOJO
// Synthwave, Fis-Moll, 104 BPM
const ND = {
  roots: ['F#2', 'D2', 'A1', 'E2'],
  chords: [['F#3', 'A3', 'C#4'], ['D3', 'F#3', 'A3'], ['A2', 'C#3', 'E3'], ['E3', 'G#3', 'B3']],
  lead: [
    [['C#5', 0, 8], ['A4', 8, 4], ['B4', 12, 4]],
    [['A4', 0, 8], ['F#4', 8, 8]],
    [['E5', 0, 8], ['C#5', 8, 4], ['B4', 12, 4]],
    [['B4', 0, 12], ['G#4', 12, 4]],
    [['C#5', 0, 8], ['A4', 8, 4], ['B4', 12, 4]],
    [['D5', 0, 8], ['C#5', 8, 4], ['A4', 12, 4]],
    [['E5', 0, 4], ['F#5', 4, 4], ['E5', 8, 8]],
    [['G#5', 0, 8], ['E5', 8, 8]],
  ],
};
const TRACK_NEONDOJO = {
  name: 'NEON DOJO', sub: 'Synthwave · Nachtstimmung', bpm: 104, loopFrom: 1, gain: 1.35,
  arr: [['intro', 4], ['verse', 8], ['lead', 8]],
  play(M, t, bar, s, spb) {
    const { name, b } = M.section(this, bar);
    const ci = b % 4, root = midi(ND.roots[ci]), ch = ND.chords[ci];
    if (s === 0) M.pad(t, [...ch, up12(ch[0])], 16 * spb, { v: 0.035, a: 0.4, cut: 2000 });
    M.pluck(t, up12(ch[[0, 1, 2, 1][s % 4]]), { type: 'triangle', v: 0.05, dec: 0.18 });
    if (name === 'intro') { if (s === 0 && b >= 2) M.kick(t, 0.9); return; }
    if (s === 0 || s === 8 || (b % 2 === 1 && s === 10)) M.kick(t, 1);
    if (s === 4 || s === 12) M.snare(t, 0.9, true);
    if (s % 2 === 0) M.hat(t, 0.4);
    if (s % 2 === 0) M.bass(t, s % 4 === 0 ? root : root + 12, spb * 1.8, { v: 0.28, dist: false, cut: 1300, cutEnd: 350 });
    if (name === 'lead') M.phrase(t, s, spb, ND.lead[b % 8], (tt, n, d) => M.lead(tt, n, d, { v: 0.075, cut: 2600, a: 0.04 }));
  },
};

const TRACKS = [TRACK_STURMFRONT, TRACK_DONNERGIPFEL, TRACK_OPENSPACE, TRACK_NEONDOJO];
