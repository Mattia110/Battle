'use strict';
// ===================== MUSIK-ENGINE (WebAudio-Synthesizer + Sequencer) =====================
// Alle Tracks werden live synthetisiert – keine Audiodateien nötig.

const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function midi(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(n);
  return NOTE_IDX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
}
function mtof(n) { return 440 * Math.pow(2, (midi(n) - 69) / 12); }

const Music = {
  ctx: null, master: null, pump: null, delay: null, noiseBuf: null, curve: null,
  track: null, trackIdx: -1, step: 0, nextTime: 0, timer: null, vol: 0.32, muted: false,

  init() {
    Sfx.init();
    const c = Sfx.ctx;
    if (!c) return false;
    if (c.state === 'suspended' && !(window.OfflineAudioContext && c instanceof OfflineAudioContext)) { const p = c.resume(); if (p && p.catch) p.catch(() => {}); }
    if (this.ctx) return true;
    this.ctx = c;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : this.vol;
    this.master.connect(comp); comp.connect(c.destination);
    this.pump = c.createGain(); this.pump.connect(this.master);
    // Delay (für Leads/Arps)
    this.delay = c.createDelay(1);
    const fb = c.createGain(); fb.gain.value = 0.32;
    const dl = c.createGain(); dl.gain.value = 0.3;
    this.delay.connect(fb); fb.connect(this.delay); this.delay.connect(dl); dl.connect(this.master);
    // Rauschen + Verzerrungskurve
    const n = c.sampleRate * 2; this.noiseBuf = c.createBuffer(1, n, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    this.curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; this.curve[i] = Math.tanh(x * 6) * 0.9; }
    return true;
  },

  // gewünschten Track setzen (-1 = aus). Startet erst, wenn Audio erlaubt ist (nach erstem Tastendruck).
  want: -1,
  sync() {
    if (!Sfx.ctx) return;
    if (this.want === this.trackIdx) return;
    this.stop();
    if (this.want < 0 || !TRACKS[this.want] || !this.init()) return;
    this.trackIdx = this.want;
    this.track = TRACKS[this.want];
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.12;
    this.delay.delayTime.value = (60 / this.track.bpm) * 0.75;
    if (!this.muted) this.master.gain.setTargetAtTime(this.vol * (this.track.gain || 1), this.ctx.currentTime, 0.05);
    this.timer = setInterval(() => this.schedule(), 25);
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null; this.track = null; this.trackIdx = -1;
  },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol * ((this.track && this.track.gain) || 1), this.ctx.currentTime, 0.05);
  },
  schedule() {
    if (!this.track) return;
    const spb = 60 / this.track.bpm / 4; // Sekunden pro 16tel
    while (this.nextTime < this.ctx.currentTime + 0.15) {
      const bar = Math.floor(this.step / 16), s = this.step % 16;
      try { this.track.play(this, this.nextTime, bar, s, spb); } catch (e) { /* ein Step darf nie das Spiel stoppen */ }
      this.nextTime += spb; this.step++;
    }
  },

  // Arrangement: [['intro',4],['riff',8],...], loopFrom = Index, ab dem wiederholt wird
  section(track, bar) {
    const arr = track.arr;
    let total = 0; for (const [, l] of arr) total += l;
    let start = 0; for (let i = 0; i < track.loopFrom; i++) start += arr[i][1];
    if (bar >= total) bar = start + (bar - total) % (total - start);
    let acc = 0;
    for (const [name, l] of arr) { if (bar < acc + l) return { name, b: bar - acc, len: l }; acc += l; }
    return { name: arr[0][0], b: 0, len: arr[0][1] };
  },

  // ---------- Bausteine ----------
  env(g, t, a, peak, dec, sus = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec);
  },
  noiseSrc(t, dur) {
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    s.start(t, Math.random()); s.stop(t + dur); return s;
  },
  duck(t, depth = 0.3, rel = 0.2) {
    const g = this.pump.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(depth, t); g.linearRampToValueAtTime(1, t + rel);
  },

  // ---------- Drums ----------
  kick(t, v = 1, pumpIt = false) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.4);
    const n = this.noiseSrc(t, 0.02), ng = c.createGain(); ng.gain.value = 0.25 * v;
    n.connect(ng); ng.connect(this.master);
    if (pumpIt) this.duck(t);
  },
  snare(t, v = 1, long = false) {
    const c = this.ctx, n = this.noiseSrc(t, long ? 0.6 : 0.25), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.7 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + (long ? 0.55 : 0.2));
    n.connect(f); f.connect(g); g.connect(this.master);
    const o = c.createOscillator(), og = c.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    og.gain.setValueAtTime(0.5 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(og); og.connect(this.master); o.start(t); o.stop(t + 0.12);
  },
  clap(t, v = 1) {
    const c = this.ctx, f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 1.2;
    [0, 0.012, 0.024].forEach(d => { const n = this.noiseSrc(t + d, 0.15); n.connect(f); });
    g.gain.setValueAtTime(0.6 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    f.connect(g); g.connect(this.master);
  },
  hat(t, v = 1, open = false) {
    const c = this.ctx, n = this.noiseSrc(t, open ? 0.3 : 0.06), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'highpass'; f.frequency.value = 7500;
    g.gain.setValueAtTime(0.22 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.25 : 0.05));
    n.connect(f); f.connect(g); g.connect(this.master);
  },
  crash(t, v = 1) {
    const c = this.ctx, n = this.noiseSrc(t, 1.8), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'highpass'; f.frequency.value = 4200;
    g.gain.setValueAtTime(0.28 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    n.connect(f); f.connect(g); g.connect(this.master);
  },
  tom(t, freq = 90, v = 1) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.35);
    g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + 0.6);
    const n = this.noiseSrc(t, 0.08), f = c.createBiquadFilter(), ng = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 900; ng.gain.value = 0.35 * v;
    n.connect(f); f.connect(ng); ng.connect(this.master);
  },
  impact(t) {
    this.kick(t, 1.3); this.crash(t, 1.2);
    const c = this.ctx, n = this.noiseSrc(t, 1.5), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'lowpass'; f.frequency.value = 400;
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    n.connect(f); f.connect(g); g.connect(this.master);
  },
  riser(t, dur) {
    const c = this.ctx, n = this.noiseSrc(t, dur), f = c.createBiquadFilter(), g = c.createGain();
    f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + dur);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.35, t + dur);
    n.connect(f); f.connect(g); g.connect(this.master);
  },

  // ---------- Synths ----------
  // Verzerrter Saw-Bass
  bass(t, note, dur, opt = {}) {
    const c = this.ctx, f0 = mtof(note), out = c.createGain();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = opt.q || 6;
    lp.frequency.setValueAtTime(opt.cut || 2400, t); lp.frequency.exponentialRampToValueAtTime(opt.cutEnd || 320, t + dur * 0.9);
    [-8, 8].forEach(det => {
      const o = c.createOscillator(); o.type = opt.type || 'sawtooth'; o.frequency.value = f0; o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
    const sub = c.createOscillator(); sub.frequency.value = f0 / 2; const sg = c.createGain(); sg.gain.value = 0.5;
    sub.connect(sg); sg.connect(out); sub.start(t); sub.stop(t + dur + 0.05);
    if (opt.dist !== false) { const ws = c.createWaveShaper(); ws.curve = this.curve; lp.connect(ws); ws.connect(out); }
    else lp.connect(out);
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime((opt.v || 0.35), t + 0.005);
    out.gain.setValueAtTime(opt.v || 0.35, t + dur * 0.85); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(opt.dry ? this.master : this.pump);
  },
  // Flächen / Akkorde
  pad(t, notes, dur, opt = {}) {
    const c = this.ctx, out = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = opt.cut || 1400;
    notes.forEach(n => [-10, 10].forEach(det => {
      const o = c.createOscillator(); o.type = opt.type || 'sawtooth'; o.frequency.value = mtof(n); o.detune.value = det;
      o.connect(lp); o.start(t); o.stop(t + dur + 0.6);
    }));
    lp.connect(out);
    const v = (opt.v || 0.05);
    out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(v, t + (opt.a || 0.25));
    out.gain.setValueAtTime(v, t + dur); out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    out.connect(opt.dry ? this.master : this.pump);
  },
  // Power-Chord-Stab (verzerrt)
  stab(t, notes, dur, v = 0.16) {
    const c = this.ctx, out = c.createGain(), lp = c.createBiquadFilter(), ws = c.createWaveShaper();
    ws.curve = this.curve; lp.type = 'lowpass'; lp.frequency.setValueAtTime(4200, t); lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    notes.forEach(n => ['sawtooth', 'square'].forEach((tp, i) => {
      const o = c.createOscillator(); o.type = tp; o.frequency.value = mtof(n); o.detune.value = i ? 6 : -6;
      o.connect(ws); o.start(t); o.stop(t + dur + 0.05);
    }));
    ws.connect(lp); lp.connect(out);
    out.gain.setValueAtTime(v, t); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(this.master);
  },
  // Lead mit Vibrato + Delay
  lead(t, note, dur, opt = {}) {
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = opt.type || 'sawtooth'; o2.type = 'square';
    o.frequency.value = mtof(note); o2.frequency.value = mtof(note); o2.detune.value = 7;
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 0;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(note) * 0.012, t + Math.min(dur, 0.35));
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
    lp.type = 'lowpass'; lp.frequency.value = opt.cut || 3200;
    o.connect(lp); o2.connect(lp); lp.connect(g);
    const v = opt.v || 0.09;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (opt.a || 0.015));
    g.gain.setValueAtTime(v, t + dur * 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
    g.connect(this.master); g.connect(this.delay);
    [o, o2, lfo].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
  },
  // kurzer Pluck (Arpeggios, Ostinati)
  pluck(t, note, opt = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = opt.type || 'square'; o.frequency.value = mtof(note);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(opt.cut || 3500, t); lp.frequency.exponentialRampToValueAtTime(400, t + (opt.dec || 0.16));
    const v = opt.v || 0.07;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (opt.dec || 0.16) + 0.04);
    o.connect(lp); lp.connect(g); g.connect(opt.dry ? this.master : this.pump);
    if (opt.echo !== false) g.connect(this.delay);
    o.start(t); o.stop(t + (opt.dec || 0.16) + 0.06);
  },

  // Melodie-Hilfe: Liste [Note, Start16, Länge16] eines Takts abspielen
  phrase(t, s, spb, notes, fn) {
    for (const [n, st, len] of notes) if (st === s && n) fn(t, n, len * spb);
  },
};
// Browser erlauben Audio erst nach einer Nutzeraktion -> beim ersten Tastendruck starten
window.addEventListener('keydown', () => { Sfx.init(); Music.sync(); });
