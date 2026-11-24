'use strict';
// ===================== KÄMPFER-LOGIK =====================
const GRAVITY = 0.72;
const MAX_HP = 180;
const WALL_L = 60, WALL_R = 1220;
const GROUND_Y = 620;
const HEAT_TIME = 600;

function moveTotal(m) { return m.st + m.act - 1 + m.rec; }

class Fighter {
  constructor(idx, charKey, alt) {
    this.idx = idx;
    this.charKey = charKey;
    this.ch = CHARS[charKey];
    this.moves = this.ch.moves;
    this.cmds = buildCommands(this.ch);
    this.colors = Object.assign({}, this.ch.colors);
    if (alt) {
      this.colors.pants = this.colors.pantsShade = this.ch.colors.alt;
      if (this.colors.suit) this.colors.torso = this.colors.sleeve = this.colors.sleeveShade = this.ch.colors.alt;
    }
    this.input = new InputReader(KEYMAPS[idx]);
    this.wins = 0;
  }

  reset(x, facing) {
    Object.assign(this, {
      x, y: 0, vx: 0, vy: 0, slideV: 0, facing, hp: MAX_HP, dispHp: MAX_HP,
      state: 'idle', t: 0, move: null, moveId: null, mf: 0, hasHit: false, stun: 0,
      combo: 0, scale: 1, juggleHits: 0, noJuggle: false, crumple: false, crouchBlock: false, splatUsed: false,
      rage: false, rageUsed: false, heatReady: true, heatOn: false, heat: 0,
      flash: 0, elecGlow: 0, buffer: null, queued: null, walking: 0, walkPhase: 0, rotation: 0,
      invuln: 0, wsTimer: 0, waveWin: 0, grabber: null, breakable: false, dead: false, airMove: false,
    });
  }

  sx(dx) { return this.x + dx * this.facing; }
  sy(h) { return GROUND_Y - this.y - h; }
  get grounded() { return this.y <= 0.01; }
  get actionable() { return ['idle', 'crouch', 'dash', 'backdash', 'cdash'].includes(this.state); }

  lowProfile() {
    if (this.state === 'crouch' || this.state === 'cdash' || this.state === 'down' || this.state === 'getup') return true;
    if (this.state === 'blockstun' && this.crouchBlock) return true;
    if (this.state === 'attack') {
      const c = this.move.crouch;
      if (c === true) return true;
      if (Array.isArray(c)) return this.mf >= c[0] && this.mf <= c[1];
    }
    return false;
  }

  resolve(cur) {
    for (const c of this.cmds) {
      if (c.need === 'rage' && !this.rage) continue;
      if (c.need === 'heatOn' && !this.heatOn) continue;
      if (c.need === 'heatReady' && (!this.heatReady || this.heatOn)) continue;
      if (c.b.length === 2) { if (!this.input.chord(c.b)) continue; }
      else if (!cur.press[c.b[0] - 1]) continue;
      if (c.motion) {
        const late = this.motionLate();
        if (late < 0) continue;
        if (c.m === 'ewgf') return late <= 1 ? 'ewgf' : 'wgf';
        return c.m;
      }
      if (c.ws && !(this.wsTimer > 0 && cur.dir >= 4)) continue;
      if (c.dir && !c.dir.includes(cur.dir)) continue;
      return c.m;
    }
    return null;
  }

  // f,n,d,df erkannt? Aus Crouch Dash / Wavedash reicht df (wie in Tekken). Rückgabe: Frames seit df oder -1
  motionLate() {
    const l = this.input.motionFNDDF();
    if (l >= 0) return l;
    if ((this.state === 'cdash' || this.waveWin > 0) && this.input.cur.dir === 3) return this.input.segs(30)[0].len - 1;
    return -1;
  }

  // String-Puffer: Tasten, die während eines Angriffs gedrückt werden, bleiben 14 Frames gemerkt.
  // So kommen schnell gedrückte Strings (1,2,1,4) sauber raus – auch wenn die Taste schon im vorherigen Teil kam.
  chainFor(cur) {
    if (cur.press.some(Boolean)) this.pressSeq = (this.pressSeq || 0) + 1;
    if (this.state === 'attack') for (let b = 1; b <= 4; b++) if (cur.press[b - 1]) this.chainBuf = { b, ttl: 14, seq: this.pressSeq };
    const m = this.move, cb = this.chainBuf;
    if (this.state !== 'attack' || !m || !m.chain || this.queued || !cb) return null;
    if (this.mf > m.st + m.act + 14) return null; // danach kein Abbruch der Recovery mehr
    const c = m.chain.find(c => c.b === cb.b);
    if (!c) return null;
    this.chainBuf = null; this.buffer = null;
    return c.m;
  }

  startCdash() {
    this.state = 'cdash'; this.t = 0;
    FX.spark(this.x - this.facing * 20, GROUND_Y - 4, 'rgba(200,190,170,0.9)', 6, 3);
    Sfx.play('step');
  }

  startMove(id, fromChain, seq) {
    // String-Puffer nur behalten, wenn die Taste NACH dem Start-Befehl kam
    if (!fromChain && !(seq && this.chainBuf && this.chainBuf.seq > seq)) this.chainBuf = null;
    this.state = 'attack';
    this.moveId = id;
    this.move = this.moves[id];
    this.mf = 1; // Startframe zählt als Frame 1 (wie Tekken-Framedaten)
    this.hasHit = false;
    this.lastBlocked = false;
    this.queued = null;
    this.buffer = null;
    this.vx = 0;
    if (id === 'heatburst') {
      this.heatReady = false; this.heatOn = true; this.heat = HEAT_TIME;
      FX.text('SURGE!', this.x, this.sy(230), this.colors.elec, 40, 60);
      FX.ring(this.x, this.sy(100), this.colors.elec, 120);
      FX.burstBolts(this.x, this.sy(100), this.colors.elec, 8, 120);
      Sfx.play('heat');
    }
    if (id === 'rageart') {
      this.rage = false; this.rageUsed = true;
      FX.darken = 40; FX.text('RAGE STRIKE', this.x, this.sy(240), '#ff3030', 44, 60);
      Sfx.play('heat');
    }
    if (id === 'heatsmash') FX.text(this.move.name, this.x, this.sy(240), this.colors.elec, 36, 60);
    if (id === 'ewgf') Sfx.play('zap');
  }

  // ---------- pro Frame: Eingaben verarbeiten ----------
  think(opp) {
    const cur = this.input.sample(this.facing);
    if (this.flash > 0) this.flash--;
    if (this.elecGlow > 0) this.elecGlow--;
    if (this.invuln > 0) this.invuln--;
    if (this.heatOn && this.state !== 'attack') { this.heat--; if (this.heat <= 0) this.heatOn = false; }
    if (!this.rageUsed && !this.rage && this.hp > 0 && this.hp <= MAX_HP * 0.3) {
      this.rage = true; FX.text('RAGE', this.x, this.sy(230), '#ff3030', 34, 50);
    }
    if (this.dead) { this.thinkPassive(opp); return; }

    let cmd = null;
    // While-Standing-Fenster: Hocke (auch Block-Hocke oder Hock-Move) verlassen -> 10 Frames WS-Moves
    if (this.wsTimer > 0) this.wsTimer--;
    if (this.chainBuf && --this.chainBuf.ttl < 0) this.chainBuf = null;
    if (this.waveWin > 0) this.waveWin--;
    const inCrouch = this.state === 'crouch' || this.state === 'cdash' || (this.state === 'blockstun' && this.crouchBlock) ||
      (this.state === 'attack' && this.move && this.move.crouch === true && this.mf >= this.move.st + this.move.act);
    if (inCrouch && cur.dir >= 4) this.wsTimer = 10;
    if (cur.press.some(Boolean)) cmd = this.resolve(cur);

    if (this.state === 'attack') {
      // Taste kam 1-2 Frames vor df (noch auf d) -> zum Motion-Move upgraden (z.B. d+4 -> Hellsweep)
      if (cmd === null && this.mf <= 3 && ['d1', 'd2', 'd4'].includes(this.moveId) && cur.dir === 3 && this.motionLate() >= 0) {
        const btn = +this.moveId[1];
        const mc = this.cmds.find(c => c.motion && c.b.length === 1 && c.b[0] === btn);
        if (mc && cur.btn[btn - 1]) this.startMove(mc.m === 'ewgf' ? 'wgf' : mc.m);
      }
      // Knopf-Kombination kam 1-2 Frames später -> upgraden
      if (cmd && cmd !== this.moveId && this.mf <= 3 && this.moves[cmd] && this.cmds.find(c => c.m === cmd && c.b.length === 2)) {
        this.startMove(cmd); cmd = null;
      }
      const nx = this.chainFor(cur);
      if (nx) { this.queued = nx; cmd = null; }
    }
    // Erster gepufferter Befehl bleibt stehen; weitere Tasten während eines Angriffs laufen in den String-Puffer
    if (cmd && !(this.state === 'attack' && this.buffer)) this.buffer = { m: cmd, ttl: this.state === 'attack' ? 16 : 10, seq: this.pressSeq };
    if (this.buffer && --this.buffer.ttl < 0) this.buffer = null;

    if (this.actionable && this.grounded && Math.abs(opp.x - this.x) > 4 && !opp.dead) {
      const nf = opp.x > this.x ? 1 : -1;
      if (nf !== this.facing && opp.grounded) this.facing = nf;
    }

    const d = cur.dir;
    switch (this.state) {
      case 'idle': case 'crouch': {
        if (this.buffer) { this.startMove(this.buffer.m, false, this.buffer.seq); break; }
        this.walking = 0; this.vx = 0;
        if (this.input.motionFND() || (this.waveWin > 0 && this.input.motionWave())) this.startCdash();
        else if (d <= 3) this.state = 'crouch';
        else if (d >= 7) { this.state = 'prejump'; this.t = 0; }
        else if (this.input.doubleTap(6)) { this.state = 'dash'; this.t = 0; }
        else if (this.input.doubleTap(4)) { this.state = 'backdash'; this.t = 0; }
        else {
          this.state = 'idle';
          if (d === 6) { this.walking = 1; this.vx = 3.6 * this.facing; }
          if (d === 4) { this.walking = -1; this.vx = -3.0 * this.facing; }
          this.walkPhase += this.walking * 0.26;
        }
        break;
      }
      case 'cdash': case 'dash': case 'backdash': {
        if (this.buffer) { this.startMove(this.buffer.m, false, this.buffer.seq); break; }
        this.t++;
        const st = this.state;
        // Wavedash / Korean Backdash: Bewegungen lassen sich ketten bzw. abbrechen
        // Wavedash: n,d (oder f,n,d) während des Crouch Dash -> nächster Crouch Dash
        if (st === 'cdash' && this.t > 4 && (this.input.motionFND() || this.input.motionWave())) this.startCdash();
        if (st === 'backdash' && this.t > 8 && this.input.doubleTap(4)) this.t = 0;
        if (st === 'backdash' && this.t > 8 && d === 1) { this.state = 'crouch'; this.vx = 0; break; }
        if (st === 'dash' && this.t > 5 && (d === 4 || d <= 3)) { this.state = d <= 3 ? 'crouch' : 'idle'; this.vx = 0; break; }
        const len = st === 'backdash' ? 18 : st === 'cdash' ? 16 : 12;
        const sp = st === 'backdash' ? -8 : st === 'cdash' ? 9 : 8.5;
        const k = 1 - this.t / len;
        this.vx = sp * this.facing * k * (0.6 + 0.4 * k);
        if (this.t >= len) { if (st === 'cdash') this.waveWin = 12; this.state = d <= 3 ? 'crouch' : 'idle'; }
        break;
      }
      case 'prejump': {
        if (this.buffer) { this.startMove(this.buffer.m, false, this.buffer.seq); break; }
        if (++this.t >= 5) {
          this.state = 'jump'; this.vy = 13;
          this.vx = (d === 9 ? 3.2 : d === 7 ? -3.2 : 0) * this.facing;
        }
        break;
      }
      default: this.thinkPassive(opp);
    }
  }

  // Zustände ohne Spielerkontrolle
  thinkPassive(opp) {
    const cur = this.input.cur;
    switch (this.state) {
      case 'attack': {
        const m = this.move;
        this.mf++;
        this.vx = (m.adv && this.mf <= m.st) ? (m.adv / m.st) * this.facing : 0;
        if (m.air) {
          const [a, b] = m.air;
          this.airMove = this.mf >= a && this.mf <= b;
          this.y = this.airMove ? Math.sin(Math.PI * (this.mf - a) / (b - a)) * 45 : 0;
        }
        if (m.fx === 'elec' && this.mf >= m.st - 4 && this.mf < m.st + m.act + 2) this.elecGlow = 2;
        if (m.fx === 'beam' && this.mf === m.st) {
          FX.beam(this.sx(70), this.sy(150), this.facing, this.colors.elec, 26); FX.shake = 10; Sfx.play('beam');
        }
        if (m.fx === 'thunder' && this.moveId === 'heatsmash' && this.mf === m.st) {
          const tx = Math.abs(opp.x - this.x) <= m.reach ? opp.x : this.sx(m.reach * 0.7);
          for (let i = 0; i < 3; i++) FX.bolt(tx + (Math.random() - 0.5) * 40, 0, tx, GROUND_Y - 10, this.colors.elec, 22, 6);
          FX.flash = 6; FX.flashColor = this.colors.elec; FX.shake = 14; Sfx.play('zap');
        }
        if (this.queued && this.mf >= m.st + m.act) { this.startMove(this.queued, true); break; }
        if (this.mf >= moveTotal(m)) {
          if (this.moveId === 'heatsmash') { this.heatOn = false; this.heat = 0; }
          this.airMove = false; this.y = 0;
          this.state = cur.dir <= 3 ? 'crouch' : 'idle';
          this.resetCombo(opp);
        }
        break;
      }
      case 'jump':
        break; // Physik
      case 'hitstun':
        if (--this.stun <= 0) {
          if (this.crumple || this.hp <= 0) { this.launch(2, 0.5 * -this.facing, true); }
          else { this.state = cur.dir <= 3 ? 'crouch' : 'idle'; this.resetCombo(opp); }
        }
        break;
      case 'blockstun':
        if (--this.stun <= 0) { this.state = cur.dir <= 3 ? 'crouch' : 'idle'; this.resetCombo(opp); }
        break;
      case 'splat':
        this.t++;
        this.y = Math.max(0, this.y - 1.5);
        if (this.t >= 34) this.launch(1, 0, true);
        break;
      case 'down':
        this.t++;
        if (this.dead) break;
        // Tech: Taste direkt beim Aufkommen -> sofort hoch
        if (this.t > 1 && this.t < 10 && this.input.anyPress()) { this.state = 'getup'; this.t = 0; this.quick = true; Sfx.play('step'); }
        // danach: Richtung oder Taste -> aufstehen, spätestens nach 30 Frames automatisch
        else if ((this.t >= 12 && (cur.dir !== 5 || this.input.anyPress())) || this.t >= 30) { this.state = 'getup'; this.t = 0; this.quick = false; }
        break;
      case 'getup':
        this.t++; this.invuln = 2;
        if (this.t >= (this.quick ? 10 : 14)) { this.state = 'idle'; this.resetCombo(opp); }
        break;
      case 'throwing':
        if (++this.t >= 42) this.state = 'idle';
        break;
      case 'grabbed': {
        this.t++;
        const g = this.grabber;
        if (this.t <= 16 && (this.input.cur.press[0] || this.input.cur.press[1])) {
          // Wurf gebrochen
          this.state = 'blockstun'; this.stun = 16; this.crouchBlock = false;
          g.state = 'blockstun'; g.stun = 16; g.crouchBlock = false;
          this.slideV = (this.x > g.x ? 7 : -7); g.slideV = -this.slideV;
          FX.text('BREAK!', (this.x + g.x) / 2, GROUND_Y - 220, '#fff', 34, 40);
          FX.spark((this.x + g.x) / 2, GROUND_Y - 140, '#fff', 14);
          Sfx.play('block');
        } else if (this.t === 30) {
          const dmg = Math.round(g.moves.throw.dmg * (g.rage ? 1.1 : 1));
          this.hp = Math.max(0, this.hp - dmg); this.combo = 1;
          this.facing = -g.facing;
          this.x = g.sx(40);
          this.launch(9, -3 * g.facing, true);
          this.x = g.x - g.facing * 10;
          this.vx = -5 * g.facing;
          FX.shake = 12; FX.spark(this.x, GROUND_Y - 80, '#ffd27a', 20); Sfx.play('heavy');
          this.showDamage(dmg, false);
          G.onDamage(this);
        }
        break;
      }
    }
  }

  resetCombo(opp) { this.screwed = false; this.spin = 0; this.comboHp = this.hp; this.combo = 0; this.scale = 1; this.juggleHits = 0; this.noJuggle = false; this.crumple = false; this.splatUsed = false; }

  launch(vy, vx, noJuggle) {
    this.state = 'air'; this.vy = vy; this.vx = vx; this.y = Math.max(this.y, 1);
    this.noJuggle = !!noJuggle; this.crumple = false;
  }

  // ---------- Physik ----------
  physics() {
    if (this.state === 'air' || this.state === 'jump') {
      this.vy -= this.state === 'air' ? 0.85 : GRAVITY;
      this.y += this.vy;
      this.x += this.vx;
      if (this.state === 'air') {
        if (this.spin) this.spin += 0.42; // Tornado-Drehung
        this.rotation = Math.max(-0.5, Math.min(0.5, this.vy * 0.03)) + (this.spin || 0);
      }
      if (this.state === 'air' && !this.splatUsed && this.combo > 0 && (this.x <= WALL_L + 2 || this.x >= WALL_R - 2) && Math.abs(this.vx) > 1.2 && this.y > 20) {
        this.state = 'splat'; this.t = 0; this.splatUsed = true; this.vx = 0; this.vy = 0; this.rotation = 0;
        FX.text('WALL SPLAT', this.x, GROUND_Y - this.y - 200, '#ffb14a', 30, 45); FX.shake = 10; Sfx.play('heavy');
      }
      if (this.y <= 0 && this.vy < 0) {
        this.y = 0; this.vy = 0; this.rotation = 0; this.spin = 0;
        if (this.state === 'jump') { this.state = 'idle'; this.vx = 0; }
        else {
          this.state = 'down'; this.t = 0; this.vx = 0;
          FX.spark(this.x, GROUND_Y - 5, '#a08070', 10, 4); FX.shake = Math.max(FX.shake, 5); Sfx.play('land');
        }
      }
    } else {
      this.x += this.vx;
      if (this.state !== 'attack' || !this.move || !this.move.air) this.y = 0;
      this.rotation = 0;
    }
    this.x += this.slideV;
    this.slideV *= 0.8;
    if (Math.abs(this.slideV) < 0.1) this.slideV = 0;
    this.x = Math.max(WALL_L, Math.min(WALL_R, this.x));
  }

  showDamage(dmg, counter) {
    if (dmg > 0) FX.text(String(dmg), this.x + (Math.random() - 0.5) * 30, this.sy(200), counter ? '#ff5050' : '#ffe9a0', 22, 30);
  }

  // ---------- Pose ----------
  getPose() {
    const P = POSES;
    const time = G.time;
    switch (this.state) {
      case 'idle': {
        if (this.walking) return walkPose(this.walkPhase);
        const p = lerpPose(P.idle, P.idle, 0), b = Math.sin(time * 0.08) * 2;
        for (const j of ['hip', 'neck', 'head', 'fe', 'fh', 'be', 'bh']) p[j][1] += b;
        return p;
      }
      case 'crouch': return P.crouch;
      case 'cdash': return lerpPose(P.crouch, P.crouchwind, 0.6);
      case 'dash': return lerpPose(P.idle, P.midpunch, 0.3);
      case 'backdash': return lerpPose(P.idle, P.hit, 0.3);
      case 'prejump': return lerpPose(P.idle, P.crouch, 0.5);
      case 'jump': return lerpPose(P.idle, P.crouch, 0.6);
      case 'attack': {
        const m = this.move, strike = P[m.pose], wind = m.wind ? P[m.wind] : null;
        const base = (m.crouch === true || this.moveId.startsWith('ws')) ? P.crouch : P.idle;
        const end = m.crouch === true ? P.crouch : P.idle;
        if (this.mf < m.st) {
          const t = this.mf / m.st;
          // Ausholen, dann in den letzten Frames schnell zuschlagen (Snap)
          if (wind) return t < 0.65 ? lerpPose(base, wind, easeOut(t / 0.65)) : lerpPose(wind, strike, easeOut((t - 0.65) / 0.35));
          return lerpPose(base, strike, t < 0.5 ? 0.12 * t / 0.5 : 0.12 + 0.88 * easeOut((t - 0.5) / 0.5));
        }
        if (this.mf < m.st + m.act) return strike;
        const r = (this.mf - (m.st + m.act - 1)) / m.rec;
        return lerpPose(strike, end, easeOut(Math.min(1, r)));
      }
      case 'hitstun': {
        if (this.crumple) return lerpPose(P.hit, P.crumple, Math.min(1, (50 - this.stun) / 12));
        return this.stun < 6 ? lerpPose(P.idle, P.hit, this.stun / 6) : P.hit;
      }
      case 'blockstun': {
        const bp = this.crouchBlock ? P.cblock : P.block;
        return this.stun < 4 ? lerpPose(this.crouchBlock ? P.crouch : P.idle, bp, this.stun / 4) : bp;
      }
      case 'air': return P.air;
      case 'splat': return P.splat;
      case 'down': return P.down;
      case 'getup': return lerpPose(P.down, P.idle, easeOut(Math.min(1, this.t / (this.quick ? 10 : 14))));
      case 'grabbed': return P.hit;
      case 'throwing': return this.t < 28 ? P.grab : P.paw;
      case 'win': return P.win;
    }
    return P.idle;
  }
}
