'use strict';
// ===================== TREFFER-AUFLÖSUNG =====================
// Prüft, ob der aktive Move von att den def erreicht. Gibt eine Funktion zurück (Anwendung später, damit Trades möglich sind).
function checkHit(att, def) {
  if (att.state !== 'attack' || att.hasHit || def.dead) return null;
  const m = att.move;
  if (att.mf < m.st || att.mf >= m.st + m.act) return null;
  const rel = (def.x - att.x) * att.facing;
  const airBonus = (def.state === 'air' || def.state === 'splat') ? 28 : 0;
  if (rel < -20 || rel > m.reach + 12 + airBonus) return null;
  if (def.invuln > 0 || ['down', 'getup', 'grabbed'].includes(def.state)) return null;

  const airborne = def.state === 'air' || def.state === 'jump' || def.airMove;
  if (m.lvl === 'l' && (def.y > 25 || def.airMove)) return null;
  if (m.lvl === 'h' && def.lowProfile()) return null;
  if (def.state === 'air' && def.noJuggle) return null;
  if (def.state === 'air' && def.y > 230) return null;

  if (m.lvl === 't') {
    if (airborne || def.lowProfile() || ['hitstun', 'blockstun', 'air', 'splat'].includes(def.state)) return null;
    return () => startThrow(att, def);
  }
  return () => applyAttack(att, def, m);
}

function startThrow(att, def) {
  att.hasHit = true;
  att.state = 'throwing'; att.t = 0;
  def.state = 'grabbed'; def.t = 0; def.grabber = att;
  def.facing = -att.facing;
  def.x = att.sx(72);
  def.slideV = 0; att.slideV = 0;
  Sfx.play('grab');
}

function applyAttack(att, def, m) {
  att.hasHit = true;
  const cur = def.input.cur, dir = cur.dir;
  const remaining = moveTotal(m) - att.mf;

  // Power Crush / Armor
  if (def.state === 'attack' && def.move.armor && def.mf >= def.move.armor[0] && def.mf <= def.move.armor[1] && m.lvl !== 'l') {
    const dmg = Math.round(m.dmg * 0.6);
    def.hp = Math.max(1, def.hp - dmg);
    def.flash = 4;
    FX.ring(def.x, def.sy(120), '#ffffff', 70);
    FX.text('ARMOR', def.x, def.sy(220), '#ddd', 22, 30);
    G.hitstop = 4; Sfx.play('block');
    return;
  }

  // Blocken?
  const canBlock = ['idle', 'crouch', 'blockstun'].includes(def.state) && !(def.state === 'idle' && def.walking === 1) && def.grounded;
  if (canBlock) {
    const crouching = def.state === 'crouch' || (def.state === 'blockstun' && dir <= 3);
    let blocked = false;
    if (!crouching && (dir === 4 || dir === 5) && (m.lvl === 'h' || m.lvl === 'm' || m.lvl === 'sm')) blocked = true;
    if (crouching && (dir === 1 || dir === 2) && (m.lvl === 'l' || m.lvl === 'sm')) blocked = true;
    if (blocked) {
      att.lastBlocked = true;
      def.state = 'blockstun';
      def.crouchBlock = crouching;
      def.stun = Math.max(1, remaining + m.blk);
      let chip = m.chip + (att.heatOn && m.chip ? 3 : 0);
      if (chip) def.hp = Math.max(1, def.hp - chip);
      pushApart(att, def, m.push * 0.55);
      const hx = (att.x + def.x) / 2, hy = def.sy(crouching ? 70 : m.lvl === 'h' ? 165 : 115);
      FX.spark(hx, hy, '#9fd8ff', 8, 5);
      FX.ring(hx, hy, '#9fd8ff', 34);
      if (m.fx === 'elec') { FX.burstBolts(hx, hy, att.colors.elec, 4, 60); FX.text('+5', hx, hy - 60, att.colors.elec, 22, 30); }
      G.hitstop = m.dmg >= 20 ? 5 : 3; Sfx.play('block');
      return;
    }
  }

  // Treffer
  // Counter Hit nur in Startup/aktiven Frames – Treffer in die Recovery ist ein Punish (wie in Tekken)
  const inRecovery = def.state === 'attack' && def.move && def.mf >= def.move.st + def.move.act;
  const counter = (def.state === 'attack' && !inRecovery) || def.state === 'backdash';
  const punish = inRecovery && def.move.blk <= -10 && def.lastBlocked;
  const juggling = def.state === 'air' || def.state === 'splat' || (def.state === 'hitstun' && def.crumple);
  let dmg = m.dmg;
  if (counter && !juggling) dmg *= 1.2;
  if (att.rage) dmg *= 1.1;
  if (att.heatOn) dmg *= 1.1;
  if (juggling) { dmg *= def.scale; def.scale = Math.max(0.25, def.scale - 0.12); }
  dmg = Math.max(1, Math.round(dmg));
  def.hp = Math.max(0, def.hp - dmg);
  def.combo++;
  def.flash = 3;
  def.airMove = false;
  if (def.state === 'attack') { def.move = null; def.queued = null; }
  def.buffer = null;

  const hx = def.x - att.facing * 10, hy = def.sy(def.state === 'air' ? 40 : m.lvl === 'h' ? 165 : m.lvl === 'm' ? 115 : 30);
  FX.spark(hx, hy, '#ffd27a', 14, 8);
  FX.ring(hx, hy, '#fff3c0', 46);
  if (dmg >= 12) FX.shake = Math.max(FX.shake, dmg * 0.3);
  G.hitstop = Math.max(G.hitstop, dmg < 10 ? 4 : dmg < 20 ? 6 : 8);
  Sfx.play(dmg >= 20 ? 'heavy' : 'hit');

  if (m.fx === 'elec') {
    FX.burstBolts(hx, hy, att.colors.elec, 10, 130);
    FX.burstBolts(hx, hy, att.colors.elec2, 4, 80);
    FX.flash = 4; FX.flashColor = att.colors.elec;
    if (att.moveId === 'ewgf') FX.text('ELECTRIC!', hx, hy - 90, att.colors.elec, 40, 60);
    G.hitstop = Math.max(G.hitstop, 10);
    Sfx.play('zap');
  }
  if (m.fx === 'thunder' || att.moveId === 'rageart') {
    for (let i = 0; i < 3; i++) FX.bolt(def.x + (Math.random() - 0.5) * 50, 0, def.x, hy, att.colors.elec, 20, 5);
    FX.flash = 6; FX.flashColor = att.colors.elec; G.hitstop = Math.max(G.hitstop, 10); Sfx.play('zap');
  }
  if (att.moveId === 'rageart') { FX.flash = 10; FX.flashColor = '#ff3030'; FX.shake = 25; G.hitstop = 30; }
  if (att.moveId === 'heatburst') { FX.ring(hx, hy, att.colors.elec, 140); G.hitstop = 14; }
  if (counter && !juggling) FX.text('COUNTER HIT', def.x, def.sy(250), '#ff4040', 28, 45);
  if (punish) FX.text('PUNISH!', def.x, def.sy(250), '#ffb020', 32, 50);
  if (def.combo >= 2) G.comboText(att, def.combo);
  def.showDamage(dmg, counter);

  // Folgezustand
  let kd = m.kd;
  if (counter && m.chHit && !juggling) kd = m.chHit;
  const away = att.facing;
  if (juggling) {
    def.crumple = false;
    def.juggleHits++;
    const base = m.kd === 'launch' ? 11.5 : m.kd === 'kd' ? 8 : 10.5;
    if (m.screw && !def.screwed && def.state !== 'splat') {
      // Tornado: Gegner wird verdreht, fliegt flach weiter -> Combo kann verlängert werden (Wall Carry)
      def.screwed = true; def.juggleHits += 2;
      def.launch(7.5, 3.4 * away, false); def.spin = 0.01;
      FX.text('TORNADO!', def.x, def.sy(240), '#7fe0ff', 30, 45);
      FX.ring(hx, hy, '#7fe0ff', 80);
    } else if (def.state === 'splat') { def.launch(5, 2.5 * away, false); }
    else def.launch(base * Math.max(0.45, 1 - def.juggleHits * 0.07), (m.kd === 'kd' ? 4.5 : 1.5) * away, m.kd === 'kd');
    def.splatUsed = def.splatUsed || false;
  } else if (kd === 'launch') {
    def.launch(m.launchVy, 0.9 * away, false);
    def.scale = 0.7; def.juggleHits = 0;
    FX.text('LAUNCH', def.x, def.sy(260), '#ffe060', 22, 30);
  } else if (kd === 'sweep') {
    def.launch(5, 2 * away, true);
    FX.spark(def.x, GROUND_Y - 10, '#c0a080', 10, 5);
  } else if (kd === 'kd') {
    def.launch(7, 5 * away, true);
  } else if (kd === 'crumple') {
    def.state = 'hitstun'; def.stun = 50; def.crumple = true; def.scale = 0.75;
    FX.text('CRUMPLE', def.x, def.sy(260), '#ffe060', 22, 30);
  } else if (def.hp <= 0) {
    def.launch(6, 4 * away, true);
  } else {
    def.state = 'hitstun';
    def.crumple = false;
    def.stun = Math.max(1, remaining + m.hit + (counter ? 6 : 0));
    pushApart(att, def, m.push);
  }
  if (def.hp <= 0 && def.state === 'hitstun' && !def.crumple) def.launch(6, 4 * away, true);
  G.onDamage(def);
}

// Pushback: Verteidiger rutscht zurück, an der Wand wird stattdessen der Angreifer zurückgeschoben
function pushApart(att, def, px) {
  const dir = att.facing;
  const atWall = (dir > 0 && def.x >= WALL_R - 5) || (dir < 0 && def.x <= WALL_L + 5);
  if (atWall) att.slideV = -dir * px * 0.2;
  else def.slideV = dir * px * 0.2;
}

// Körper dürfen sich nicht überlappen
function resolvePush(a, b) {
  if (a.state === 'grabbed' || b.state === 'grabbed') return;
  if (a.y > 90 || b.y > 90) return;
  const minD = 58;
  let dx = b.x - a.x;
  if (Math.abs(dx) >= minD) return;
  if (dx === 0) dx = a.facing;
  const over = (minD - Math.abs(dx)) / 2, s = Math.sign(dx);
  a.x -= s * over; b.x += s * over;
  // an der Wand: den anderen schieben
  if (a.x < WALL_L) { b.x += WALL_L - a.x; a.x = WALL_L; }
  if (b.x < WALL_L) { a.x += WALL_L - b.x; b.x = WALL_L; }
  if (a.x > WALL_R) { b.x -= a.x - WALL_R; a.x = WALL_R; }
  if (b.x > WALL_R) { a.x -= b.x - WALL_R; b.x = WALL_R; }
}
