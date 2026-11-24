'use strict';
// ===================== MAPS (Teil 2: DATASEC-Eingang + Verwaltung) =====================

function entranceStatic(ctx, W, H, gy) {
  const ty = gy - 78;   // Terrasse
  // Fassade
  ctx.fillStyle = '#ecebe7'; ctx.fillRect(0, 0, W, gy);
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let y = 0; y < ty; y += 46) ctx.fillRect(0, y, W, 1);

  // obere Fensterreihe (weiße Rahmen, Bäume spiegeln sich)
  [120, 420, 580, 740, 1040].forEach(x => {
    ctx.fillStyle = '#d9d9d6'; ctx.fillRect(x - 6, 4, 132, 104);
    ctx.fillStyle = vgrad(ctx, 10, 100, [[0, '#4d5a4c'], [0.5, '#6f7e66'], [1, '#2f3732']]);
    ctx.fillRect(x, 10, 120, 92);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 38, 10, 5, 92); ctx.fillRect(x + 78, 10, 5, 92);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x + 4, 14, 12, 84);
  });
  // dunkles Band
  ctx.fillStyle = '#3b4045'; ctx.fillRect(0, 122, W, 22);
  // zweite Fensterreihe (schwarze Rahmen)
  [120, 420, 580, 740, 1040].forEach(x => {
    ctx.fillStyle = '#1e2124'; ctx.fillRect(x - 4, 160, 128, 76);
    ctx.fillStyle = '#3b444a'; ctx.fillRect(x, 164, 120, 68);
    ctx.fillStyle = '#1e2124'; ctx.fillRect(x + 38, 164, 4, 68); ctx.fillRect(x + 78, 164, 4, 68);
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x + 6, 168, 10, 60);
  });

  // Seitenwände des Eingangsbaus
  ctx.fillStyle = '#e4e3df'; ctx.fillRect(255, 272, 770, ty - 272);
  ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(255, 272, 12, ty - 272); ctx.fillRect(1013, 272, 12, ty - 272);

  // Vordach (Trapezblech)
  poly(ctx, [[230, 244], [1050, 244], [1028, 276], [252, 276]], '#45494e');
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
  for (let x = 240; x < 1045; x += 11) { ctx.beginPath(); ctx.moveTo(x, 246); ctx.lineTo(x + (640 - x) * 0.03, 274); ctx.stroke(); }
  ctx.fillStyle = '#5c6066'; ctx.fillRect(230, 240, 820, 6);
  ctx.fillStyle = '#2b2e31';
  [330, 500, 780, 950].forEach(x => { ctx.fillRect(x - 5, 276, 10, 6); });
  ctx.strokeStyle = '#5c6066'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(230, 244); ctx.lineTo(206, 226); ctx.moveTo(1050, 244); ctx.lineTo(1074, 226); ctx.stroke();

  // Schriftzug
  ctx.fillStyle = '#ffffff'; ctx.fillRect(290, 278, 700, 56);
  ctx.fillStyle = '#1b1b1b'; ctx.font = '700 48px "Arial Black", Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const word = 'DATASEC', sp = 50;
  for (let i = 0; i < word.length; i++) ctx.fillText(word[i], 640 + (i - (word.length - 1) / 2) * sp, 308);
  ctx.textBaseline = 'alphabetic';

  // Glasfront
  ctx.fillStyle = '#2b2e32'; ctx.fillRect(300, 338, 680, ty - 338);
  const panels = [[308, 470], [476, 636], [644, 804], [812, 972]];
  panels.forEach(([a, b], i) => {
    ctx.fillStyle = vgrad(ctx, 338, ty, [[0, '#7d8b92'], [0.5, '#58666d'], [1, '#3a454b']]);
    ctx.fillRect(a, 346, b - a, ty - 352);
    ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(a + 10, 346, 14, ty - 352);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(a + 34, 346, 6, ty - 352);
    if (i === 1 || i === 2) { ctx.fillStyle = '#c9ccce'; ctx.fillRect(i === 1 ? b - 14 : a + 10, 420, 4, 70); }
  });
  ctx.fillStyle = '#2b2e32'; ctx.fillRect(300, 338, 680, 8);
  // Innenleben schemenhaft
  ctx.fillStyle = 'rgba(230,230,225,0.25)'; ctx.fillRect(520, 380, 50, ty - 390); ctx.fillRect(700, 370, 30, ty - 380);

  // Bullaugen-Fenster
  [175, 1105].forEach(x => {
    ctx.fillStyle = '#d5d4d0'; ctx.beginPath(); ctx.arc(x, 405, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f2326'; ctx.beginPath(); ctx.arc(x, 405, 37, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f0f0ee'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x - 37, 405); ctx.lineTo(x + 37, 405); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(x - 12, 392, 10, 0, Math.PI * 2); ctx.fill();
  });

  // Terrasse (dunkle Platten)
  ctx.fillStyle = '#5b5f63'; ctx.fillRect(0, ty, W, 40);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, ty); ctx.lineTo(x - 10, ty + 40); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, ty + 20); ctx.lineTo(W, ty + 20); ctx.stroke();
  // Weg zur Tür (helleres Pflaster)
  poly(ctx, [[560, ty], [720, ty], [790, ty + 40], [490, ty + 40]], '#8b8e91');
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  for (let k = 0; k < 4; k++) { const y = ty + k * 10; ctx.beginPath(); ctx.moveTo(560 - k * 17, y); ctx.lineTo(720 + k * 17, y); ctx.stroke(); }

  // Geländer
  ctx.strokeStyle = '#a7abb0'; ctx.lineWidth = 3;
  [[0, 235], [1045, 1280]].forEach(([a, b]) => {
    ctx.beginPath(); ctx.moveTo(a, ty - 100); ctx.lineTo(b, ty - 100); ctx.moveTo(a, ty - 50); ctx.lineTo(b, ty - 50); ctx.stroke();
    ctx.lineWidth = 2;
    for (let x = a + 6; x < b; x += 11) { ctx.beginPath(); ctx.moveTo(x, ty - 100); ctx.lineTo(x, ty); ctx.stroke(); }
    ctx.lineWidth = 3;
  });

  // Pflanzkübel
  ENTRANCE_PLANTERS.forEach(p => { ctx.fillStyle = '#2b2f33'; ctx.fillRect(p.x - 26, ty - 6, 52, 42); ctx.fillStyle = '#3a3f44'; ctx.fillRect(p.x - 26, ty - 6, 52, 5); });

  // weiße Mauern + Stufen
  ctx.fillStyle = '#e5e3de'; ctx.fillRect(0, gy - 40, 300, 40); ctx.fillRect(980, gy - 40, 300, 40);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, gy - 40, 300, 4); ctx.fillRect(980, gy - 40, 300, 4);
  ctx.fillStyle = '#5c6064'; ctx.fillRect(300, gy - 40, 680, 4);
  for (let k = 0; k < 3; k++) {
    const y = gy - 38 + k * 13;
    ctx.fillStyle = '#34373b'; ctx.fillRect(300 - k * 4, y, 680 + k * 8, 13);
    ctx.fillStyle = '#4b4f54'; ctx.fillRect(300 - k * 4, y, 680 + k * 8, 3);
  }

  // Kopfsteinpflaster (Kampffläche)
  ctx.fillStyle = '#7f7a73'; ctx.fillRect(0, gy, W, H - gy);
  let y = gy, row = 0;
  while (y < H) {
    const h = 9 + row * 3.2, w = 16 + row * 5;
    for (let x = -(row % 2) * w / 2; x < W; x += w) {
      const s = srand(row * 101 + Math.floor(x));
      const c = 128 + Math.floor(s * 40);
      ctx.fillStyle = `rgb(${c},${c - 4},${c - 10})`;
      ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3);
    }
    y += h; row++;
  }
  // Herbstlaub
  for (let i = 0; i < 90; i++) {
    const x = srand(i + 500) * W;
    const ly = i < 25 ? gy - 38 + srand(i + 600) * 38 : gy + srand(i + 600) * (H - gy);
    if (i < 25 && (x < 300 || x > 980)) continue;
    leaf(ctx, x, ly, srand(i + 700) * Math.PI, i);
  }
}

const ENTRANCE_PLANTERS = [{ x: 60, red: false }, { x: 160, red: true }, { x: 270, red: true }, { x: 1010, red: true }, { x: 1120, red: false }, { x: 1220, red: true }];

function leaf(ctx, x, y, a, i) {
  const cols = ['#c0602a', '#d98b2b', '#8a4a20', '#b23a1f', '#e0a63a'];
  ctx.fillStyle = cols[i % cols.length];
  ctx.beginPath(); ctx.ellipse(x, y, 5 + (i % 3), 2.5, a, 0, Math.PI * 2); ctx.fill();
}

function entranceAnim(ctx, W, H, gy, t) {
  const ty = gy - 78;
  // Ziergräser im Wind
  ENTRANCE_PLANTERS.forEach((p, pi) => {
    for (let i = 0; i < 16; i++) {
      const bx = p.x - 20 + (i / 15) * 40;
      const len = 45 + srand(pi * 31 + i) * 40;
      const sway = Math.sin(t * 0.03 + i * 0.5 + pi) * 6 + (i - 7.5) * 1.6;
      ctx.strokeStyle = p.red ? (i % 3 ? '#a3352a' : '#6d7a3a') : (i % 3 ? '#7b9a4a' : '#c5c27a');
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, ty - 4);
      ctx.quadraticCurveTo(bx + sway * 0.3, ty - len * 0.6, bx + sway, ty - len); ctx.stroke();
    }
  });
  // fallende Blätter
  for (let i = 0; i < 6; i++) {
    const ph = ((t * 0.002 + i / 6) % 1);
    const x = ((i * 233 + t * 0.6) % (W + 100)) - 50 + Math.sin(t * 0.04 + i) * 20;
    const y = ph * (gy + 60);
    leaf(ctx, x, y, t * 0.05 + i, i);
  }
}

// ---------------------------------------------------- Verwaltung
const STAGES = [
  { name: 'TEMPEL', sub: 'Abendrot', static: (ctx, W, H, gy) => drawStage(ctx, W, H, gy, 0) },
  { name: 'GIPFEL', sub: 'Über den Wolken', static: mountainStatic, anim: mountainAnim },
  { name: 'BÜRO', sub: 'Open Space', static: officeStatic },
  { name: 'DATASEC', sub: 'Haupteingang', static: entranceStatic, anim: entranceAnim },
];

function stageLayer(stage, W, H) {
  if (stage._cache !== undefined) return stage._cache;
  let c = null;
  try {
    if (typeof document !== 'undefined' && document.createElement) {
      c = document.createElement('canvas'); c.width = W; c.height = H;
      stage.static(c.getContext('2d'), W, H, GROUND_Y);
    }
  } catch (e) { c = null; }
  stage._cache = c;
  return c;
}

function drawStageBg(ctx, idx, W, H, t) {
  const s = STAGES[idx] || STAGES[0];
  const c = stageLayer(s, W, H);
  if (c) ctx.drawImage(c, 0, 0); else s.static(ctx, W, H, GROUND_Y);
  if (s.anim) s.anim(ctx, W, H, GROUND_Y, t);
  // dezente Vignette an den Wänden
  const l = ctx.createLinearGradient(0, 0, 70, 0);
  l.addColorStop(0, 'rgba(0,0,0,0.35)'); l.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = l; ctx.fillRect(0, 0, 70, H);
  const r = ctx.createLinearGradient(W, 0, W - 70, 0);
  r.addColorStop(0, 'rgba(0,0,0,0.35)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r; ctx.fillRect(W - 70, 0, 70, H);
}
