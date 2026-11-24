'use strict';
// ===================== ONLINE (Peer-to-Peer über WebRTC / PeerJS) =====================
// Host = Spieler links (Index 0), Gast = Spieler rechts (Index 1).
// Netcode: Lockstep mit fester Eingabeverzögerung. Beide Rechner simulieren identisch,
// übertragen werden nur die Tastenzustände (Bits) pro Frame.

const NET_PREFIX = 'stormfist-v1-';
const NET_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const NET_SLOTS = 4;

function netHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  // Finalizer: mischt alle Bits durch (sonst wären die unteren Bits zu ähnlich)
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
function netCode(seed) {
  let s = '';
  for (let i = 0; i < 4; i++) s += NET_ALPHA[netHash(seed + ':' + i) % NET_ALPHA.length];
  return s;
}
function randomCode() { let s = ''; for (let i = 0; i < 4; i++) s += NET_ALPHA[Math.floor(Math.random() * NET_ALPHA.length)]; return s; }

// Öffentliche IP des eigenen Netzes per STUN ermitteln (macht der Browser selbst, kein extra Dienst).
// Wer im selben Netz ist, hat dieselbe -> daraus wird die Raum-ID abgeleitet (Auto-Finden).
function detectNetId(timeout = 2500) {
  return new Promise(resolve => {
    let pc = null, done = false;
    const fin = v => { if (done) return; done = true; try { pc && pc.close(); } catch (e) { /* egal */ } resolve(v); };
    try { pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); } catch (e) { return resolve(null); }
    pc.createDataChannel('x');
    pc.onicecandidate = e => {
      if (!e.candidate) return fin(null);
      const c = e.candidate.candidate || '';
      if (/ typ srflx /.test(c)) fin(c.split(' ')[4]);
    };
    pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => fin(null));
    setTimeout(() => fin(null), timeout);
  });
}

const Net = {
  peer: null, conn: null, role: null, status: '', code: '', needCode: false, error: '',
  active: false, delay: 3, frame: 0, sent: 0, local: {}, remote: {}, cur: [0, 0], prevCur: [0, 0], startEdge: false,
  localIdx: 0, rtt: 0, stall: 0, desync: false, hashes: {}, tickN: 0, attempt: 0, gen: 0,

  get available() { return typeof Peer !== 'undefined'; },

  reset() {
    this.gen++;
    try { this.conn && this.conn.close(); } catch (e) { /* egal */ }
    try { this.peer && this.peer.destroy(); } catch (e) { /* egal */ }
    Object.assign(this, { peer: null, conn: null, role: null, status: '', code: '', needCode: false, error: '', active: false, desync: false, stall: 0, rtt: 0 });
  },
  leave() { if (this.conn) this.send({ t: 'bye' }); setTimeout(() => this.reset(), 100); this.active = false; },
  send(msg) { try { if (this.conn && this.conn.open) this.conn.send(msg); } catch (e) { /* egal */ } },

  // ---------------- Host ----------------
  async host() {
    this.reset(); const gen = this.gen;
    this.role = 'host';
    if (!this.available) { this.error = 'Online nicht verfügbar (keine Internetverbindung?)'; return; }
    this.status = 'Netzwerk wird erkannt…';
    const nid = await detectNetId();
    if (gen !== this.gen) return;
    const open = slot => {
      const code = nid ? netCode(nid + '#' + slot) : randomCode();
      const peer = new Peer(NET_PREFIX + code, { debug: 0 });
      peer.on('open', () => { if (gen !== this.gen) return; this.peer = peer; this.code = code; this.status = 'Warte auf Gegner…'; });
      peer.on('error', err => {
        if (gen !== this.gen) return;
        if (err.type === 'unavailable-id' && slot < NET_SLOTS) { peer.destroy(); open(slot + 1); }
        else this.error = 'Verbindungsfehler: ' + (err.type || err.message);
      });
      peer.on('connection', conn => this.accept(conn));
      peer.on('disconnected', () => { try { peer.reconnect(); } catch (e) { /* egal */ } });
    };
    open(1);
  },
  accept(conn) {
    if (this.conn) { conn.on('open', () => { conn.send({ t: 'busy' }); setTimeout(() => conn.close(), 300); }); return; }
    this.conn = conn;
    this.bind(conn);
    this.status = 'Gegner verbindet…';
  },

  // ---------------- Gast ----------------
  async join(manualCode) {
    this.reset(); const gen = this.gen;
    this.role = 'guest';
    if (!this.available) { this.error = 'Online nicht verfügbar (keine Internetverbindung?)'; return; }
    this.status = manualCode ? 'Verbinde mit ' + manualCode + '…' : 'Suche Spiel im Netzwerk…';
    const nid = manualCode ? null : await detectNetId();
    if (gen !== this.gen) return;
    const codes = manualCode ? [manualCode] : nid ? Array.from({ length: NET_SLOTS }, (_, i) => netCode(nid + '#' + (i + 1))) : [];
    if (!codes.length) { this.status = 'Kein Spiel gefunden'; this.needCode = true; return; }
    const peer = new Peer({ debug: 0 });
    this.peer = peer;
    let idx = -1, timer = null;
    const next = () => {
      if (gen !== this.gen || this.conn && this.conn.open) return;
      clearTimeout(timer);
      idx++;
      if (idx >= codes.length) { this.status = manualCode ? 'Kein Spiel mit Code ' + manualCode : 'Kein Spiel im Netzwerk gefunden'; this.needCode = true; return; }
      const conn = peer.connect(NET_PREFIX + codes[idx], { reliable: true });
      const myIdx = idx;
      timer = setTimeout(() => { if (idx === myIdx && !(conn.open)) { try { conn.close(); } catch (e) { /* egal */ } next(); } }, 3500);
      conn.on('open', () => {
        if (gen !== this.gen) return;
        clearTimeout(timer);
        this.conn = conn; this.code = codes[idx];
        this.bind(conn);
        this.status = 'Verbunden – Spiel startet…';
        this.send({ t: 'hello', char: G.sel[0], v: 1 });
      });
      conn.on('data', d => { if (d && d.t === 'busy') { this.conn = null; next(); } });
    };
    peer.on('open', () => next());
    peer.on('error', err => {
      if (gen !== this.gen) return;
      if (err.type === 'peer-unavailable') next();
      else this.error = 'Verbindungsfehler: ' + (err.type || err.message);
    });
  },

  // ---------------- gemeinsame Verbindung ----------------
  bind(conn) {
    const gen = this.gen;
    conn.on('data', d => { if (gen === this.gen) this.onData(d); });
    conn.on('close', () => { if (gen === this.gen) this.lost(); });
    conn.on('error', () => { if (gen === this.gen) this.lost(); });
  },
  lost() {
    if (!this.conn) return;
    this.conn = null; this.active = false;
    if (G.online) G.netLost();
  },
  onData(d) {
    if (!d || !d.t) return;
    switch (d.t) {
      case 'i': this.remote[d.f] = d.b; break;
      case 'h': this.checkHash(d.f, d.h, true); break;
      case 'ping': this.send({ t: 'pong', ts: d.ts }); break;
      case 'pong': this.rtt = performance.now() - d.ts; if (this.role === 'host' && this.pendingStart) this.sendStart(); break;
      case 'hello': // nur Host
        if (this.role !== 'host') break;
        this.guestChar = d.char | 0;
        this.pendingStart = true;
        this.send({ t: 'ping', ts: performance.now() });
        break;
      case 'start': // nur Gast
        if (this.role === 'guest') G.startOnline(d, 1);
        break;
      case 'bye': this.lost(); break;
    }
  },
  sendStart() {
    this.pendingStart = false;
    // Eingabeverzögerung nach Ping: im LAN 2-3 Frames
    const delay = Math.max(2, Math.min(8, Math.ceil(this.rtt / 2 / 16.7) + 2));
    const msg = { t: 'start', delay, map: G.map, time: G.timeOpt, music: G.music, chars: [G.sel[0], this.guestChar] };
    this.send(msg);
    G.startOnline(msg, 0);
  },

  // ---------------- Lockstep ----------------
  startLock(delay, localIdx) {
    Object.assign(this, { active: true, delay, localIdx, frame: 0, local: {}, remote: {}, cur: [0, 0], prevCur: [0, 0], hashes: {}, desync: false, stall: 0 });
    for (let f = 0; f < delay; f++) { this.local[f] = 0; this.remote[f] = 0; }
    this.sent = delay - 1;
  },
  tick() {
    if (!this.active) { G.step(); return; }
    this.tickN++;
    if (this.tickN % 120 === 0) this.send({ t: 'ping', ts: performance.now() });
    // eigene Eingabe für (frame + delay) erfassen und senden
    if (this.sent < this.frame + this.delay) {
      const f = ++this.sent, b = InputReader.rawBits(KEYMAPS);
      this.local[f] = b;
      this.send({ t: 'i', f, b });
    }
    let steps = 0;
    while (steps < 2 && this.local[this.frame] !== undefined && this.remote[this.frame] !== undefined) {
      if (steps === 1 && this.remote[this.frame + 2] === undefined) break; // 2. Schritt nur zum Aufholen
      this.cur[this.localIdx] = this.local[this.frame];
      this.cur[1 - this.localIdx] = this.remote[this.frame];
      this.startEdge = [0, 1].some(i => (this.cur[i] & 256) && !(this.prevCur[i] & 256));
      this.prevCur = this.cur.slice();
      G.step();
      if (this.frame % 60 === 0) { const h = this.stateHash(); this.send({ t: 'h', f: this.frame, h }); this.checkHash(this.frame, h, false); }
      delete this.local[this.frame - 120]; delete this.remote[this.frame - 120];
      this.frame++; steps++;
    }
    this.stall = steps ? 0 : this.stall + 1;
  },
  stateHash() {
    let s = G.mode + '|' + G.round + '|' + (isFinite(G.timer) ? G.timer : -1);
    for (const f of G.p) s += '|' + Math.round(f.x * 100) + ',' + Math.round(f.y * 100) + ',' + f.hp + ',' + f.state + ',' + f.mf;
    return netHash(s);
  },
  checkHash(f, h, remote) {
    const e = this.hashes[f] || (this.hashes[f] = {});
    e[remote ? 'r' : 'l'] = h;
    if (e.r !== undefined && e.l !== undefined) { if (e.r !== e.l) this.desync = true; delete this.hashes[f]; }
  },
};
