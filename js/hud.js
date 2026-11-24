'use strict';
// ===================== SOUND (WebAudio, synthetisch) =====================
const Sfx = {
  ctx: null, on: true,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; }
  },
  noise(dur, freq, type, vol) {
    const c = this.ctx, n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(c.destination); src.start();
  },
  tone(type, f1, f2, dur, vol) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
  },
  play(name) {
    if (!this.on || !this.ctx) return;
    try {
      switch (name) {
        case 'hit': this.noise(0.09, 1800, 'lowpass', 0.5); this.tone('sine', 180, 60, 0.1, 0.4); break;
        case 'heavy': this.noise(0.18, 1200, 'lowpass', 0.7); this.tone('sine', 120, 40, 0.25, 0.6); break;
        case 'block': this.noise(0.05, 2500, 'highpass', 0.35); break;
        case 'zap': this.tone('sawtooth', 900, 120, 0.28, 0.18); this.noise(0.25, 4000, 'highpass', 0.25); break;
        case 'heat': this.tone('square', 200, 900, 0.4, 0.12); this.tone('sawtooth', 100, 400, 0.5, 0.1); break;
        case 'beam': this.tone('sawtooth', 1200, 80, 0.6, 0.2); this.noise(0.5, 3000, 'bandpass', 0.3); break;
        case 'grab': this.noise(0.06, 800, 'lowpass', 0.4); break;
        case 'land': this.noise(0.15, 500, 'lowpass', 0.6); break;
        case 'step': this.noise(0.04, 900, 'lowpass', 0.25); break;
        case 'ko': this.tone('sine', 300, 50, 1.2, 0.5); this.noise(0.6, 900, 'lowpass', 0.6); break;
        case 'bell': this.tone('triangle', 880, 860, 0.6, 0.25); break;
      }
    } catch (e) { /* Audio-Fehler ignorieren */ }
  },
};
window.addEventListener('keydown', () => Sfx.init());

// ===================== HUD =====================
function drawHUD(ctx, W) {
  const [a, b] = G.p;
  drawBar(ctx, a, 60, 40, 500, false);
  drawBar(ctx, b, W - 560, 40, 500, true);

  // Timer
  const sec = isFinite(G.timer) ? Math.ceil(G.timer / 60) : Infinity;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(W / 2 - 46, 26, 92, 62);
  ctx.font = '900 46px Impact, "Arial Black", sans-serif';
  ctx.fillStyle = sec <= 10 ? '#ff5050' : '#fff';
  ctx.fillText(isFinite(sec) ? String(Math.max(0, sec)) : '∞', W / 2, 76);

  // Combo-Anzeige
  if (G.combo && G.combo.t > 0) {
    const c = G.combo, x = c.idx === 0 ? 70 : W - 70;
    ctx.textAlign = c.idx === 0 ? 'left' : 'right';
    ctx.globalAlpha = Math.min(1, c.t / 15);
    ctx.font = '900 italic 46px Impact, "Arial Black", sans-serif';
    ctx.lineWidth = 6; ctx.strokeStyle = '#000';
    ctx.strokeText(c.n + ' HITS', x, 210); ctx.fillStyle = '#ffd23a'; ctx.fillText(c.n + ' HITS', x, 210);
    ctx.font = '700 20px Arial, sans-serif';
    ctx.strokeText(c.dmg + ' Schaden', x, 236); ctx.fillStyle = '#fff'; ctx.fillText(c.dmg + ' Schaden', x, 236);
    ctx.globalAlpha = 1;
  }
}

function drawBar(ctx, f, x, y, w, right) {
  const h = 26;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#3a0a0a'; ctx.fillRect(x, y, w, h);
  const r = f.hp / MAX_HP, rd = f.dispHp / MAX_HP;
  // nachlaufender Schaden
  ctx.fillStyle = '#e8e8e8';
  if (right) ctx.fillRect(x, y, w * rd, h); else ctx.fillRect(x + w * (1 - rd), y, w * rd, h);
  // aktuelle HP
  const pulse = 0.5 + 0.5 * Math.sin(G.time * 0.3);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  if (f.rage) { g.addColorStop(0, `rgb(255,${60 + pulse * 60},${40})`); g.addColorStop(1, '#8a0000'); }
  else { g.addColorStop(0, '#ffe25a'); g.addColorStop(1, '#d08a00'); }
  ctx.fillStyle = g;
  if (right) ctx.fillRect(x, y, w * r, h); else ctx.fillRect(x + w * (1 - r), y, w * r, h);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);

  // Name
  ctx.font = '900 italic 26px Impact, "Arial Black", sans-serif';
  ctx.textAlign = right ? 'right' : 'left';
  ctx.lineWidth = 5; ctx.strokeStyle = '#000';
  const nx = right ? x + w : x;
  ctx.strokeText(f.ch.name, nx, y + h + 30); ctx.fillStyle = '#fff'; ctx.fillText(f.ch.name, nx, y + h + 30);

  // Rundensiege
  for (let i = 0; i < 2; i++) {
    const cx = right ? x + 16 + i * 26 : x + w - 16 - i * 26;
    ctx.beginPath(); ctx.arc(cx, y + h + 20, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < f.wins ? '#ffd23a' : 'rgba(0,0,0,0.6)'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  }

  // Surge-Anzeige (Heat)
  const sy = y + h + 42, sw = 180, sx = right ? x + w - sw : x;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(sx, sy, sw, 12);
  let fill = 0, col = '#555';
  if (f.heatOn) { fill = f.heat / HEAT_TIME; col = f.colors.elec; }
  else if (f.heatReady) { fill = 1; col = f.colors.elec; }
  ctx.fillStyle = col;
  if (f.heatReady && !f.heatOn) ctx.globalAlpha = 0.45 + 0.35 * pulse;
  if (right) ctx.fillRect(sx + sw * (1 - fill), sy, sw * fill, 12); else ctx.fillRect(sx, sy, sw * fill, 12);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1; ctx.strokeRect(sx, sy, sw, 12);
  ctx.font = '700 13px Arial, sans-serif'; ctx.fillStyle = '#fff';
  ctx.textAlign = right ? 'right' : 'left';
  const label = f.heatOn ? 'SURGE AKTIV' : f.heatReady ? 'SURGE BEREIT (2+3)' : 'SURGE VERBRAUCHT';
  ctx.fillText(label + (f.rage ? '   RAGE (df+1+2)' : ''), right ? sx + sw : sx, sy + 28);
}

function drawBanner(ctx, W, H, text, sub, color = '#fff', size = 96) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `900 italic ${size}px Impact, "Arial Black", sans-serif`;
  ctx.lineWidth = 10; ctx.strokeStyle = '#000';
  ctx.strokeText(text, W / 2, H / 2 - 20);
  ctx.fillStyle = color; ctx.fillText(text, W / 2, H / 2 - 20);
  if (sub) {
    ctx.font = '700 26px Arial, sans-serif'; ctx.lineWidth = 5;
    ctx.strokeText(sub, W / 2, H / 2 + 30); ctx.fillStyle = '#fff'; ctx.fillText(sub, W / 2, H / 2 + 30);
  }
  ctx.restore();
}
