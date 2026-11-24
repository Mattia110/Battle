'use strict';
// ===================== MAPS (Teil 1: Gipfel, Büro) =====================
// Jede Map: static(ctx,W,H,gy) wird einmal in einen Cache gezeichnet, anim(ctx,W,H,gy,t) jedes Frame.

function srand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function poly(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}
function puff(ctx, x, y, s, alpha) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  [[0, 0, 1], [-0.9, 0.15, 0.7], [0.9, 0.2, 0.75], [-0.35, -0.35, 0.75], [0.4, -0.3, 0.7]].forEach(([dx, dy, r]) => {
    ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------- GIPFEL
function mountainStatic(ctx, W, H, gy) {
  ctx.fillStyle = vgrad(ctx, 0, gy, [[0, '#1a4892'], [0.55, '#4b82c9'], [1, '#a9c7e9']]);
  ctx.fillRect(0, 0, W, gy);

  // ferne Bergkette
  poly(ctx, [[0, gy - 170], [90, gy - 215], [160, gy - 190], [260, gy - 255], [300, gy - 235], [345, gy - 275], [385, gy - 240],
    [470, gy - 205], [560, gy - 232], [660, gy - 150], [660, gy], [0, gy]], '#a9bad3');
  poly(ctx, [[345, gy - 275], [328, gy - 250], [338, gy - 252], [346, gy - 240], [356, gy - 254], [366, gy - 250]], '#eef3fa');
  poly(ctx, [[260, gy - 255], [244, gy - 232], [256, gy - 236], [268, gy - 230], [282, gy - 240]], '#eef3fa');
  poly(ctx, [[560, gy - 232], [545, gy - 212], [558, gy - 214], [572, gy - 208], [585, gy - 218]], '#eef3fa');

  // Hauptgipfel – sonnige Seite
  const peak = [[810, 110], [770, 185], [742, 232], [706, 300], [660, 362], [600, 432], [520, 500], [430, 560], [380, gy],
    [1280, gy], [1280, 420], [1190, 372], [1120, 332], [1060, 302], [1000, 312], [945, 282], [905, 222], [860, 152]];
  poly(ctx, peak, '#e9eef5');
  // Schattenseite
  poly(ctx, [[810, 110], [860, 152], [905, 222], [945, 282], [1000, 312], [1060, 302], [1120, 332], [1190, 372], [1280, 420],
    [1280, gy], [930, gy], [870, 430], [842, 300], [826, 200]], '#8798b6');
  // Felsbänder (sonnige Seite)
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const tt = i / 12;
    let x = 806 - 300 * tt + srand(i) * 30, y = 120 + 400 * tt;
    ctx.strokeStyle = `rgba(70,78,96,${0.18 + srand(i + 9) * 0.22})`;
    ctx.lineWidth = 1.5 + srand(i + 3) * 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) { x += 6 + srand(i * 7 + k) * 16; y += 10 + srand(i * 3 + k) * 18; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  // Felsrinnen (Schattenseite)
  for (let i = 0; i < 14; i++) {
    let x = 830 + i * 30 + srand(i + 40) * 20, y = 160 + i * 18;
    ctx.strokeStyle = `rgba(50,58,78,${0.25 + srand(i + 70) * 0.25})`;
    ctx.lineWidth = 1.5 + srand(i + 5) * 2.5;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x -= 2 + srand(i * 5 + k) * 10; y += 18 + srand(i * 11 + k) * 18; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  poly(ctx, [[810, 110], [794, 138], [799, 166], [818, 156], [832, 130]], '#3b4152');

  // Vordergrund-Schneehügel
  poly(ctx, [[0, gy - 60], [150, gy - 96], [330, gy - 70], [520, gy - 112], [700, gy - 76], [900, gy - 102], [1100, gy - 66],
    [1280, gy - 92], [1280, gy], [0, gy]], '#f3f6fb');
  ctx.fillStyle = 'rgba(150,175,210,0.35)';
  [[220, gy - 40, 140], [620, gy - 50, 170], [1000, gy - 38, 150]].forEach(([x, y, r]) => {
    ctx.beginPath(); ctx.ellipse(x, y, r, 18, 0, 0, Math.PI * 2); ctx.fill();
  });

  // Boden: Schneeplateau
  ctx.fillStyle = vgrad(ctx, gy, H, [[0, '#eef3f9'], [1, '#b4c5db']]);
  ctx.fillRect(0, gy, W, H - gy);
  ctx.strokeStyle = 'rgba(120,145,185,0.18)'; ctx.lineWidth = 1;
  for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 70, gy); ctx.lineTo(W / 2 + i * 220, H); ctx.stroke(); }
  for (let i = 0; i < 12; i++) {
    const x = srand(i + 100) * W, y = gy + 18 + srand(i + 150) * 75, r = 8 + srand(i + 200) * 14;
    ctx.fillStyle = '#5a6272';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f6f9fc';
    ctx.beginPath(); ctx.ellipse(x - r * 0.1, y - r * 0.3, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function mountainAnim(ctx, W, H, gy, t) {
  // Wolkenfahne am Gipfel (Wind von rechts)
  for (let k = 0; k < 8; k++) {
    const ph = (t * 0.004 + k / 8) % 1;
    const x = 840 - ph * 170 + Math.sin(t * 0.02 + k) * 5;
    const y = 150 - ph * 40 + Math.sin(k * 1.7) * 18;
    puff(ctx, x, y, 22 + ph * 30, 0.5 * Math.sin(ph * Math.PI));
  }
  // treibende Wolken links
  for (let i = 0; i < 4; i++) {
    const x = ((i * 380 + t * 0.22) % 1700) - 220;
    puff(ctx, x, 270 + (i % 2) * 40 + i * 6, 26 + (i % 3) * 8, 0.85);
    puff(ctx, x + 55, 282 + (i % 2) * 40, 20, 0.85);
  }
  // Nebelband über den unteren Hängen
  for (let i = 0; i < 6; i++) puff(ctx, ((i * 240 + t * 0.12) % 1500) - 120, gy - 150 + (i % 2) * 14, 34, 0.55);
  // Schneefall
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 70; i++) {
    const sp = 0.6 + (i % 4) * 0.35;
    const x = (i * 97 + t * 0.4 * sp + Math.sin(t * 0.02 + i) * 8) % W;
    const y = (i * 53 + t * sp) % (H + 20);
    const s = 1.5 + (i % 3);
    ctx.fillRect(x, y, s, s);
  }
}

// ---------------------------------------------------- BÜRO
function officeStatic(ctx, W, H, gy) {
  const fy = gy - 40;               // Linie Wand/Boden
  const ceil = 205;                 // Unterkante Decke
  const VP = [640, 330];

  // Wand (Sichtbeton)
  ctx.fillStyle = '#dedad3'; ctx.fillRect(0, 0, W, fy);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(150,140,128,${0.05 + srand(i) * 0.06})`;
    ctx.beginPath(); ctx.ellipse(srand(i + 1) * W, ceil + srand(i + 2) * (fy - ceil), 30 + srand(i + 3) * 60, 12 + srand(i + 4) * 20, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Decke (Beton-Fertigteile, Perspektive)
  poly(ctx, [[0, 0], [W, 0], [W, ceil - 70], [0, ceil - 70]], '#b4a691');
  poly(ctx, [[0, ceil - 70], [W, ceil - 70], [W, ceil], [0, ceil]], '#bdb09c');
  ctx.strokeStyle = 'rgba(90,78,62,0.35)'; ctx.lineWidth = 2;
  for (let k = 1; k < 7; k++) { const y = ceil * (1 - Math.pow(1 - k / 7, 1.7)); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = -8; i <= 8; i++) {
    const xTop = VP[0] + i * 190;
    const xb = VP[0] + (xTop - VP[0]) * 0.55;
    ctx.beginPath(); ctx.moveTo(xTop, 0); ctx.lineTo(xb, ceil); ctx.stroke();
  }
  // schwarze Rohre + Strahler
  ctx.strokeStyle = '#1b1b1d'; ctx.lineCap = 'round';
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(150, -10); ctx.lineTo(280, ceil + 30); ctx.lineTo(720, ceil + 28); ctx.stroke();
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(440, -10); ctx.lineTo(380, 150); ctx.lineTo(330, ceil + 10); ctx.stroke();
  [[400, 110], [372, 170], [344, 230]].forEach(([x, y]) => {
    const lg = ctx.createRadialGradient(x, y + 30, 2, x, y + 30, 70);
    lg.addColorStop(0, 'rgba(255,240,210,0.35)'); lg.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(x, y + 30, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#151517'; ctx.fillRect(x - 7, y, 14, 26);
  });

  // Fensterfront links
  ctx.fillStyle = '#2a2e33'; ctx.fillRect(0, ceil + 20, 120, fy - ceil - 20);
  ctx.fillStyle = vgrad(ctx, ceil, fy, [[0, '#9fb7c8'], [1, '#6e8798']]);
  ctx.fillRect(8, ceil + 28, 50, fy - ceil - 36); ctx.fillRect(64, ceil + 28, 50, fy - ceil - 36);

  // Glastür mit schwarzem Rahmen
  ctx.fillStyle = '#1c1d20'; ctx.fillRect(300, 390, 110, fy - 390);
  ctx.fillStyle = '#56616b'; ctx.fillRect(308, 398, 44, fy - 398); ctx.fillRect(358, 398, 44, fy - 398);
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(316, 398, 8, fy - 398); ctx.fillRect(366, 398, 8, fy - 398);

  // Holz-Schrankwand
  ctx.fillStyle = '#dcc7a2'; ctx.fillRect(430, 320, 130, fy - 320);
  ctx.strokeStyle = 'rgba(120,95,60,0.4)'; ctx.lineWidth = 2;
  for (let x = 430; x <= 560; x += 32) { ctx.beginPath(); ctx.moveTo(x, 320); ctx.lineTo(x, fy); ctx.stroke(); }

  // Lamellenwand + Sideboard mit Pflanzen
  ctx.fillStyle = '#b98f5e'; ctx.fillRect(565, 350, 200, fy - 350);
  ctx.strokeStyle = 'rgba(80,55,30,0.55)'; ctx.lineWidth = 2;
  for (let x = 569; x < 765; x += 9) { ctx.beginPath(); ctx.moveTo(x, 350); ctx.lineTo(x, fy - 60); ctx.stroke(); }
  ctx.fillStyle = '#d2bb95'; ctx.fillRect(560, fy - 62, 215, 62);
  ctx.fillStyle = '#b39a73'; ctx.fillRect(560, fy - 62, 215, 5);
  [[600, 0.9], [680, 0.8], [740, 1]].forEach(([x, s]) => smallPlant(ctx, x, fy - 62, s));

  // Betonwand rechts mit Schreibtischen
  ctx.fillStyle = '#d3cfc8'; ctx.fillRect(775, ceil + 60, 380, fy - ceil - 60);
  desk(ctx, 800, fy); desk(ctx, 925, fy);
  // Betonsäule
  ctx.fillStyle = '#c7c2ba'; ctx.fillRect(1040, ceil, 42, fy - ceil);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(1070, ceil, 12, fy - ceil);

  // Holzrahmen (Raum-im-Raum) mit Lamellendecke
  poly(ctx, [[470, 262], [1180, 160], [1180, 205], [490, 300]], '#dccaa9');
  ctx.strokeStyle = 'rgba(110,85,55,0.45)'; ctx.lineWidth = 2;
  for (let k = 0; k < 14; k++) {
    const a = k / 14;
    ctx.beginPath(); ctx.moveTo(470 + (490 - 470) * a, 262 + (300 - 262) * a); ctx.lineTo(1180, 160 + (205 - 160) * a); ctx.stroke();
  }
  poly(ctx, [[470, 262], [1180, 160], [1180, 172], [470, 272]], '#e6d7ba');
  [[700, 292], [870, 272], [1010, 256]].forEach(([x, y]) => {
    ctx.strokeStyle = '#777'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y - 40); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = '#f3f1ec'; ctx.beginPath(); ctx.ellipse(x, y, 50, 7, 0, 0, Math.PI * 2); ctx.fill();
  });
  // Pfosten und Lamellenwand rechts
  ctx.fillStyle = '#e2d2b4'; ctx.fillRect(1180, 150, 46, H);
  ctx.fillStyle = '#cdb893'; ctx.fillRect(1226, 140, 54, H);
  ctx.strokeStyle = 'rgba(100,78,50,0.5)';
  for (let x = 1230; x < W; x += 8) { ctx.beginPath(); ctx.moveTo(x, 140); ctx.lineTo(x, H); ctx.stroke(); }
  // Pflanzkasten mit großer Pflanze vor dem Pfosten
  ctx.fillStyle = '#d8c7a8'; ctx.fillRect(1085, fy - 80, 100, 80 + 40);
  ctx.fillStyle = '#f2f2f0'; ctx.fillRect(1105, fy - 112, 60, 34);
  bigLeaves(ctx, 1135, fy - 112, 1);

  // Boden: Eichendielen
  ctx.fillStyle = vgrad(ctx, fy, H, [[0, '#d7aa71'], [1, '#b98650']]);
  ctx.fillRect(0, fy, W, H - fy);
  ctx.strokeStyle = 'rgba(120,80,40,0.35)'; ctx.lineWidth = 1;
  for (let k = 1; k < 9; k++) { const y = fy + (H - fy) * Math.pow(k / 9, 1.6); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let i = -16; i <= 16; i++) { ctx.beginPath(); ctx.moveTo(VP[0] + i * 45, fy); ctx.lineTo(VP[0] + i * 150, H); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,240,215,0.12)'; ctx.fillRect(0, fy, W, 6);

  // Lounge links: Teppich, Sofa, Sessel
  ctx.fillStyle = '#6f8a7a'; ctx.beginPath(); ctx.ellipse(200, fy + 30, 230, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9c9c9c'; ctx.fillRect(150, fy - 80, 170, 46);
  ctx.fillStyle = '#a9a9a9'; ctx.fillRect(150, fy - 38, 170, 26);
  ctx.fillStyle = '#b98e5b'; ctx.fillRect(140, fy - 60, 12, 66); ctx.fillRect(318, fy - 60, 12, 66); ctx.fillRect(140, fy - 14, 190, 8);
  ctx.fillStyle = '#a7928c'; ctx.beginPath(); ctx.ellipse(70, fy - 34, 62, 40, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(14, fy - 36, 116, 20);
  ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(34, fy - 16); ctx.lineTo(22, fy + 20); ctx.moveTo(110, fy - 16); ctx.lineTo(120, fy + 20); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.ellipse(370, fy - 8, 34, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(352, fy - 8, 36, 28);

  // große Zimmerpflanze links (steht im Topf am Boden)
  ctx.strokeStyle = '#5b4a32'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(150, fy - 40); ctx.quadraticCurveTo(130, 380, 110, 250); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(140, 400); ctx.quadraticCurveTo(170, 330, 200, 300); ctx.stroke();
  bigLeaves(ctx, 110, 250, 1.9);
  bigLeaves(ctx, 200, 300, 1.1);
  ctx.fillStyle = '#e9e7e2'; ctx.fillRect(122, fy - 46, 56, 50);
  ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(160, fy - 46, 18, 50);
}

function smallPlant(ctx, x, y, s) {
  ctx.fillStyle = '#f2f2f0'; ctx.fillRect(x - 9 * s, y - 16 * s, 18 * s, 16 * s);
  ctx.fillStyle = '#3e6b2f';
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.45;
    ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 14 * s, y - 16 * s + Math.sin(a) * 16 * s, 9 * s, 4 * s, a, 0, Math.PI * 2); ctx.fill();
  }
}
function bigLeaves(ctx, x, y, s) {
  for (let i = 0; i < 11; i++) {
    const a = -Math.PI / 2 + (srand(i + 300) - 0.5) * 2.6;
    const len = (34 + srand(i + 310) * 40) * s;
    ctx.fillStyle = i % 3 === 0 ? '#9cbf5f' : i % 3 === 1 ? '#5e8b36' : '#2f5e2a';
    ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * len, y + Math.sin(a) * len, 20 * s, 8 * s, a, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(40,60,20,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); ctx.stroke();
  }
}
function desk(ctx, x, fy) {
  // Trennwand (grün), Monitor, Tischplatte, weiße Beine, schwarzer Stuhl
  ctx.fillStyle = '#909c3c'; ctx.fillRect(x + 10, fy - 110, 95, 50);
  ctx.fillStyle = '#121214'; ctx.fillRect(x + 30, fy - 100, 58, 34);
  ctx.fillStyle = '#2a2d33'; ctx.fillRect(x + 34, fy - 96, 50, 26);
  ctx.fillStyle = '#f4f4f2'; ctx.fillRect(x, fy - 62, 115, 6);
  ctx.fillRect(x + 8, fy - 56, 5, 56); ctx.fillRect(x + 100, fy - 56, 5, 56);
  ctx.fillStyle = '#18181a';
  ctx.fillRect(x + 62, fy - 88, 28, 40); ctx.fillRect(x + 56, fy - 46, 40, 8);
  ctx.fillRect(x + 74, fy - 38, 5, 26);
  ctx.strokeStyle = '#18181a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 58, fy - 8); ctx.lineTo(x + 96, fy - 8); ctx.stroke();
}
