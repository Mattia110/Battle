'use strict';
// ===================== SPIELABLAUF =====================
const W = 1280, H = 720;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const CHAR_KEYS = Object.keys(CHARS);
const TIME_OPTS = [30, 45, 60, 90, 99, 0]; // 0 = unbegrenzt
const MENU_ROWS = ['MODUS', 'P1', 'P2', 'MAP', 'ZEIT', 'MUSIK'];
const MODE_OPTS = ['LOKAL', 'ONLINE HOSTEN', 'ONLINE BEITRETEN'];

// Einstellungen merken (falls der Browser es erlaubt)
function loadSettings() {
  const d = { sel: [0, 1], map: 0, time: 2, music: 0 };
  try { const s = JSON.parse(localStorage.getItem('stormfist-settings') || 'null'); if (s) Object.assign(d, s); } catch (e) { /* egal */ }
  d.sel = d.sel.map(v => Math.min(CHAR_KEYS.length - 1, Math.max(0, v | 0)));
  d.map = Math.min(STAGES.length - 1, Math.max(0, d.map | 0));
  d.time = Math.min(TIME_OPTS.length - 1, Math.max(0, d.time | 0));
  d.music = Math.min(TRACKS.length, Math.max(0, d.music | 0)); // TRACKS.length = aus
  return d;
}
function saveSettings() {
  try { localStorage.setItem('stormfist-settings', JSON.stringify({ sel: G.sel, map: G.map, time: G.timeOpt, music: G.music })); } catch (e) { /* egal */ }
}
const SETTINGS = loadSettings();

const G = {
  mode: 'title', modeT: 0, time: 0, hitstop: 0, timer: 60 * 60, round: 1,
  p: [], sel: SETTINGS.sel, map: SETTINGS.map, timeOpt: SETTINGS.time, music: SETTINGS.music, menuRow: 0, modeOpt: 0, online: null, codeInput: '', leaveAsk: false, combo: null, paused: false, prevKeys: new Set(), koText: '', winner: null,
  preview: null,

  pressed(code) { return Keys.held.has(code) && !this.prevKeys.has(code); },
  pressedAny(codes) { return codes.some(c => this.pressed(c)); },

  startMatch() {
    const chars = this.online ? this.online.chars : this.sel;
    const k0 = CHAR_KEYS[chars[0]], k1 = CHAR_KEYS[chars[1]];
    this.p = [new Fighter(0, k0, false), new Fighter(1, k1, k0 === k1)];
    // Online: beide Kämpfer bekommen ihre Eingaben aus dem synchronisierten Netz-Stream
    if (this.online) this.p.forEach(f => { f.input.source = () => Net.cur[f.idx]; });
    this.round = 1;
    this.startRound();
  },
  startRound() {
    this.p[0].reset(440, 1);
    this.p[1].reset(840, -1);
    this.p.forEach(f => { f.comboHp = f.hp; });
    const sec = TIME_OPTS[this.timeOpt];
    this.timer = sec ? sec * 60 : Infinity; this.hitstop = 0; this.combo = null; this.paused = false;
    FX.clear();
    this.setMode('intro');
    Sfx.play('bell');
  },
  setMode(m) { this.mode = m; this.modeT = 0; },

  // ---------- Online ----------
  startOnline(msg, localIdx) {
    this.online = { localIdx, chars: [msg.chars[0] | 0, msg.chars[1] | 0] };
    this.map = msg.map | 0; this.timeOpt = msg.time | 0; this.music = msg.music | 0;
    this.leaveAsk = false;
    Net.startLock(msg.delay | 0 || 3, localIdx);
    this.startMatch();
  },
  leaveOnline() { Net.leave(); this.online = null; this.leaveAsk = false; this.setMode('title'); },
  netLost() { this.online = null; this.leaveAsk = false; this.setMode('netlost'); Sfx.play('bell'); },

  onDamage(def) {
    if (def.hp <= 0 && !def.dead) {
      def.dead = true;
      if (this.mode === 'fight') {
        this.setMode('ko');
        const both = this.p.every(f => f.dead);
        this.koText = both ? 'DOUBLE K.O.' : 'K.O.';
        FX.flash = 8; FX.flashColor = '#fff';
        Sfx.play('ko');
      }
    }
  },
  comboText(att, n) {
    const def = this.p[1 - att.idx];
    this.combo = { idx: att.idx, n, dmg: Math.max(0, (def.comboHp ?? MAX_HP) - def.hp), t: 80 };
  },

  endRound() {
    const [a, b] = this.p;
    let w = null;
    if (a.hp > b.hp) w = a; else if (b.hp > a.hp) w = b;
    if (w) w.wins++;
    this.winner = w;
    if (this.p.some(f => f.wins >= 2) || this.round >= 5) { this.setMode('matchend'); return; }
    this.round++;
    this.startRound();
  },

  sim() {
    const [a, b] = this.p;
    if (this.hitstop > 0) {
      this.hitstop--;
      a.bufferDuringStop(); b.bufferDuringStop();
      return;
    }
    a.think(b); b.think(a);
    a.physics(); b.physics();
    resolvePush(a, b);
    const h0 = checkHit(a, b), h1 = checkHit(b, a);
    if (h0) h0();
    if (h1) h1();
    for (const f of this.p) {
      if (f.dispHp > f.hp) f.dispHp = Math.max(f.hp, f.dispHp - (f.combo > 0 ? 0.15 : 1.2));
      else f.dispHp = f.hp;
      if (f.combo === 0) f.comboHp = f.hp;
    }
    if (this.combo) this.combo.t--;
  },

  step() {
    this.time++;
    if (this.pressed('KeyM')) Music.toggleMute();
    Music.want = this.music < TRACKS.length ? this.music : -1;
    Music.sync();
    switch (this.mode) {
      case 'title': {
        // Menü: W/S oder ↑/↓ wählt die Zeile, A/D oder ←/→ ändert den Wert
        const R = MENU_ROWS.length;
        if (this.pressedAny(['KeyW', 'ArrowUp'])) { this.menuRow = (this.menuRow + R - 1) % R; Sfx.play('step'); }
        if (this.pressedAny(['KeyS', 'ArrowDown'])) { this.menuRow = (this.menuRow + 1) % R; Sfx.play('step'); }
        const dl = this.pressedAny(['KeyA', 'ArrowLeft']) ? -1 : 0, dr = this.pressedAny(['KeyD', 'ArrowRight']) ? 1 : 0;
        const dv = dl + dr;
        if (dv) {
          const cyc = (v, n) => (v + dv + n) % n;
          const row = MENU_ROWS[this.menuRow];
          if (row === 'MODUS') this.modeOpt = cyc(this.modeOpt, MODE_OPTS.length);
          if (row === 'P1') this.sel[0] = cyc(this.sel[0], CHAR_KEYS.length);
          if (row === 'P2') this.sel[1] = cyc(this.sel[1], CHAR_KEYS.length);
          if (row === 'MAP') this.map = cyc(this.map, STAGES.length);
          if (row === 'ZEIT') this.timeOpt = cyc(this.timeOpt, TIME_OPTS.length);
          if (row === 'MUSIK') this.music = cyc(this.music, TRACKS.length + 1);
          Sfx.play('block'); saveSettings();
        }
        if (this.pressedAny(['Enter', 'Space'])) {
          saveSettings();
          if (this.modeOpt === 0) this.startMatch();
          else { this.setMode('lobby'); this.codeInput = ''; if (this.modeOpt === 1) Net.host(); else Net.join(); }
        }
        break;
      }
      case 'lobby': {
        this.modeT++;
        if (this.pressed('Escape')) { Net.reset(); this.setMode('title'); break; }
        if (Net.needCode && !Net.conn) {
          for (const ch of NET_ALPHA) {
            const code = /[0-9]/.test(ch) ? 'Digit' + ch : 'Key' + ch;
            if (this.pressed(code) && this.codeInput.length < 4) this.codeInput += ch;
          }
          if (this.pressed('Backspace')) this.codeInput = this.codeInput.slice(0, -1);
          if (this.pressed('Enter') && this.codeInput.length === 4) Net.join(this.codeInput);
        } else if (Net.error && this.pressed('Enter')) { Net.reset(); this.setMode('title'); }
        break;
      }
      case 'netlost':
        this.modeT++;
        if (this.modeT > 30 && this.pressedAny(['Enter', 'Escape', 'Space'])) this.setMode('title');
        break;
      case 'intro':
        this.modeT++;
        this.p.forEach(f => f.input.sample(f.facing));
        if (this.modeT >= 110) this.setMode('fight');
        break;
      case 'fight':
        if (this.online) {
          // Online gibt es keine Pause (das Spiel läuft auf beiden Rechnern synchron) – nur Verlassen
          if (this.pressed('Escape')) this.leaveAsk = !this.leaveAsk;
          if (this.leaveAsk && this.pressed('Enter')) { this.leaveOnline(); break; }
        } else {
          if (this.pressed('Escape')) this.paused = !this.paused;
          if (this.paused) { if (this.pressed('Enter')) { this.paused = false; this.setMode('title'); } break; }
        }
        this.sim();
        if (this.mode === 'fight' && this.hitstop === 0 && --this.timer <= 0) {
          this.timer = 0; this.setMode('timeup'); Sfx.play('bell');
        }
        break;
      case 'ko':
        this.modeT++;
        if (this.modeT > 70 || this.modeT % 3 === 0) this.sim();
        if (this.modeT > 90) this.p.forEach(f => { if (!f.dead && f.actionable && f.grounded) f.state = 'win'; });
        if (this.modeT >= 220) this.endRound();
        break;
      case 'timeup':
        this.modeT++;
        if (this.modeT >= 150) this.endRound();
        break;
      case 'matchend':
        this.modeT++;
        this.p.forEach(f => { if (f.state === 'win' || f.state === 'down') return; f.thinkPassive(this.p[1 - f.idx]); f.physics(); });
        if (this.modeT > 60 && (this.online ? Net.startEdge : this.pressedAny(['Enter', 'Space']))) this.startMatch();
        if (this.pressed('Escape')) { if (this.online) this.leaveOnline(); else this.setMode('title'); }
        break;
    }
    FX.update();
    this.prevKeys = new Set(Keys.held);
  },

  render() {
    ctx.save();
    if (FX.shake > 0) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
    drawStageBg(ctx, this.map, W, H, this.time);
    if (this.mode === 'title') { ctx.restore(); this.renderTitle(); return; }
    if (this.mode === 'lobby' || this.mode === 'netlost') { ctx.restore(); this.renderLobby(); return; }
    if (FX.darken > 0) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-20, -20, W + 40, H + 40); }
    const order = [...this.p].sort((x, y) => (x.state === 'attack') - (y.state === 'attack'));
    order.forEach(f => drawFighter(ctx, f, GROUND_Y, this.time));
    FX.draw(ctx);
    ctx.restore();
    if (FX.flash > 0) {
      ctx.globalAlpha = Math.min(0.5, FX.flash * 0.07); ctx.fillStyle = FX.flashColor;
      ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    }
    drawHUD(ctx, W);

    const t = this.modeT;
    if (this.mode === 'intro') {
      if (t < 60) drawBanner(ctx, W, H, this.round >= 5 ? 'FINAL ROUND' : 'ROUND ' + this.round, null, '#ffd23a');
      else drawBanner(ctx, W, H, 'FIGHT!', null, '#ff4030', 120);
    }
    if (this.mode === 'ko' && t > 10 && t < 200) drawBanner(ctx, W, H, this.koText, null, '#ff3030', 140);
    if (this.mode === 'timeup') drawBanner(ctx, W, H, 'TIME UP', null, '#ffd23a');
    if (this.mode === 'matchend') {
      const w = this.p.find(f => f.wins >= 2) || this.winner;
      drawBanner(ctx, W, H, w ? w.ch.name + ' GEWINNT!' : 'UNENTSCHIEDEN', t > 60 ? 'ENTER = Revanche   ·   ESC = Charakterwahl' : null, '#ffd23a', 84);
    }
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      drawBanner(ctx, W, H, 'PAUSE', 'ESC = weiter   ·   ENTER = Charakterwahl', '#fff');
    }
    if (this.online) this.renderNetInfo();
  },

  // kleine Online-Anzeige im Kampf
  renderNetInfo() {
    ctx.save();
    ctx.textAlign = 'center'; ctx.font = '700 14px Arial, sans-serif';
    const me = this.online.localIdx === 0 ? 'links' : 'rechts';
    const txt = 'ONLINE · du spielst ' + me + ' · Ping ' + Math.round(Net.rtt) + ' ms · Verzögerung ' + Net.delay + ' F';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(txt, W / 2, H - 12);
    ctx.fillStyle = '#9fe0ff'; ctx.fillText(txt, W / 2, H - 12);
    if (Net.stall > 20) drawBanner(ctx, W, H, 'WARTE AUF GEGNER…', null, '#9fe0ff', 48);
    if (Net.desync) { ctx.fillStyle = '#ff6060'; ctx.fillText('Synchronisationsfehler – bitte Match neu starten', W / 2, H - 32); }
    if (this.leaveAsk) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, H / 2 - 90, W, 150);
      drawBanner(ctx, W, H, 'MATCH VERLASSEN?', 'ENTER = verlassen   ·   ESC = weiterspielen (das Spiel läuft weiter!)', '#fff', 60);
    }
    ctx.restore();
  },

  renderLobby() {
    ctx.fillStyle = 'rgba(5,4,12,0.72)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    const big = (t, y, size, col) => { ctx.font = '900 italic ' + size + 'px Impact, "Arial Black", sans-serif'; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.strokeText(t, W / 2, y); ctx.fillStyle = col; ctx.fillText(t, W / 2, y); };
    const small = (t, y, col = '#ddd', size = 22) => { ctx.font = '700 ' + size + 'px Arial, sans-serif'; ctx.fillStyle = col; ctx.fillText(t, W / 2, y); };
    if (this.mode === 'netlost') {
      big('VERBINDUNG GETRENNT', 330, 72, '#ff6060');
      small('Der Gegner hat das Spiel verlassen oder die Verbindung ist abgebrochen.', 390);
      small('ENTER = zurück zum Menü', 450, '#ffd23a');
      return;
    }
    const host = Net.role === 'host';
    big(host ? 'ONLINE HOSTEN' : 'ONLINE BEITRETEN', 150, 72, '#9fe0ff');
    const dots = '.'.repeat(1 + Math.floor(this.modeT / 20) % 3);
    if (Net.error) {
      small(Net.error, 320, '#ff8080', 24);
      small('ENTER oder ESC = zurück', 380, '#ffd23a');
      return;
    }
    small((Net.status || '').replace(/…$/, '') + (Net.status.endsWith('…') ? dots : ''), 250, '#fff', 28);
    if (host && Net.code) {
      small('Dein Gegner im selben Netz drückt einfach „ONLINE BEITRETEN“.', 320);
      small('Falls er dich nicht findet, gibt er diesen Code ein:', 360, '#aaa', 18);
      big(Net.code, 450, 96, '#ffd23a');
    }
    if (!host && Net.needCode && !Net.conn) {
      small('Code vom Host eingeben (4 Zeichen), dann ENTER:', 330);
      const shown = (this.codeInput + '____').slice(0, 4).split('').join(' ');
      big(shown, 440, 96, '#ffd23a');
    }
    small('Du spielst: ' + CHARS[CHAR_KEYS[this.sel[0]]].name + (host ? '   ·   Map: ' + STAGES[this.map].name + '   ·   Zeit: ' + (TIME_OPTS[this.timeOpt] || '∞') : ''), 560, '#bbb', 18);
    small('ESC = abbrechen', 640, '#888', 18);
  },

  renderTitle() {
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = '900 italic 84px Impact, "Arial Black", sans-serif';
    ctx.lineWidth = 10; ctx.strokeStyle = '#000';
    ctx.strokeText('STORM FIST', W / 2, 105);
    const g = ctx.createLinearGradient(0, 40, 0, 110);
    g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#ff7a1a');
    ctx.fillStyle = g; ctx.fillText('STORM FIST', W / 2, 105);
    ctx.font = '700 20px Arial, sans-serif'; ctx.fillStyle = '#fff';
    ctx.lineWidth = 4; ctx.strokeText('Lokaler 2-Spieler-Modus', W / 2, 140); ctx.fillText('Lokaler 2-Spieler-Modus', W / 2, 140);

    // Kämpfer-Vorschau
    if (!this.preview || this.preview.key !== this.sel.join()) {
      const k0 = CHAR_KEYS[this.sel[0]], k1 = CHAR_KEYS[this.sel[1]];
      const a = new Fighter(0, k0, false), b = new Fighter(1, k1, k0 === k1);
      a.reset(230, 1); b.reset(1050, -1);
      this.preview = { key: this.sel.join(), f: [a, b] };
    }
    this.preview.f.forEach(f => {
      f.heatOn = (this.time % 240) > 160;
      drawFighter(ctx, f, GROUND_Y, this.time);
      ctx.textAlign = 'center';
      ctx.font = '900 italic 40px Impact, "Arial Black", sans-serif';
      ctx.lineWidth = 6; ctx.strokeStyle = '#000';
      ctx.strokeText(f.ch.name, f.x, 330); ctx.fillStyle = f.colors.elec; ctx.fillText(f.ch.name, f.x, 330);
      ctx.font = '700 18px Arial, sans-serif'; ctx.lineWidth = 4;
      ctx.strokeText(f.ch.sub, f.x, 356); ctx.fillStyle = '#fff'; ctx.fillText(f.ch.sub, f.x, 356);
    });

    // Menü
    const px = W / 2 - 230, py = 180, rowH = 62, pw = 460;
    ctx.fillStyle = 'rgba(10,8,18,0.78)';
    ctx.fillRect(px, py, pw, rowH * MENU_ROWS.length + 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, rowH * MENU_ROWS.length + 20);
    const values = {
      MODUS: MODE_OPTS[this.modeOpt],
      P1: CHARS[CHAR_KEYS[this.sel[0]]].name,
      P2: this.modeOpt ? '(Gegner wählt)' : CHARS[CHAR_KEYS[this.sel[1]]].name,
      MAP: STAGES[this.map].name,
      ZEIT: TIME_OPTS[this.timeOpt] ? TIME_OPTS[this.timeOpt] + ' Sek.' : '∞ Unbegrenzt',
      MUSIK: this.music < TRACKS.length ? TRACKS[this.music].name : 'AUS',
    };
    const labels = { MODUS: 'Modus', P1: this.modeOpt ? 'Du spielst' : 'Spieler 1', P2: 'Spieler 2', MAP: this.modeOpt === 2 ? 'Map (Host)' : 'Map', ZEIT: this.modeOpt === 2 ? 'Zeit (Host)' : 'Rundenzeit', MUSIK: 'Musik' };
    MENU_ROWS.forEach((row, i) => {
      const y = py + 10 + i * rowH, active = i === this.menuRow;
      if (active) {
        ctx.fillStyle = 'rgba(255,210,58,0.18)'; ctx.fillRect(px + 8, y, pw - 16, rowH - 6);
        ctx.strokeStyle = '#ffd23a'; ctx.lineWidth = 2; ctx.strokeRect(px + 8, y, pw - 16, rowH - 6);
      }
      ctx.textAlign = 'left'; ctx.font = '700 17px Arial, sans-serif';
      ctx.fillStyle = active ? '#ffd23a' : '#b9b3c7';
      ctx.fillText(labels[row], px + 24, y + 35);
      ctx.textAlign = 'center'; ctx.font = '900 italic 28px Impact, "Arial Black", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText(values[row], px + 300, y + 38);
      const sub = row === 'MODUS' ? ['2 Spieler an einer Tastatur', 'Gegner im selben Netz drückt „Beitreten“', 'findet das Spiel im Netz automatisch'][this.modeOpt] : row === 'MAP' ? STAGES[this.map].sub : row === 'MUSIK' ? (this.music < TRACKS.length ? TRACKS[this.music].sub : (Music.muted ? '' : 'keine Musik')) : '';
      if (sub) { ctx.font = '600 13px Arial, sans-serif'; ctx.fillStyle = '#b9b3c7'; ctx.fillText(sub, px + 300, y + 54); }
      if (active) {
        ctx.fillStyle = '#ffd23a'; ctx.font = '900 26px Arial, sans-serif';
        ctx.fillText('◀', px + 180, y + 37); ctx.fillText('▶', px + 420, y + 37);
      }
    });
    ctx.textAlign = 'center'; ctx.font = '700 16px Arial, sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000';
    const hint = 'W/S oder ↑/↓ = Zeile   ·   A/D oder ←/→ = ändern   ·   M = Musik ' + (Music.muted ? 'an' : 'stumm');
    ctx.strokeText(hint, W / 2, py + rowH * MENU_ROWS.length + 50); ctx.fillStyle = '#eee'; ctx.fillText(hint, W / 2, py + rowH * MENU_ROWS.length + 50);
    if (Math.floor(this.time / 30) % 2 === 0) {
      ctx.font = '900 34px Impact, "Arial Black", sans-serif'; ctx.fillStyle = '#fff';
      ctx.lineWidth = 6; ctx.strokeText('ENTER = KAMPF STARTEN', W / 2, 695); ctx.fillText('ENTER = KAMPF STARTEN', W / 2, 695);
    }
  },
};

// Eingaben während Hitstop puffern (wichtig für Strings & Juggles)
Fighter.prototype.bufferDuringStop = function () {
  const cur = this.input.sample(this.facing);
  if (this.dead || !cur.press.some(Boolean)) return;
  if (this.state === 'grabbed') return;
  const nx = this.chainFor(cur);
  if (nx) { this.queued = nx; return; }
  const cmd = this.resolve(cur);
  if (cmd && !(this.state === 'attack' && this.buffer)) this.buffer = { m: cmd, ttl: 10, seq: this.pressSeq };
};

// ===================== MAIN LOOP =====================
let acc = 0, last = performance.now();
const STEP = 1000 / 60;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= STEP) { Net.tick(); acc -= STEP; }
  G.render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
