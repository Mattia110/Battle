'use strict';
// ===================== CHARAKTERE & MOVES =====================
// lvl: h=high, m=mid, l=low, t=throw
// st=Startup (erster aktiver Frame), act=aktive Frames, rec=Recovery
// blk/hit = Frame-Vorteil bei Block/Treffer
// kd: 'launch' | 'kd' (Knockdown) | 'crumple' | null
function mv(o) {
  return Object.assign({
    act: 2, rec: 20, blk: -5, hit: 5, dmg: 10, reach: 110, push: 16,
    adv: 0, kd: null, launchVy: 13, chip: 0, wind: null, crouch: false, air: null,
    armor: null, fx: null, chain: null, chHit: null,
  }, o);
}

function commonMoves(o) {
  return {
    // --- Strings: chain = Folge-Moves (Taste während des Moves drücken) ---
    jab:  mv({ name: 'Jab', lvl: 'h', st: 10, rec: 14, dmg: 5, blk: 1, hit: 8, reach: 108, pose: 'jab', chain: [{ b: 1, m: 'jab11' }, { b: 2, m: 'jab2' }] }),
    jab11:  mv({ name: '1,1', lvl: 'h', st: 9, rec: 16, dmg: 6, blk: 0, hit: 7, reach: 110, pose: 'jab', adv: 6, chain: [{ b: 2, m: 'jab112' }] }),
    jab112: mv({ name: '1,1,2 Flash Combo', lvl: 'h', st: 9, rec: 22, dmg: 12, blk: -4, hit: 6, reach: 116, push: 28, pose: 'cross', adv: 10 }),
    jab2: mv({ name: '1,2', lvl: 'h', st: 8, rec: 18, dmg: 12, blk: -3, hit: 6, reach: 114, pose: 'cross', adv: 8, chain: [{ b: 1, m: 's121' }, { b: 2, m: 's122' }, { b: 4, m: 's124' }] }),
    s121:  mv({ name: '1,2,1 Body Blow', lvl: 'm', st: 11, rec: 20, dmg: 13, blk: -7, hit: 3, reach: 116, pose: 'midpunch', adv: 12, chain: [{ b: 4, m: 's1214' }] }),
    s1214: mv({ name: '1,2,1,4 Finisher', lvl: 'm', st: 13, act: 3, rec: 26, dmg: 17, blk: -13, kd: 'kd', reach: 130, pose: 'midkick', adv: 12 }),
    s122:  mv({ name: '1,2,2 Rising Smash', lvl: 'm', st: 13, act: 3, rec: 26, dmg: 16, blk: -12, kd: 'kd', reach: 112, pose: 'uppercut', wind: 'crouch', adv: 14 }),
    s124:  mv({ name: '1,2,4 High Kick', lvl: 'h', st: 12, act: 3, rec: 24, dmg: 17, blk: -9, kd: 'kd', reach: 134, pose: 'highkick', adv: 6 }),
    two:  mv({ name: 'Rechte Gerade', lvl: 'h', st: 10, rec: 16, dmg: 10, blk: -2, hit: 7, reach: 112, pose: 'cross', chain: [{ b: 1, m: 's21' }] }),
    s21:  mv({ name: '2,1 Elbow', lvl: 'm', st: 11, rec: 20, dmg: 13, blk: -5, hit: 5, reach: 114, pose: 'midpunch', adv: 10 }),
    three:mv({ name: 'Mid Kick', lvl: 'm', st: 14, act: 3, rec: 22, dmg: 14, blk: -8, hit: 4, reach: 128, pose: 'midkick', chain: [{ b: 4, m: 's34' }] }),
    s34:  mv({ name: '3,4 Roundhouse', lvl: 'h', st: 13, act: 3, rec: 26, dmg: 18, blk: -10, kd: 'kd', reach: 136, pose: 'highkick', adv: 8 }),
    four: mv({ name: 'High Kick', lvl: 'h', st: 12, act: 3, rec: 24, dmg: 16, blk: -9, hit: 5, reach: 134, pose: 'highkick', chain: [{ b: 3, m: 's43' }] }),
    s43:  mv({ name: '4,3 Low Sweep', lvl: 'l', st: 15, act: 3, rec: 26, dmg: 11, blk: -14, hit: 2, reach: 128, pose: 'clowkick', crouch: true, adv: 6 }),
    df1:  mv({ name: 'Middle Jab', lvl: 'm', st: 13, rec: 20, dmg: 13, blk: -1, hit: 4, reach: 120, pose: 'midpunch', adv: 10, chHit: 'crumple', chain: [{ b: 2, m: 'df12' }] }),
    df12: mv({ name: 'df+1,2', lvl: 'h', st: 10, rec: 20, dmg: 12, blk: -8, hit: 6, reach: 118, push: 24, pose: 'cross', adv: 8 }),
    // Tornado: dreht Gegner in der Luft -> Juggle-Verlängerung (1x pro Combo)
    f4:   mv({ name: 'Tornado Kick', lvl: 'm', st: 13, act: 3, rec: 24, dmg: 14, blk: -12, hit: 4, reach: 126, pose: 'midkick', adv: 16, screw: true }),
    df2:  mv({ name: 'Rising Uppercut', lvl: 'm', st: 15, act: 3, rec: 20, dmg: 15, blk: -12, kd: 'launch', launchVy: 16.5, reach: 108, pose: 'uppercut', wind: 'crouch' }),
    // --- Hock-Moves (bleiben in der Hocke, unterlaufen Highs) ---
    d1:   mv({ name: 'Crouch Jab', lvl: 'sm', st: 10, rec: 14, dmg: 5, blk: -5, hit: 6, reach: 104, pose: 'cjab', crouch: true }),
    d2:   mv({ name: 'Crouch Straight', lvl: 'l', st: 11, rec: 18, dmg: 8, blk: -6, hit: 4, reach: 112, pose: 'cpunch', crouch: true }),
    d3:   mv({ name: 'Shin Kick', lvl: 'l', st: 15, act: 3, rec: 24, dmg: 12, blk: -13, hit: -2, reach: 128, pose: 'clowkick', crouch: true }),
    d4:   mv({ name: 'Low Kick', lvl: 'l', st: 12, rec: 24, dmg: 7, blk: -12, hit: -1, reach: 124, pose: 'lowkick', crouch: true }),
    // --- While Standing (beim Aufstehen aus der Hocke) – zum Bestrafen von Lows ---
    ws1:  mv({ name: 'WS Elbow', lvl: 'm', st: 12, rec: 18, dmg: 13, blk: -3, hit: 5, reach: 118, pose: 'midpunch', wind: 'crouch', adv: 10 }),
    ws2:  mv({ name: 'WS Uppercut', lvl: 'm', st: 15, act: 3, rec: 22, dmg: 17, blk: -13, kd: 'launch', launchVy: 16.5, reach: 112, pose: 'wgf', wind: 'crouch', adv: 22 }),
    ws4:  mv({ name: 'WS Kick', lvl: 'm', st: 11, act: 3, rec: 20, dmg: 14, blk: -6, hit: 5, reach: 130, pose: 'midkick', wind: 'crouch', adv: 10 }),
    wgf:  mv({ name: 'Gale Fist', lvl: 'h', st: 14, act: 3, rec: 24, dmg: 23, blk: -10, kd: 'launch', launchVy: 16, reach: 118, pose: 'wgf', wind: 'crouchwind', adv: 22, crouch: [1, 9] }),
    ewgf: mv({ name: 'ELECTRIC Gale Fist', lvl: 'h', st: 11, act: 3, rec: 24, dmg: (o.ewgfDmg || 25), blk: 5, kd: 'launch', launchVy: 17, reach: 122, pose: 'wgf', wind: 'crouchwind', adv: 24, crouch: [1, 7], fx: 'elec', chip: 4 }),
    // Hellsweep: schneller Low mit Knockdown – auf Block -23 (mit WS2 launchbar bestrafbar)
    hellsweep: mv({ name: 'Hellsweep', lvl: 'l', st: 16, act: 3, rec: 34, dmg: 18, blk: -23, kd: 'sweep', reach: 140, push: 4, pose: 'sweep', wind: 'crouchwind', crouch: true, adv: 24 }),
    throw: mv({ name: 'Wurf', lvl: 't', st: 12, rec: 30, dmg: 35, reach: 100, pose: 'grab' }),
    heatburst: mv({ name: 'SURGE BURST', lvl: 'm', st: 16, rec: 30, dmg: 12, blk: 1, hit: 18, reach: 125, pose: 'heatburst', armor: [1, 16], fx: 'burst' }),
  };
}

const CHARS = {
  fady: {
    name: 'FADY', sub: 'Der Gentleman',
    colors: { skin: '#d6a67c', skinShade: '#b78660', pants: '#5a5c61', pantsShade: '#46484c', belt: '#46484c', suit: true,
      torso: '#606268', sleeve: '#606268', sleeveShade: '#4b4d52', shirt: '#f4f4f2', tie: '#a8873f', tieDark: '#4e3c1c', shoe: '#141414',
      glove: '#d6a67c', hair: '#1d1512', elec: '#d040ff', elec2: '#ff3060', aura: 'rgba(170,30,255,', alt: '#2c3550' },
    moves: Object.assign(commonMoves({ ewgfDmg: 25 }), {
      paw: mv({ name: "Oni Palm", lvl: 'm', st: 20, act: 3, rec: 30, dmg: 28, blk: -14, kd: 'kd', reach: 134, pose: 'paw', wind: 'pawwind', adv: 14 }),
      dgf: mv({ name: 'Shadow Hammer', lvl: 'm', st: 18, act: 3, rec: 30, dmg: 24, blk: -15, kd: 'kd', reach: 125, pose: 'hammer', wind: 'hammerUp', adv: 18, fx: 'elec' }),
      uf4: mv({ name: 'Left Splits Kick', lvl: 'm', st: 15, act: 4, rec: 18, dmg: 15, blk: -13, kd: 'launch', launchVy: 17.5, reach: 118, pose: 'splits', air: [4, 22], adv: 20 }),
      heatsmash: mv({ name: 'ONI BEAM', lvl: 'm', st: 24, act: 6, rec: 30, dmg: 38, blk: -10, kd: 'kd', reach: 1400, pose: 'beam', fx: 'beam', chip: 8 }),
      rageart: mv({ name: 'RAGE STRIKE', lvl: 'm', st: 20, rec: 40, dmg: 55, blk: -20, kd: 'kd', reach: 140, pose: 'paw', wind: 'pawwind', armor: [1, 20], fx: 'rage', adv: 20 }),
    }),
    extraCommands: [
      { m: 'dgf', motion: true, b: [1] },
      { m: 'paw', dir: [4, 7], b: [1, 2] },
    ],
    moveList: [
      ['1,1,2 · 1,2,1,4', 'Flash Combo / Body Blow + Finisher (Knockdown)'],
      ['1,2,2 · 1,2,4', 'Rising Smash (mid KD) / High Kick (KD)'],
      ['2,1 · 3,4 · 4,3', 'Elbow (mid) / Roundhouse (KD) / <b>Low-Mixup</b>'],
      ['df+1,2', 'Middle Jab, Gerade (Combo-Ender)'],
      ['f+4', '<b>Tornado Kick</b> — dreht den Gegner in der Luft (Juggle-Verlängerung)'],
      ['2 / 3 / 4', 'Gerade / Mid Kick / High Kick'],
      ['df+1', 'Middle Jab (mid, CH: Crumple)'],
      ['df+2', 'Rising Uppercut (Launcher)'],
      ['d+1', 'Crouch Jab (special mid, bleibt in der Hocke)'],
      ['d+2 / d+3 / d+4', 'Crouch Straight / Shin Kick / Low Kick (alle low)'],
      ['WS 1 / 2 / 4', 'Aus der Hocke aufstehen + Taste: Elbow / <b>Uppercut (Launcher)</b> / Kick'],
      ['uf+4', 'Left Splits Kick (Launcher)'],
      ['b+1+2', "Oni Palm (Knockdown)"],
      ['f,n,d,df+2', 'Gale Fist — <b>exakt gleichzeitig = ELECTRIC</b>'],
      ['f,n,d,df+1', 'Shadow Hammer (Knockdown)'],
      ['f,n,d,df+4', 'Hellsweep (low, Knockdown) — <b>-23 auf Block: mit WS2 bestrafbar</b>'],
      ['f,n,d,df', 'Crouch Dash (duckt unter Highs) — <b>n,d,df wiederholen = Wavedash</b>, daraus df+1/2/4 für Motion-Moves'],
      ['1+3', 'Wurf (Break: 1 oder 2)'],
      ['2+3', 'Surge Burst → Oni-Form / im Surge: ONI BEAM'],
      ['df+1+2', 'Rage Strike (bei Rage)'],
    ],
  },
  raizo: {
    name: 'BUBESCH', sub: 'Donnermeister',
    colors: { skin: '#c99269', skinShade: '#a8734e', pants: '#3a3a42', pantsShade: '#26262c', belt: '#e0a816',
      glove: '#5a5a5a', hair: '#e6e6e6', elec: '#4fc8ff', elec2: '#ffffff', aura: 'rgba(60,170,255,', alt: '#1e5aa8' },
    moves: Object.assign(commonMoves({ ewgfDmg: 26 }), {
      hammer: mv({ name: 'Lightning Hammer', lvl: 'm', st: 19, act: 3, rec: 30, dmg: 27, blk: -14, kd: 'kd', reach: 132, pose: 'hammer', wind: 'hammerUp', adv: 14, fx: 'thunder' }),
      otgf: mv({ name: 'Thunder Crash Fist', lvl: 'm', st: 16, act: 3, rec: 30, dmg: 22, blk: -14, kd: 'crumple', reach: 125, pose: 'midpunch', wind: 'crouchwind', adv: 22, fx: 'elec' }),
      uf4: mv({ name: 'Hopkick', lvl: 'm', st: 15, act: 4, rec: 18, dmg: 16, blk: -13, kd: 'launch', launchVy: 17.5, reach: 115, pose: 'hopkick', air: [4, 22], adv: 16 }),
      heatsmash: mv({ name: 'THUNDER FALL', lvl: 'm', st: 20, act: 5, rec: 34, dmg: 38, blk: -10, kd: 'kd', reach: 420, pose: 'heatburst', fx: 'thunder', chip: 8 }),
      rageart: mv({ name: 'RAGE STRIKE', lvl: 'm', st: 20, rec: 40, dmg: 55, blk: -20, kd: 'kd', reach: 140, pose: 'paw', wind: 'pawwind', armor: [1, 20], fx: 'rage', adv: 20 }),
    }),
    extraCommands: [
      { m: 'otgf', motion: true, b: [1] },
      { m: 'hammer', dir: [4, 7], b: [1, 2] },
    ],
    moveList: [
      ['1,1,2 · 1,2,1,4', 'Flash Combo / Body Blow + Finisher (Knockdown)'],
      ['1,2,2 · 1,2,4', 'Rising Smash (mid KD) / High Kick (KD)'],
      ['2,1 · 3,4 · 4,3', 'Elbow (mid) / Roundhouse (KD) / <b>Low-Mixup</b>'],
      ['df+1,2', 'Middle Jab, Gerade (Combo-Ender)'],
      ['f+4', '<b>Tornado Kick</b> — dreht den Gegner in der Luft (Juggle-Verlängerung)'],
      ['2 / 3 / 4', 'Gerade / Mid Kick / High Kick'],
      ['df+1', 'Middle Jab (mid, CH: Crumple)'],
      ['df+2', 'Rising Uppercut (Launcher)'],
      ['d+1', 'Crouch Jab (special mid, bleibt in der Hocke)'],
      ['d+2 / d+3 / d+4', 'Crouch Straight / Shin Kick / Low Kick (alle low)'],
      ['WS 1 / 2 / 4', 'Aus der Hocke aufstehen + Taste: Elbow / <b>Uppercut (Launcher)</b> / Kick'],
      ['uf+4', 'Hopkick (Launcher)'],
      ['b+1+2', 'Lightning Hammer (Knockdown)'],
      ['f,n,d,df+2', 'Gale Fist — <b>exakt gleichzeitig = ELECTRIC</b>'],
      ['f,n,d,df+1', 'Thunder Crash Fist (Crumple)'],
      ['f,n,d,df+4', 'Hellsweep (low, Knockdown) — <b>-23 auf Block: mit WS2 bestrafbar</b>'],
      ['f,n,d,df', 'Crouch Dash (duckt unter Highs) — <b>n,d,df wiederholen = Wavedash</b>, daraus df+1/2/4 für Motion-Moves'],
      ['1+3', 'Wurf (Break: 1 oder 2)'],
      ['2+3', 'Surge Burst → Blitz-Aura / im Surge: THUNDER FALL'],
      ['df+1+2', 'Rage Strike (bei Rage)'],
    ],
  },
};

// Befehlsliste (Priorität von oben nach unten)
function buildCommands(ch) {
  return [
    { m: 'rageart', dir: [3], b: [1, 2], need: 'rage' },
    { m: 'heatsmash', b: [2, 3], need: 'heatOn' },
    { m: 'heatburst', b: [2, 3], need: 'heatReady' },
    { m: 'throw', b: [1, 3] },
    ...ch.extraCommands.filter(c => c.b.length === 2),
    { m: 'ewgf', motion: true, b: [2] },
    { m: 'hellsweep', motion: true, b: [4] },
    ...ch.extraCommands.filter(c => c.b.length === 1),
    { m: 'df2', dir: [3], b: [2] },
    { m: 'df1', dir: [3], b: [1] },
    { m: 'uf4', dir: [9], b: [4] },
    { m: 'ws2', ws: true, b: [2] },
    { m: 'ws1', ws: true, b: [1] },
    { m: 'ws4', ws: true, b: [4] },
    { m: 'ws4', ws: true, b: [3] },
    { m: 'd1', dir: [1, 2], b: [1] },
    { m: 'd2', dir: [1, 2], b: [2] },
    { m: 'd3', dir: [1, 2], b: [3] },
    { m: 'd4', dir: [1, 2], b: [4] },
    { m: 'f4', dir: [6], b: [4] },
    { m: 'jab', b: [1] },
    { m: 'two', b: [2] },
    { m: 'three', b: [3] },
    { m: 'four', b: [4] },
  ];
}
