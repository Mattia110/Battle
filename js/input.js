'use strict';
// ===================== INPUT =====================
const Keys = { held: new Set() };

const KEYMAPS = [
  { // Spieler 1
    up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
    b1: ['KeyF'], b2: ['KeyG'], b3: ['KeyV'], b4: ['KeyB'],
  },
  { // Spieler 2
    up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
    b1: ['Numpad4', 'KeyO'], b2: ['Numpad5', 'KeyP'], b3: ['Numpad1', 'KeyL'], b4: ['Numpad2', 'Semicolon'],
  },
];

const GAME_KEYS = new Set(['Enter', 'Escape', 'Space', 'KeyM']);
KEYMAPS.forEach(m => Object.values(m).forEach(arr => arr.forEach(c => GAME_KEYS.add(c))));

window.addEventListener('keydown', e => {
  if (GAME_KEYS.has(e.code)) e.preventDefault();
  Keys.held.add(e.code);
});
window.addEventListener('keyup', e => Keys.held.delete(e.code));
window.addEventListener('blur', () => Keys.held.clear());

// Richtungen in Numpad-Notation, relativ zur Blickrichtung:
// 7 8 9      7=ub 8=u 9=uf
// 4 5 6      4=b  5=n 6=f
// 1 2 3      1=db 2=d 3=df
class InputReader {
  constructor(map) {
    this.map = map;
    this.hist = [];
    this.prevBtn = [false, false, false, false];
  }
  any(codes) { return codes.some(c => Keys.held.has(c)); }

  sample(facing) {
    const m = this.map;
    let h = (this.any(m.right) ? 1 : 0) - (this.any(m.left) ? 1 : 0);
    const v = (this.any(m.up) ? 1 : 0) - (this.any(m.down) ? 1 : 0);
    h *= facing;
    const dir = 5 + h + v * 3;
    const btn = [1, 2, 3, 4].map(i => this.any(m['b' + i]));
    const press = btn.map((b, i) => b && !this.prevBtn[i]);
    this.prevBtn = btn;
    const rec = { dir, btn, press };
    this.hist.push(rec);
    if (this.hist.length > 90) this.hist.shift();
    return rec;
  }

  get cur() { return this.hist[this.hist.length - 1] || { dir: 5, btn: [false, false, false, false], press: [false, false, false, false] }; }

  // Wurde Knopf (1-4) in den letzten n Frames gedrückt?
  pressedWithin(b, n) {
    const H = this.hist;
    for (let k = H.length - 1; k >= 0 && H.length - 1 - k < n; k--) if (H[k].press[b - 1]) return true;
    return false;
  }
  anyPress() { return this.cur.press.some(Boolean); }

  // Knopf-Kombination (z.B. [1,2]) – mindestens einer jetzt gedrückt, alle innerhalb von 3 Frames, alle gehalten
  chord(bs) {
    const c = this.cur;
    if (!bs.some(b => c.press[b - 1])) return false;
    return bs.every(b => c.btn[b - 1] && this.pressedWithin(b, 3));
  }

  // Komprimierte Richtungs-Historie (neueste zuerst)
  segs(maxBack) {
    const out = [], H = this.hist;
    for (let k = H.length - 1; k >= 0 && H.length - 1 - k < maxBack; k--) {
      const d = H[k].dir;
      if (out.length && out[out.length - 1].dir === d) out[out.length - 1].len++;
      else out.push({ dir: d, len: 1 });
    }
    return out;
  }

  // f,n,d,df  -> gibt Anzahl Frames seit df zurück (0 = exakt gleicher Frame) oder -1
  // Tolerant wie in Tekken: zwischen f und d dürfen n oder df liegen (Tastatur: f, df, d, df),
  // d darf auch kurz db sein. Von f bis df max. 30 Frames.
  motionFNDDF() {
    const s = this.segs(45);
    if (!s[0] || s[0].dir !== 3) return -1;
    let k = 1, frames = 0;
    if (!s[k] || (s[k].dir !== 2 && s[k].dir !== 1)) return -1;
    while (s[k] && (s[k].dir === 2 || s[k].dir === 1)) { frames += s[k].len; k++; }
    while (s[k] && (s[k].dir === 5 || s[k].dir === 3 || s[k].dir === 2) && k < 7) { frames += s[k].len; k++; }
    if (!s[k] || s[k].dir !== 6) return -1;
    if (frames > 30) return -1;
    return s[0].len - 1;
  }

  // f,n,d (Crouch Dash) – gerade auf d gewechselt (auch f, df, d)
  motionFND() {
    const s = this.segs(20);
    if (!s[0] || s[0].dir !== 2 || s[0].len !== 1) return false;
    let k = 1;
    while (s[k] && (s[k].dir === 5 || s[k].dir === 3) && k < 4) k++;
    return !!(s[k] && s[k].dir === 6);
  }

  // Wavedash-Fortsetzung: df (oder f), n, d – gerade auf d gewechselt
  motionWave() {
    const s = this.segs(20);
    if (!s[0] || s[0].dir !== 2 || s[0].len !== 1) return false;
    return !!(s[1] && s[1].dir === 5 && s[1].len <= 10 && s[2] && (s[2].dir === 3 || s[2].dir === 6) && s[2].len <= 14);
  }

  doubleTap(d) {
    const s = this.segs(24);
    return !!(s[0] && s[0].dir === d && s[0].len === 1 && s[1] && s[1].dir === 5 && s[1].len <= 10 && s[2] && s[2].dir === d && s[2].len <= 12);
  }
}
