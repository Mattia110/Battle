'use strict';
// ===================== POSEN =====================
// Koordinaten: Blick nach rechts, Ursprung = Boden zwischen den Füßen, y nach oben
// hip, neck, head, fe/fh = vorderer Ellbogen/Hand, be/bh = hinterer, fk/ff = vorderes Knie/Fuß, bk/bf = hinteres
const POSES = {
  idle:      { hip: [0, 95], neck: [6, 160], head: [10, 182], fe: [30, 135], fh: [44, 158], be: [12, 128], bh: [28, 150], fk: [22, 52], ff: [26, 0], bk: [-14, 50], bf: [-26, 0] },
  crouch:    { hip: [0, 55], neck: [14, 112], head: [22, 132], fe: [36, 92], fh: [46, 112], be: [18, 85], bh: [34, 104], fk: [30, 40], ff: [24, 0], bk: [-20, 28], bf: [-24, 0] },
  crouchwind:{ hip: [0, 52], neck: [18, 106], head: [28, 124], fe: [36, 92], fh: [44, 110], be: [10, 70], bh: [24, 44], fk: [30, 40], ff: [26, 0], bk: [-20, 26], bf: [-26, 0] },
  jab:       { hip: [2, 95], neck: [10, 160], head: [14, 182], fe: [46, 156], fh: [84, 160], be: [14, 130], bh: [30, 150], fk: [22, 52], ff: [26, 0], bk: [-14, 50], bf: [-26, 0] },
  cross:     { hip: [4, 95], neck: [16, 158], head: [22, 180], fe: [20, 140], fh: [34, 158], be: [48, 152], bh: [88, 158], fk: [24, 52], ff: [32, 0], bk: [-18, 48], bf: [-30, 0] },
  midpunch:  { hip: [6, 88], neck: [22, 148], head: [30, 168], fe: [54, 130], fh: [88, 124], be: [18, 120], bh: [34, 138], fk: [32, 50], ff: [40, 0], bk: [-14, 46], bf: [-32, 0] },
  uppercut:  { hip: [4, 100], neck: [14, 168], head: [16, 190], fe: [28, 150], fh: [42, 152], be: [36, 172], bh: [46, 216], fk: [24, 54], ff: [28, 0], bk: [-14, 52], bf: [-24, 0] },
  wgf:       { hip: [10, 100], neck: [26, 166], head: [32, 188], fe: [22, 140], fh: [32, 152], be: [50, 178], bh: [64, 222], fk: [36, 52], ff: [44, 0], bk: [-12, 48], bf: [-30, 0] },
  highkick:  { hip: [-4, 100], neck: [-22, 158], head: [-28, 178], fe: [-6, 134], fh: [6, 150], be: [-30, 140], bh: [-36, 120], fk: [36, 138], ff: [86, 168], bk: [-6, 50], bf: [-10, 0] },
  midkick:   { hip: [-2, 98], neck: [-14, 160], head: [-18, 182], fe: [6, 138], fh: [20, 152], be: [-20, 140], bh: [-24, 118], fk: [38, 100], ff: [86, 104], bk: [-6, 50], bf: [-10, 0] },
  lowkick:   { hip: [-4, 55], neck: [6, 110], head: [12, 130], fe: [24, 90], fh: [34, 108], be: [6, 84], bh: [20, 100], fk: [32, 30], ff: [80, 8], bk: [-24, 26], bf: [-26, 0] },
  cjab:      { hip: [2, 55], neck: [18, 108], head: [26, 128], fe: [52, 102], fh: [86, 104], be: [22, 84], bh: [36, 100], fk: [30, 40], ff: [24, 0], bk: [-20, 28], bf: [-24, 0] },
  cpunch:    { hip: [6, 50], neck: [26, 100], head: [36, 116], fe: [30, 84], fh: [40, 100], be: [54, 72], bh: [90, 60], fk: [36, 38], ff: [32, 0], bk: [-22, 26], bf: [-30, 0] },
  clowkick:  { hip: [-4, 52], neck: [4, 108], head: [10, 128], fe: [26, 92], fh: [38, 108], be: [8, 84], bh: [22, 100], fk: [38, 28], ff: [84, 10], bk: [-22, 26], bf: [-24, 0] },
  sweep:     { hip: [-10, 40], neck: [-30, 90], head: [-40, 106], fe: [-2, 40], fh: [-10, 8], be: [-40, 70], bh: [-50, 50], fk: [32, 24], ff: [92, 6], bk: [-30, 16], bf: [-20, 0] },
  splits:    { hip: [0, 130], neck: [4, 196], head: [6, 218], fe: [24, 176], fh: [40, 192], be: [-14, 178], bh: [-20, 156], fk: [40, 160], ff: [70, 210], bk: [-30, 112], bf: [-62, 104] },
  hopkick:   { hip: [0, 140], neck: [-10, 200], head: [-12, 222], fe: [10, 178], fh: [24, 192], be: [-20, 182], bh: [-24, 162], fk: [38, 170], ff: [64, 222], bk: [22, 112], bf: [32, 80] },
  hammerUp:  { hip: [-2, 98], neck: [0, 162], head: [2, 184], fe: [16, 196], fh: [12, 230], be: [8, 194], bh: [2, 228], fk: [24, 52], ff: [30, 0], bk: [-18, 50], bf: [-30, 0] },
  hammer:    { hip: [8, 86], neck: [28, 144], head: [38, 162], fe: [54, 138], fh: [84, 106], be: [46, 140], bh: [78, 102], fk: [36, 48], ff: [52, 0], bk: [-22, 44], bf: [-38, 0] },
  pawwind:   { hip: [-4, 92], neck: [-12, 154], head: [-10, 176], fe: [-10, 136], fh: [-30, 140], be: [-24, 132], bh: [-44, 136], fk: [22, 50], ff: [30, 0], bk: [-22, 46], bf: [-34, 0] },
  paw:       { hip: [8, 92], neck: [26, 152], head: [34, 172], fe: [58, 148], fh: [94, 140], be: [52, 140], bh: [90, 130], fk: [34, 50], ff: [52, 0], bk: [-20, 46], bf: [-38, 0] },
  grab:      { hip: [6, 95], neck: [20, 158], head: [26, 178], fe: [50, 150], fh: [78, 146], be: [46, 142], bh: [74, 138], fk: [28, 52], ff: [36, 0], bk: [-18, 48], bf: [-30, 0] },
  heatburst: { hip: [0, 100], neck: [4, 166], head: [6, 190], fe: [40, 182], fh: [62, 212], be: [-30, 182], bh: [-52, 210], fk: [30, 50], ff: [46, 0], bk: [-30, 50], bf: [-46, 0] },
  beam:      { hip: [2, 96], neck: [14, 160], head: [18, 182], fe: [44, 152], fh: [78, 152], be: [40, 146], bh: [76, 148], fk: [28, 52], ff: [38, 0], bk: [-22, 48], bf: [-36, 0] },
  block:     { hip: [-2, 95], neck: [2, 158], head: [4, 178], fe: [24, 150], fh: [20, 180], be: [16, 140], bh: [14, 170], fk: [22, 52], ff: [26, 0], bk: [-14, 50], bf: [-26, 0] },
  cblock:    { hip: [0, 55], neck: [10, 112], head: [16, 132], fe: [30, 106], fh: [26, 134], be: [20, 98], bh: [18, 126], fk: [30, 40], ff: [24, 0], bk: [-20, 28], bf: [-24, 0] },
  hit:       { hip: [-6, 95], neck: [-24, 154], head: [-34, 172], fe: [-6, 132], fh: [4, 112], be: [-26, 130], bh: [-20, 108], fk: [14, 50], ff: [16, 0], bk: [-20, 48], bf: [-30, 0] },
  crumple:   { hip: [4, 60], neck: [20, 108], head: [30, 120], fe: [30, 80], fh: [36, 50], be: [14, 76], bh: [20, 46], fk: [30, 34], ff: [20, 0], bk: [-10, 30], bf: [-24, 0] },
  air:       { hip: [0, 40], neck: [-60, 52], head: [-84, 58], fe: [-50, 72], fh: [-40, 94], be: [-60, 30], bh: [-48, 12], fk: [30, 60], ff: [70, 52], bk: [34, 30], bf: [72, 32] },
  down:      { hip: [0, 12], neck: [-62, 14], head: [-86, 16], fe: [-46, 28], fh: [-30, 8], be: [-60, 6], bh: [-40, 2], fk: [34, 26], ff: [72, 8], bk: [36, 8], bf: [74, 4] },
  splat:     { hip: [-6, 100], neck: [-14, 162], head: [-16, 184], fe: [-20, 150], fh: [-24, 186], be: [-22, 130], bh: [-26, 100], fk: [8, 54], ff: [4, 0], bk: [-12, 52], bf: [-16, 0] },
  win:       { hip: [0, 95], neck: [4, 160], head: [6, 182], fe: [24, 140], fh: [30, 168], be: [-10, 130], bh: [-20, 112], fk: [26, 52], ff: [36, 0], bk: [-26, 50], bf: [-38, 0] },
};
const JOINTS = ['hip', 'neck', 'head', 'fe', 'fh', 'be', 'bh', 'fk', 'ff', 'bk', 'bf'];

function lerpPose(a, b, t) {
  const o = {};
  for (const j of JOINTS) o[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
  return o;
}
function walkPose(phase, crouch) {
  const p = lerpPose(POSES.idle, POSES.idle, 0);
  const s = Math.sin(phase), c = Math.cos(phase);
  p.ff = [26 + s * 14, Math.max(0, c * 8)];
  p.fk = [22 + s * 8, 52 + Math.max(0, c * 6)];
  p.bf = [-26 - s * 14, Math.max(0, -c * 8)];
  p.bk = [-14 - s * 8, 50 + Math.max(0, -c * 6)];
  return p;
}

// ===================== EFFEKTE =====================
const FX = {
  parts: [], texts: [], bolts: [], beams: [], shake: 0, flash: 0, flashColor: '#fff', darken: 0,
  clear() { this.parts = []; this.texts = []; this.bolts = []; this.beams = []; this.shake = 0; this.flash = 0; this.darken = 0; },
  spark(x, y, color, n = 12, spd = 7) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = spd * (0.3 + Math.random());
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 14 + Math.random() * 10, max: 24, color, size: 2 + Math.random() * 3 });
    }
  },
  ring(x, y, color, r = 60) { this.parts.push({ ring: true, x, y, r: 6, rmax: r, life: 14, max: 14, color }); },
  bolt(x1, y1, x2, y2, color, life = 10, width = 3) { this.bolts.push({ x1, y1, x2, y2, color, life, max: life, width }); },
  burstBolts(x, y, color, n = 6, len = 90) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, l = len * (0.5 + Math.random() * 0.7);
      this.bolt(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, color, 8 + Math.random() * 8, 2 + Math.random() * 2);
    }
  },
  text(str, x, y, color, size = 28, life = 50) { this.texts.push({ str, x, y, color, size, life, max: life }); },
  beam(x, y, dir, color, life = 20) { this.beams.push({ x, y, dir, color, life, max: life }); },

  update() {
    for (const p of this.parts) {
      if (p.ring) p.r += (p.rmax - p.r) * 0.3;
      else { p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.vx *= 0.94; }
      p.life--;
    }
    this.parts = this.parts.filter(p => p.life > 0);
    this.texts.forEach(t => { t.life--; t.y -= 0.6; });
    this.texts = this.texts.filter(t => t.life > 0);
    this.bolts.forEach(b => b.life--);
    this.bolts = this.bolts.filter(b => b.life > 0);
    this.beams.forEach(b => b.life--);
    this.beams = this.beams.filter(b => b.life > 0);
    if (this.shake > 0) this.shake *= 0.85;
    if (this.shake < 0.5) this.shake = 0;
    if (this.flash > 0) this.flash--;
    if (this.darken > 0) this.darken--;
  },

  draw(ctx) {
    ctx.save();
    for (const b of this.beams) {
      const a = b.life / b.max, w = 34 * a + 6;
      const x2 = b.dir > 0 ? 1400 : -100;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = b.color; ctx.lineWidth = w * 1.8; ctx.globalAlpha = 0.35 * a;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x2, b.y); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = w * 0.5; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(x2, b.y); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    for (const b of this.bolts) drawBolt(ctx, b.x1, b.y1, b.x2, b.y2, b.color, b.width, b.life / b.max);
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      if (p.ring) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = Math.min(1, t.life / 15);
      const sc = 1 + Math.max(0, (t.life - t.max + 8) / 8) * 0.5;
      ctx.globalAlpha = a;
      ctx.font = `900 italic ${Math.round(t.size * sc)}px Impact, "Arial Black", sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = '#000';
      ctx.strokeText(t.str, t.x, t.y);
      ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
    }
    ctx.restore();
  },
};

function drawBolt(ctx, x1, y1, x2, y2, color, width = 3, alpha = 1) {
  const segs = 7, pts = [[x1, y1]];
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segs; i++) {
    const t = i / segs, off = (Math.random() - 0.5) * len * 0.25;
    pts.push([x1 + dx * t + nx * off, y1 + dy * t + ny * off]);
  }
  pts.push([x2, y2]);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 16;
  ctx.strokeStyle = color; ctx.lineWidth = width * 2.2;
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = width * 0.7;
  ctx.stroke();
  ctx.restore();
}

// ===================== STAGE =====================
function drawStage(ctx, W, H, groundY, t) {
  const g = ctx.createLinearGradient(0, 0, 0, groundY);
  g.addColorStop(0, '#0b0820'); g.addColorStop(0.55, '#3a1640'); g.addColorStop(1, '#a2452c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, groundY);
  // Mond
  ctx.fillStyle = 'rgba(255,230,200,0.9)';
  ctx.beginPath(); ctx.arc(980, 150, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,150,0.08)';
  ctx.beginPath(); ctx.arc(980, 150, 110, 0, Math.PI * 2); ctx.fill();
  // Berge
  ctx.fillStyle = '#1d0f24';
  ctx.beginPath(); ctx.moveTo(0, groundY - 140);
  [[120, 260], [260, 170], [420, 300], [560, 200], [720, 330], [880, 220], [1020, 290], [1160, 190], [1280, 260]]
    .forEach(([x, y]) => ctx.lineTo(x, groundY - y + 80));
  ctx.lineTo(W, groundY); ctx.lineTo(0, groundY); ctx.fill();
  ctx.fillStyle = '#120914';
  ctx.beginPath(); ctx.moveTo(0, groundY - 60);
  [[180, 110], [340, 70], [520, 130], [700, 80], [900, 140], [1080, 90], [1280, 120]].forEach(([x, y]) => ctx.lineTo(x, groundY - y));
  ctx.lineTo(W, groundY); ctx.lineTo(0, groundY); ctx.fill();
  // Torii
  ctx.fillStyle = '#5a1010';
  ctx.fillRect(560, groundY - 190, 14, 190); ctx.fillRect(706, groundY - 190, 14, 190);
  ctx.fillRect(530, groundY - 200, 220, 14); ctx.fillRect(550, groundY - 160, 180, 10);
  // Boden
  const gg = ctx.createLinearGradient(0, groundY, 0, H);
  gg.addColorStop(0, '#3b2a22'); gg.addColorStop(1, '#140c09');
  ctx.fillStyle = gg; ctx.fillRect(0, groundY, W, H - groundY);
  ctx.strokeStyle = 'rgba(255,180,120,0.12)'; ctx.lineWidth = 1;
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath(); ctx.moveTo(W / 2 + i * 70, groundY); ctx.lineTo(W / 2 + i * 220, H); ctx.stroke();
  }
  for (let i = 1; i < 5; i++) {
    const y = groundY + (H - groundY) * (i * i) / 25;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function easeOut(t) { t = Math.max(0, Math.min(1, t)); return 1 - (1 - t) * (1 - t) * (1 - t); }
