'use strict';
// ===================== KÄMPFER ZEICHNEN =====================
function drawFighter(ctx, f, groundY, time) {
  const p = f.getPose();
  const C = f.colors;
  const white = f.flash > 0;
  const col = c => (white ? '#ffffff' : c);
  const P = k => p[k];

  ctx.save();
  ctx.translate(f.x, groundY - f.y);
  // Schatten
  ctx.save();
  ctx.scale(1, 0.25);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(0, (f.y) * 4, 55 - Math.min(30, f.y * 0.1), 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.scale(f.facing, -1);
  if (f.rotation) {
    ctx.translate(0, 50); ctx.rotate(f.rotation); ctx.translate(0, -50);
  }
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Aura (Rage / Surge)
  if (f.rage || f.heatOn) {
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.25);
    ctx.save();
    ctx.shadowColor = f.heatOn ? C.elec : '#ff2020';
    ctx.shadowBlur = 25 + pulse * 15;
    ctx.strokeStyle = f.heatOn ? C.aura + (0.25 + pulse * 0.2) + ')' : 'rgba(255,30,30,' + (0.18 + pulse * 0.15) + ')';
    ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(P('hip')[0], P('hip')[1]); ctx.lineTo(P('neck')[0], P('neck')[1]); ctx.stroke();
    ctx.restore();
  }

  // Oni-Flügel (Fady im Surge)
  if (f.heatOn && f.charKey === 'fady') {
    const n = P('neck'), flap = Math.sin(time * 0.15) * 10;
    ctx.fillStyle = col('#2a0a3a'); ctx.strokeStyle = col('#7a20b0'); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(n[0] - 8, n[1] - 10);
    ctx.lineTo(n[0] - 70, n[1] + 50 + flap);
    ctx.lineTo(n[0] - 60, n[1] + 10 + flap);
    ctx.lineTo(n[0] - 95, n[1] + 15 + flap);
    ctx.lineTo(n[0] - 70, n[1] - 20 + flap * 0.5);
    ctx.lineTo(n[0] - 100, n[1] - 40);
    ctx.lineTo(n[0] - 20, n[1] - 40);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  const limb = (a, b, c, w, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke();
  };
  const fist = (h, r) => { ctx.fillStyle = col(C.glove); ctx.beginPath(); ctx.arc(h[0], h[1], r, 0, Math.PI * 2); ctx.fill(); };
  const suit = !!C.suit;
  const foot = (k, ft) => {
    ctx.strokeStyle = col(C.shoe || C.skinShade); ctx.lineWidth = suit ? 11 : 9;
    ctx.beginPath(); ctx.moveTo(ft[0] - (suit ? 3 : 0), ft[1] + 2); ctx.lineTo(ft[0] + (suit ? 17 : 14), ft[1] + 2); ctx.stroke();
  };
  // Arm: bei Anzug Ärmel + weiße Manschette, sonst nackter Arm
  const arm = (e, h, w, color) => {
    limb(sh, e, h, w, color);
    if (suit) {
      const cx = e[0] + (h[0] - e[0]) * 0.78, cy = e[1] + (h[1] - e[1]) * 0.78;
      ctx.strokeStyle = col(C.shirt); ctx.lineWidth = w - 1;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(e[0] + (h[0] - e[0]) * 0.88, e[1] + (h[1] - e[1]) * 0.88); ctx.stroke();
    }
  };
  const sh = [P('neck')[0] - 2, P('neck')[1] - 8];

  // hinterer Arm & Bein
  arm(P('be'), P('bh'), suit ? 15 : 12, col(suit ? C.sleeveShade : C.skinShade)); fist(P('bh'), suit ? 8 : 9);
  limb(P('hip'), P('bk'), P('bf'), 17, col(C.pantsShade)); foot(P('bk'), P('bf'));

  // Torso
  const hip = P('hip'), nk = P('neck');
  const mx = (hip[0] + nk[0]) / 2, my = (hip[1] + nk[1]) / 2;
  if (suit) {
    // Hose-Bund
    ctx.strokeStyle = col(C.pants); ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1] - 2); ctx.lineTo(hip[0], hip[1] + 4); ctx.stroke();
    // Sakko (Zweireiher, reicht über die Hüfte)
    ctx.strokeStyle = col(C.torso); ctx.lineWidth = 40;
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1] - 6); ctx.lineTo(nk[0], nk[1] - 10); ctx.stroke();
    // Hemd-Ausschnitt + Krawatte (vorne = +x)
    const ux = nk[0] - hip[0], uy = nk[1] - hip[1], ul = Math.hypot(ux, uy) || 1;
    const fx = uy / ul, fy = -ux / ul; // Normale nach vorne
    const at = (t, off) => [hip[0] + ux * t + fx * off, hip[1] + uy * t + fy * off];
    const v1 = at(0.95, 6), v2 = at(0.55, 16), v3 = at(0.95, 20);
    ctx.fillStyle = col(C.shirt);
    ctx.beginPath(); ctx.moveTo(v1[0], v1[1]); ctx.lineTo(v2[0], v2[1]); ctx.lineTo(v3[0], v3[1]); ctx.closePath(); ctx.fill();
    const t1 = at(0.92, 15), t2 = at(0.6, 17);
    ctx.strokeStyle = col(C.tie); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.stroke();
    ctx.fillStyle = col(C.tieDark);
    const tm = at(0.76, 16); ctx.fillRect(tm[0] - 1.5, tm[1] - 1.5, 3, 3);
    // Revers-Linie und Knöpfe
    ctx.strokeStyle = col('#3c3e42'); ctx.lineWidth = 2;
    const r1 = at(0.98, 4), r2 = at(0.45, 18);
    ctx.beginPath(); ctx.moveTo(r1[0], r1[1]); ctx.lineTo(r2[0], r2[1]); ctx.stroke();
    ctx.fillStyle = col('#2a2b2e');
    [[0.38, 12], [0.38, 4], [0.18, 12], [0.18, 4]].forEach(([t, o]) => { const b = at(t, o); ctx.beginPath(); ctx.arc(b[0], b[1], 2, 0, Math.PI * 2); ctx.fill(); });
  } else {
    ctx.strokeStyle = col(C.skin); ctx.lineWidth = 34;
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1] + 8); ctx.lineTo(nk[0], nk[1] - 10); ctx.stroke();
    // Brust-Schattierung
    ctx.strokeStyle = col(C.skinShade); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx + 4, my + 18); ctx.lineTo(mx + 10, my + 4); ctx.stroke();
    // Hose / Gürtel
    ctx.strokeStyle = col(C.pants); ctx.lineWidth = 36;
    ctx.beginPath(); ctx.moveTo(hip[0], hip[1] - 2); ctx.lineTo(hip[0], hip[1] + 6); ctx.stroke();
    ctx.strokeStyle = col(C.belt); ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(hip[0] - 17, hip[1] + 10); ctx.lineTo(hip[0] + 17, hip[1] + 10); ctx.stroke();
  }

  // vorderes Bein
  limb(P('hip'), P('fk'), P('ff'), 18, col(C.pants)); foot(P('fk'), P('ff'));

  // Kopf
  const hd = P('head');
  ctx.strokeStyle = col(C.skin); ctx.lineWidth = 12;
  ctx.beginPath(); ctx.moveTo(nk[0], nk[1] - 6); ctx.lineTo(hd[0], hd[1] - 6); ctx.stroke();
  ctx.fillStyle = col(C.skin);
  ctx.beginPath(); ctx.arc(hd[0], hd[1], 15, 0, Math.PI * 2); ctx.fill();
  if (suit) { // Hemdkragen
    ctx.strokeStyle = col(C.shirt); ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(nk[0] + 1, nk[1] - 9); ctx.lineTo(nk[0] + 3, nk[1] - 3); ctx.stroke();
  }
  drawHair(ctx, f.charKey, hd, col(C.hair));
  // Auge
  const eyeGlow = f.heatOn && f.charKey === 'fady';
  ctx.fillStyle = eyeGlow ? '#ff2040' : (white ? '#fff' : '#111');
  ctx.fillRect(hd[0] + 7, hd[1] + 2, 5, eyeGlow ? 4 : 3);
  if (f.charKey === 'fady') {
    // dicke Augenbrauen
    ctx.fillStyle = col(C.hair); ctx.fillRect(hd[0] + 4, hd[1] + 7, 11, 3.5);
    // Zigarette mit Glut
    if (!['air', 'down', 'getup', 'splat'].includes(f.state)) {
      ctx.strokeStyle = col('#f2efe6'); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(hd[0] + 12, hd[1] - 7); ctx.lineTo(hd[0] + 27, hd[1] - 5); ctx.stroke();
      ctx.fillStyle = white ? '#fff' : (Math.sin(time * 0.1) > 0 ? '#ff6a1a' : '#ff9a3a');
      ctx.fillRect(hd[0] + 26, hd[1] - 6.5, 3, 3);
      // Rauch
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const ph = ((time * 0.6 + i * 24) % 120) / 120;
        ctx.globalAlpha = 0.28 * (1 - ph);
        ctx.fillStyle = '#c8d0dc';
        ctx.beginPath();
        ctx.arc(hd[0] + 28 + Math.sin(ph * 9 + i) * 6 - ph * 10, hd[1] - 4 + ph * 70, 2 + ph * 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // vorderer Arm
  arm(P('fe'), P('fh'), suit ? 15 : 13, col(suit ? C.sleeve : C.skin)); fist(P('fh'), suit ? 9 : 10);

  // Elektro-Funken an der Faust
  if (f.elecGlow > 0) {
    const h = P('be')[1] > P('fe')[1] ? P('bh') : P('fh');
    ctx.save(); ctx.scale(1, 1);
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * 6.28, l = 20 + Math.random() * 30;
      drawBolt(ctx, h[0], h[1], h[0] + Math.cos(a) * l, h[1] + Math.sin(a) * l, C.elec, 2, 1);
    }
    ctx.restore();
  }
  ctx.restore();

  // Bubesch im Surge: Blitze um den Körper
  if (f.heatOn && f.charKey === 'raizo' && Math.random() < 0.35) {
    const cx = f.x + (Math.random() - 0.5) * 70, cy = groundY - f.y - 40 - Math.random() * 140;
    drawBolt(ctx, cx, cy, cx + (Math.random() - 0.5) * 60, cy + (Math.random() - 0.5) * 60, C.elec, 2, 0.9);
  }
}

function drawHair(ctx, key, hd, color) {
  ctx.fillStyle = color;
  if (key === 'fady') {
    // Kurze dunkle Haare (oben etwas voller)
    ctx.beginPath(); ctx.arc(hd[0] - 1, hd[1] + 1.5, 16.5, 0.45, Math.PI + 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hd[0] + 1, hd[1] + 13, 13, 6, 0.15, 0, Math.PI * 2); ctx.fill();
    // Vollbart mit Schnurrbart
    ctx.beginPath();
    ctx.moveTo(hd[0] - 3, hd[1] + 3);
    ctx.lineTo(hd[0] - 7, hd[1] - 8);
    ctx.lineTo(hd[0] - 1, hd[1] - 18);
    ctx.lineTo(hd[0] + 11, hd[1] - 19);
    ctx.lineTo(hd[0] + 17, hd[1] - 10);
    ctx.lineTo(hd[0] + 16, hd[1] - 3);
    ctx.lineTo(hd[0] + 9, hd[1] - 3);
    ctx.lineTo(hd[0] + 4, hd[1] - 7);
    ctx.lineTo(hd[0] + 2, hd[1] + 1);
    ctx.closePath(); ctx.fill();
  } else {
    // Glatze mit Haarknoten und langem weißen Bart
    ctx.beginPath(); ctx.arc(hd[0] - 10, hd[1] + 18, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hd[0] - 14, hd[1] + 2);
    ctx.lineTo(hd[0] - 6, hd[1] + 10);
    ctx.lineTo(hd[0] - 16, hd[1] + 12);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hd[0] + 14, hd[1] - 4);
    ctx.lineTo(hd[0] + 2, hd[1] - 6);
    ctx.lineTo(hd[0] + 6, hd[1] - 34);
    ctx.lineTo(hd[0] + 12, hd[1] - 24);
    ctx.closePath(); ctx.fill();
  }
}
