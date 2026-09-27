// 🕹️ Games: ♟️ Chess (turn by turn, can last days) and 🎨 Doodle Duel (draw & guess).
// Chess state lives at /chess, doodle at /doodle (+ /doodleInk for the drawing).

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];

// ═════════════════════════ ♟️ CHESS ENGINE ═════════════════════════
// Board: 64 chars, index 0 = a8 … 63 = h1. Uppercase = white, lowercase = black, '.' = empty.
const START = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
const colorOf = p => p === '.' ? null : p === p.toUpperCase() ? 'w' : 'b';
const RC = i => [i >> 3, i & 7];
const IDX = (r, c) => (r < 0 || r > 7 || c < 0 || c > 7) ? -1 : r * 8 + c;
const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]], BISHOP = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

function attacked(b, sq, by) {
  const [r, c] = RC(sq);
  const up = by === 'w' ? 1 : -1;               // white pawns attack "upwards" (towards row 0)
  for (const dc of [-1, 1]) { const i = IDX(r + up, c + dc); if (i >= 0 && b[i] === (by === 'w' ? 'P' : 'p')) return true; }
  for (const [dr, dc] of KN) { const i = IDX(r + dr, c + dc); if (i >= 0 && b[i] === (by === 'w' ? 'N' : 'n')) return true; }
  for (const [dr, dc] of KG) { const i = IDX(r + dr, c + dc); if (i >= 0 && b[i] === (by === 'w' ? 'K' : 'k')) return true; }
  const ray = (dirs, set) => dirs.some(([dr, dc]) => {
    for (let k = 1; k < 8; k++) {
      const i = IDX(r + dr * k, c + dc * k); if (i < 0) return false;
      if (b[i] === '.') continue;
      return colorOf(b[i]) === by && set.includes(b[i].toUpperCase());
    }
    return false;
  });
  return ray(ROOK, 'RQ') || ray(BISHOP, 'BQ');
}
const kingAt = (b, col) => b.indexOf(col === 'w' ? 'K' : 'k');
const inCheck = (b, col) => attacked(b, kingAt(b, col), col === 'w' ? 'b' : 'w');

function pseudo(s, from) {
  const b = s.b, p = b[from], col = colorOf(p), [r, c] = RC(from), out = [];
  const add = (to, extra = {}) => out.push({ from, to, ...extra });
  const T = p.toUpperCase();
  if (T === 'P') {
    const dir = col === 'w' ? -1 : 1, startRow = col === 'w' ? 6 : 1, lastRow = col === 'w' ? 0 : 7;
    const one = IDX(r + dir, c);
    const pushTo = (to, extra) => RC(to)[0] === lastRow ? ['Q', 'R', 'B', 'N'].forEach(q => add(to, { ...extra, promo: q })) : add(to, extra);
    if (one >= 0 && b[one] === '.') {
      pushTo(one);
      const two = IDX(r + 2 * dir, c);
      if (r === startRow && b[two] === '.') add(two, { double: true });
    }
    for (const dc of [-1, 1]) {
      const t = IDX(r + dir, c + dc); if (t < 0) continue;
      if (b[t] !== '.' && colorOf(b[t]) !== col) pushTo(t);
      if (t === s.e) add(t, { ep: true });
    }
  } else if (T === 'N' || T === 'K') {
    for (const [dr, dc] of T === 'N' ? KN : KG) { const t = IDX(r + dr, c + dc); if (t >= 0 && colorOf(b[t]) !== col) add(t); }
    if (T === 'K') {
      const home = col === 'w' ? 60 : 4, enemy = col === 'w' ? 'b' : 'w';
      if (from === home && !attacked(b, home, enemy)) {
        const K = col === 'w' ? 'K' : 'k', Q = col === 'w' ? 'Q' : 'q';
        if (s.c.includes(K) && b[home + 1] === '.' && b[home + 2] === '.' && !attacked(b, home + 1, enemy) && !attacked(b, home + 2, enemy)) add(home + 2, { castle: 'k' });
        if (s.c.includes(Q) && b[home - 1] === '.' && b[home - 2] === '.' && b[home - 3] === '.' && !attacked(b, home - 1, enemy) && !attacked(b, home - 2, enemy)) add(home - 2, { castle: 'q' });
      }
    }
  } else {
    const dirs = T === 'R' ? ROOK : T === 'B' ? BISHOP : [...ROOK, ...BISHOP];
    for (const [dr, dc] of dirs) for (let k = 1; k < 8; k++) {
      const t = IDX(r + dr * k, c + dc * k); if (t < 0) break;
      if (b[t] === '.') { add(t); continue; }
      if (colorOf(b[t]) !== col) add(t);
      break;
    }
  }
  return out;
}
function makeMove(s, m) {
  const b = s.b.split(''), p = b[m.from], col = colorOf(p);
  const captured = m.ep ? b[m.to + (col === 'w' ? 8 : -8)] : b[m.to];
  b[m.to] = m.promo ? (col === 'w' ? m.promo : m.promo.toLowerCase()) : p;
  b[m.from] = '.';
  if (m.ep) b[m.to + (col === 'w' ? 8 : -8)] = '.';
  if (m.castle === 'k') { b[m.to - 1] = b[m.to + 1]; b[m.to + 1] = '.'; }
  if (m.castle === 'q') { b[m.to + 1] = b[m.to - 2]; b[m.to - 2] = '.'; }
  let c = s.c;
  const strip = chars => { for (const ch of chars) c = c.replace(ch, ''); };
  if (p === 'K') strip('KQ'); if (p === 'k') strip('kq');
  [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([sq, ch]) => { if (m.from === sq || m.to === sq) strip(ch); });
  return {
    ...s, b: b.join(''), c: c || '-', t: col === 'w' ? 'b' : 'w',
    e: m.double ? (m.from + m.to) / 2 : -1,
    h: p.toUpperCase() === 'P' || captured !== '.' ? 0 : (s.h || 0) + 1,
    last: [m.from, m.to],
  };
}
const legalFrom = (s, from) => pseudo(s, from).filter(m => !inCheck(makeMove(s, m).b, colorOf(s.b[from])));
function anyLegal(s, col) {
  for (let i = 0; i < 64; i++) if (colorOf(s.b[i]) === col && legalFrom(s, i).length) return true;
  return false;
}
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glyph = p => GLYPH[p.toLowerCase()] + '︎';
const PIECE_NAME = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };

// ═════════════════════════ 🎨 DOODLE WORDS ═════════════════════════
const WORDS = ['cat🐱', 'dog🐶', 'house🏠', 'sun☀️', 'tree🌳', 'car🚗', 'pizza🍕', 'heart❤️', 'fish🐟', 'flower🌸', 'star⭐', 'moon🌙', 'rainbow🌈', 'apple🍎', 'banana🍌', 'cake🎂',
  'guitar🎸', 'phone📱', 'glasses👓', 'hat🎩', 'ice cream🍦', 'snowman⛄', 'umbrella☂️', 'rocket🚀', 'bicycle🚲', 'airplane✈️', 'boat⛵', 'ball⚽', 'book📖', 'clock⏰', 'key🔑',
  'light bulb💡', 'cloud☁️', 'fire🔥', 'mountain⛰️', 'island🏝️', 'spider🕷️', 'snake🐍', 'elephant🐘', 'giraffe🦒', 'rabbit🐰', 'duck🦆', 'bee🐝', 'butterfly🦋', 'octopus🐙',
  'crab🦀', 'turtle🐢', 'pig🐷', 'cow🐮', 'horse🐴', 'lion🦁', 'monkey🐵', 'penguin🐧', 'owl🦉', 'bed🛏️', 'door🚪', 'cup☕', 'shoe👟', 'sock🧦', 'crown👑', 'ring💍', 'kiss💋',
  'teddy bear🧸', 'balloon🎈', 'gift🎁', 'candle🕯️', 'camera📷', 'tv📺', 'computer💻', 'robot🤖', 'ghost👻', 'alien👽', 'pumpkin🎃', 'christmas tree🎄', 'burger🍔', 'hot dog🌭',
  'donut🍩', 'cookie🍪', 'egg🥚', 'carrot🥕', 'watermelon🍉', 'grapes🍇', 'cherry🍒', 'strawberry🍓', 'lollipop🍭', 'popcorn🍿', 'noodles🍜', 'sushi🍣', 'tea🍵', 'beach🏖️',
  'tent⛺', 'castle🏰', 'train🚆', 'bus🚌', 'anchor⚓', 'sword🗡️', 'drum🥁', 'piano🎹', 'microphone🎤', 'headphones🎧', 'scissors✂️', 'pencil✏️', 'envelope✉️', 'magnet🧲',
  'bomb💣', 'diamond💎', 'money💰', 'snail🐌', 'whale🐳', 'dolphin🐬', 'frog🐸', 'chicken🐔', 'mushroom🍄', 'cactus🌵', 'volcano🌋', 'tornado🌪️', 'lightning⚡', 'snowflake❄️',
  'sandwich🥪', 'pancakes🥞', 'coconut🥥', 'elephant ride🐘', 'kite🪁', 'lighthouse🗼', 'crocodile🐊', 'shark🦈', 'bat🦇', 'unicorn🦄', 'dinosaur🦖', 'mermaid🧜', 'angel😇'];
const splitWord = w => { const m = w.match(/^([a-z ]+)(.*)$/i); return { word: m[1].trim(), emoji: m[2] }; };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
function close(a, b) {   // one letter off?
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0, j = 0, diff = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diff > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return diff + (a.length - i) + (b.length - j) <= 1;
}
const INKS = ['#2a2140', '#ff4d6d', '#ff9f1c', '#ffd60a', '#8ac926', '#2ec4b6', '#4f8cff', '#7b5cff', '#ff5fa2', '#8d5a3b', '#ffffff'];
const DOODLE_MS = 100000;

export function initGames(ctx) {
  const { $, esc, store, sfx } = ctx;
  const me = () => ctx.me(), other = () => ctx.other();
  let chess = null, doodle = null, ink = { strokes: {}, live: null };
  let sel = -1, targets = [], promoMove = null, flipCache = null;

  // ── Game corner list ───────────────────────────────────────
  function list() {
    const c = chess && chess.st === 'play', yourTurn = c && chess[chess.t === 'w' ? 'w' : 'bk'] === me();
    return [
      { id: 'chess', icon: '♟️', name: 'Chess', desc: c ? (yourTurn ? '🟢 Your move!' : `Waiting for ${ctx.called(other())} to move…`) : 'Classic chess. Play a move whenever you like — it can last days!', play: true },
      { id: 'doodle', icon: '🎨', name: 'Doodle Duel', desc: doodle && doodle.state !== 'over' ? '🟢 A round is on!' : 'One draws a secret word, the other guesses. Best with a call!', play: true },
    ];
  }

  // ═════════════════════════ ♟️ CHESS UI ═════════════════════════
  const myColor = () => !chess ? null : chess.w === me() ? 'w' : chess.bk === me() ? 'b' : null;
  function newChess() {
    const whiteIsMe = Math.random() < 0.5;
    chess = { b: START, t: 'w', c: 'KQkq', e: -1, h: 0, n: 1, w: whiteIsMe ? me() : other(), bk: whiteIsMe ? other() : me(), st: 'play', last: null, draw: null, by: me(), ts: store.now() };
    store.set('chess', chess);
    ctx.logAct('chess-new', 'started a new chess game ♟️');
    sel = -1; targets = [];
    openChess();
  }
  function openChess() {
    if (ctx.isVisitor?.()) return ctx.showCard(`<div class="big">♟️</div><h2>Chess is the hosts’ game</h2><p class="muted">But you can play 🎨 Doodle Duel with everyone!</p><button class="btn" data-dismiss>OK</button>`, 'chess');
    if (!chess || !chess.b) return chessIntro();
    ctx.sitForGame();
    renderChess();
  }
  function chessIntro() {
    ctx.showCard(`<div class="cook-head"><span class="dish">♟️</span><div><b>Chess</b><small>Take turns — no rush, it can last days</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      <p class="muted" style="margin:16px 0">Colors are picked at random. Tap a piece to see where it can go.</p>
      <button class="btn wide" data-chess="new">♟️ Start a game with ${esc(ctx.called(other()))}</button>`, 'chess');
  }
  function renderChess() {
    if (!chess?.b) return;
    const mc = myColor() || 'w', flip = mc === 'b';
    const s = chess, over = s.st !== 'play';
    const turnId = s[s.t === 'w' ? 'w' : 'bk'], mine = turnId === me() && !over;
    const check = !over && inCheck(s.b, s.t);
    const capW = [], capB = [];
    const count = (str, ch) => str.split(ch).length - 1;
    for (const ch of 'QRBNP') {
      const missW = count(START, ch) - count(s.b, ch), missB = count(START, ch.toLowerCase()) - count(s.b, ch.toLowerCase());
      for (let i = 0; i < Math.max(0, missW); i++) capW.push(glyph(ch));
      for (let i = 0; i < Math.max(0, missB); i++) capB.push(glyph(ch.toLowerCase()));
    }
    let status;
    if (s.st === 'mate') status = s.win === me() ? '🏆 Checkmate — you win!' : `😵 Checkmate — ${esc(ctx.called(s.win))} wins!`;
    else if (s.st === 'resign') status = s.win === me() ? `🏳️ ${esc(ctx.called(other()))} resigned — you win!` : '🏳️ You resigned';
    else if (s.st === 'stale') status = '🤝 Stalemate — it’s a draw!';
    else if (s.st === 'draw') status = '🤝 Draw agreed';
    else if (s.st === 'fifty') status = '🤝 Draw (50 moves without a capture)';
    else status = mine ? `🟢 Your move${check ? ' — you’re in check! ⚠️' : ''}` : `⏳ ${esc(ctx.called(turnId))}’s move${check ? ' (in check!)' : ''}`;
    const kingSq = check ? kingAt(s.b, s.t) : -1;
    const cells = [];
    for (let k = 0; k < 64; k++) {
      const i = flip ? 63 - k : k, p = s.b[i], [r, c] = RC(i);
      const cls = ['sq', (r + c) % 2 ? 'dark' : 'light', i === sel ? 'sel' : '', targets.some(m => m.to === i) ? (p !== '.' ? 'hitme' : 'dot') : '',
        s.last && s.last.includes(i) ? 'last' : '', i === kingSq ? 'check' : ''].join(' ');
      cells.push(`<button class="${cls}" data-sq="${i}">${p !== '.' ? `<span class="pc ${colorOf(p)}">${glyph(p)}</span>` : ''}</button>`);
    }
    const oppColor = mc === 'w' ? 'b' : 'w';
    const html = `<div class="cook-head"><span class="dish">♟️</span><div><b>Chess</b><small>You play ${mc === 'w' ? 'white ♔' : 'black ♚'} vs ${esc(ctx.called(other()))}</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      <div class="chess-status ${mine ? 'go' : ''}">${status}</div>
      <div class="caps">${(oppColor === 'w' ? capB : capW).join('')}&nbsp;</div>
      <div class="board">${cells.join('')}</div>
      <div class="caps">${(oppColor === 'w' ? capW : capB).join('')}&nbsp;</div>
      ${promoMove ? `<div class="promo">Promote to: ${['Q', 'R', 'B', 'N'].map(q => `<button data-promo="${q}"><span class="pc ${mc}">${glyph(mc === 'w' ? q : q.toLowerCase())}</span></button>`).join('')}</div>` : ''}
      ${s.draw && s.draw !== me() && !over ? `<div class="status ok">🤝 ${esc(ctx.called(s.draw))} offers a draw. <button class="chip" data-chess="acceptdraw">Accept</button> <button class="chip" data-chess="declinedraw">No thanks</button></div>` : ''}
      <div class="row" style="justify-content:center;margin-top:10px;flex-wrap:wrap">
        ${over ? `<button class="btn" data-chess="new">🔄 New game</button>`
          : `<button class="btn ghost small" data-chess="offerdraw" ${s.draw === me() ? 'disabled' : ''}>🤝 ${s.draw === me() ? 'Draw offered' : 'Offer draw'}</button>
             <button class="btn ghost small" data-chess="resign">🏳️ Resign</button>`}
      </div>`;
    // Update the board in place (no pop-in animation) so pieces don't jump under your finger.
    const body = $('#chess-body');
    if (ctx.overlayMode() === 'chess' && body) body.innerHTML = html;
    else { ctx.showCard(`<div id="chess-body">${html}</div>`, 'chess', 'cook'); bindBoard(); }
  }
  // Tap a piece then a square — or drag the piece there.
  let drag = null;
  function bindBoard() {
    const box = $('#chess-body'); if (!box) return;
    const sqAt = (x, y) => document.elementFromPoint(x, y)?.closest('[data-sq]');
    box.addEventListener('pointerdown', e => {
      const sq = e.target.closest('[data-sq]'); if (!sq) return;
      e.preventDefault();
      const i = +sq.dataset.sq, s = chess, mc = myColor();
      const mineHere = s && mc && s.t === mc && s.st === 'play' && colorOf(s.b[i]) === mc;
      tapSquare(i);
      if (mineHere) drag = { from: i, x: e.clientX, y: e.clientY, moved: false, ghost: null };
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
      if (!drag.moved) {
        drag.moved = true;
        const p = chess.b[drag.from];
        drag.ghost = document.createElement('div');
        drag.ghost.className = 'chess-ghost';
        drag.ghost.innerHTML = `<span class="pc ${colorOf(p)}">${glyph(p)}</span>`;
        document.body.append(drag.ghost);
        box.querySelector(`[data-sq="${drag.from}"] .pc`)?.classList.add('lifted');
      }
      drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
      box.querySelectorAll('.sq.hover').forEach(x => x.classList.remove('hover'));
      sqAt(e.clientX, e.clientY)?.classList.add('hover');
    });
    const end = e => {
      if (!drag) return;
      const d = drag; drag = null;
      d.ghost?.remove();
      if (!d.moved) return;
      const sq = sqAt(e.clientX, e.clientY);
      if (sq && +sq.dataset.sq !== d.from) tapSquare(+sq.dataset.sq);
      else renderChess();
    };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
  }
  function tapSquare(i) {
    const s = chess; if (!s || s.st !== 'play') return;
    const mc = myColor(); if (!mc || s.t !== mc) { if (mc) ctx.toast('⏳ Not your turn yet'); return; }
    const m = targets.find(x => x.to === i);
    if (m) {
      if (m.promo) { promoMove = targets.filter(x => x.to === i); return renderChess(); }
      return play(m);
    }
    if (colorOf(s.b[i]) === mc) { sel = i; targets = legalFrom(s, i); sfx.tick(); }
    else { sel = -1; targets = []; }
    renderChess();
  }
  function play(m) {
    const s = chess, p = s.b[m.from];
    let next = makeMove(s, m);
    next.n = s.n + (s.t === 'b' ? 1 : 0);
    next.draw = null; next.by = me(); next.ts = store.now();
    if (!anyLegal(next, next.t)) {
      if (inCheck(next.b, next.t)) { next.st = 'mate'; next.win = me(); }
      else next.st = 'stale';
    } else if (next.h >= 100) next.st = 'fifty';
    chess = next; sel = -1; targets = []; promoMove = null;
    store.set('chess', next);
    sfx[s.b[m.to] !== '.' || m.ep ? 'chop' : 'clack']();
    const moved = PIECE_NAME[p.toUpperCase()];
    ctx.logAct('chess', next.st === 'mate' ? 'checkmated you in chess ♟️😈' : `moved their ${moved} in chess ♟️ — your turn!`);
    renderChess();
  }
  function chessAct(a) {
    if (a === 'new') {
      if (chess?.st === 'play' && !confirm('Start a new game? The current one will end.')) return;
      return newChess();
    }
    if (!chess) return;
    if (a === 'resign') {
      if (!confirm('Resign this game?')) return;
      chess = { ...chess, st: 'resign', win: other(), by: me(), ts: store.now() };
      store.set('chess', chess); ctx.logAct('chess', 'resigned the chess game 🏳️ — you win!');
    }
    if (a === 'offerdraw') { store.update('chess', { draw: me() }); ctx.toast('🤝 Draw offered'); }
    if (a === 'acceptdraw') { chess = { ...chess, st: 'draw', draw: null }; store.set('chess', chess); }
    if (a === 'declinedraw') store.update('chess', { draw: null });
    renderChess();
  }
  function onChess(v) {
    const prev = chess;
    chess = v && v.b ? v : null;
    if (chess && prev && chess.ts !== prev.ts && chess.by !== me()) {
      if (chess.st === 'play' && chess[chess.t === 'w' ? 'w' : 'bk'] === me()) sfx.ding();   // the activity log shows the 'your turn' note
      else if (chess.st === 'mate') ctx.toast('♟️ Checkmate! 😵');
      sel = -1; targets = []; promoMove = null;
    }
    if (ctx.overlayMode() === 'chess') chess?.b ? renderChess() : chessIntro();
    ctx.refreshGames();
  }

  // ═════════════════════════ 🎨 DOODLE DUEL ═════════════════════════
  let dTimer = null, liveTimer = null, curStroke = null, dInk = INKS[0], dSize = 6;
  const guesser = () => doodle?.drawer === me() ? other() : me();
  function doodleIntro() {
    const ok = ctx.together();
    ctx.showCard(`<div class="cook-head"><span class="dish">🎨</span><div><b>Doodle Duel</b><small>Draw it — they guess it!</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      <ol class="step-list"><li>✏️ One of you gets a secret word and draws it</li><li>🤔 The other types guesses</li><li>⭐ Guess right in time = a point each. Then swap!</li></ol>
      ${ok ? `<button class="btn wide" data-doodle="start">🎨 I’ll draw first</button>` : `<p class="status wait">⏳ You both need to be home (in any room) to play.</p>`}`, 'doodle');
  }
  function startRound(drawer) {
    const pool = [...WORDS].sort(() => Math.random() - 0.5).slice(0, 3);
    const scores = doodle?.scores || { a: 0, b: 0 };
    store.set('doodleInk', null);
    store.set('doodle', { state: 'pick', drawer, choices: pool, scores, round: (doodle?.round || 0) + 1, ts: store.now() });
  }
  function openDoodle() {
    if (!doodle || doodle.state === 'over') return doodleIntro();
    renderDoodle();
  }
  function renderDoodle() {
    clearInterval(dTimer);
    const d = doodle; if (!d) return doodleIntro();
    const drawing = d.drawer === me();
    const score = `<div class="dd-score">${esc(ctx.face(me()))} ${d.scores?.[me()] || 0} : ${d.scores?.[other()] || 0} ${esc(ctx.face(other()))}</div>`;
    const head = `<div class="cook-head"><span class="dish">🎨</span><div><b>Doodle Duel</b><small>Round ${d.round} · ${drawing ? 'you draw' : `${esc(ctx.called(d.drawer))} draws`}</small></div>${score}<button class="x" data-dismiss aria-label="Close">✕</button></div>`;
    if (d.state === 'pick') {
      if (!drawing) return ctx.showCard(`${head}<div class="cook-area watching"><div class="big-emoji watch">🤔</div><div class="count">${esc(ctx.called(d.drawer))} is choosing a word…</div></div>`, 'doodle', 'cook');
      return ctx.showCard(`${head}<div class="cook-task">Pick a word to draw (keep it secret! 🤫)</div>
        <div class="choose-grid">${d.choices.map((w, i) => { const { word, emoji } = splitWord(w); return `<button data-doodle-word="${i}"><span>${emoji}</span>${esc(word)}</button>`; }).join('')}</div>`, 'doodle', 'cook');
    }
    if (d.state === 'draw') {
      const { word, emoji } = splitWord(d.word);
      const hint = word.split('').map(ch => ch === ' ' ? '&nbsp;&nbsp;' : '_').join(' ');
      ctx.showCard(`${head}
        <div class="dd-word">${drawing ? `Draw: <b>${esc(word)}</b> ${emoji}` : `<span class="dd-hint">${hint}</span> <small>(${word.replace(/ /g, '').length} letters)</small>`}<span class="dd-time" id="dd-time"></span></div>
        <canvas class="dd-canvas ${drawing ? 'draw' : ''}" id="dd-canvas" width="600" height="600"></canvas>
        ${drawing ? `<div class="dd-tools">${INKS.map(c => `<button class="sw small ${c === dInk ? 'on' : ''}" style="background:${c}" data-dd-ink="${c}"></button>`).join('')}
            <button class="chip ${dSize === 6 ? 'on' : ''}" data-dd-size="6">✏️</button><button class="chip ${dSize === 16 ? 'on' : ''}" data-dd-size="16">🖌️</button>
            <button class="chip" data-doodle="undo">↶</button><button class="chip" data-doodle="clear">🗑️</button></div>`
          : `<form class="chat-form" id="dd-form" style="padding:8px 0 0"><input class="field" id="dd-guess" placeholder="Your guess…" autocomplete="off" enterkeyhint="send"><button class="send" aria-label="Guess">➤</button></form>`}
        <div class="dd-guesses" id="dd-guesses"></div>
        ${drawing ? '<button class="btn ghost small" data-doodle="giveup" style="margin-top:6px">🙈 Skip this word</button>' : ''}`, 'doodle', 'cook');
      setupCanvas(drawing);
      renderGuesses();
      $('#dd-form')?.addEventListener('submit', e => { e.preventDefault(); const i = $('#dd-guess'); guess(i.value); i.value = ''; i.focus(); });
      const tick = () => {
        const left = Math.max(0, DOODLE_MS - (store.now() - d.start));
        const el = $('#dd-time'); if (el) el.textContent = `⏱ ${Math.ceil(left / 1000)}s`;
        if (left <= 0 && drawing && doodle?.state === 'draw') store.update('doodle', { state: 'reveal', win: null, ts: store.now() });
      };
      tick(); dTimer = setInterval(tick, 500);
      return;
    }
    if (d.state === 'reveal') {
      const { word, emoji } = splitWord(d.word || '');
      const got = d.win;
      const nextDrawer = d.drawer === me() ? other() : me();
      ctx.showCard(`${head}<div class="result-dish">${emoji || '🎨'}</div><h2>It was “${esc(word)}”!</h2>
        <p class="muted">${got ? `🎉 ${got === me() ? 'You' : esc(ctx.called(got))} guessed it in ${Math.round((d.took || 0) / 1000)}s — a point each! ⭐` : '⏰ Nobody got it this time!'}</p>
        <canvas class="dd-canvas small" id="dd-canvas" width="600" height="600"></canvas>
        <div class="row" style="justify-content:center;margin-top:10px">
          <button class="btn ghost" data-doodle="stop">Stop playing</button>
          <button class="btn" data-doodle="next">${nextDrawer === me() ? '✏️ My turn to draw' : `👉 ${esc(ctx.called(nextDrawer))} draws next`}</button>
        </div>`, 'doodle', 'cook');
      setupCanvas(false);
    }
  }
  function renderGuesses() {
    const box = $('#dd-guesses'); if (!box || !doodle) return;
    const gs = Object.values(doodle.guesses || {}).sort((a, b) => a.ts - b.ts).slice(-5);
    box.innerHTML = gs.map(g => `<span class="${g.close ? 'close' : ''}">${esc(g.text)}${g.close ? ' 🔥 so close!' : ''}</span>`).join('');
  }
  function guess(text) {
    const d = doodle; if (!d || d.state !== 'draw' || !text.trim()) return;
    const g = norm(text), w = norm(splitWord(d.word).word);
    if (g === w || g === w + 's' || g + 's' === w) {
      const scores = { ...d.scores, [me()]: (d.scores?.[me()] || 0) + 1, [d.drawer]: (d.scores?.[d.drawer] || 0) + 1 };
      store.update('doodle', { state: 'reveal', win: me(), took: store.now() - d.start, scores, ts: store.now() });
      sfx.yay();
      return;
    }
    store.push('doodle/guesses', { text: text.trim().slice(0, 30), close: close(g, w) || null, ts: store.now() });
    sfx.whiff();
  }
  // canvas: points are 0–1000
  function setupCanvas(drawing) {
    const cv = $('#dd-canvas'); if (!cv) return;
    drawInk();
    if (!drawing) return;
    const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * 1000), Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * 1000)]; };
    cv.onpointerdown = e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} curStroke = { c: dInk, w: dSize, pts: [pt(e)] }; drawInk(); startLive(); };
    cv.onpointermove = e => {
      if (!curStroke) return;
      const p = pt(e), l = curStroke.pts[curStroke.pts.length - 1];
      if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 5) return;
      curStroke.pts.push(p); drawInk();
    };
    cv.onpointerup = cv.onpointercancel = () => {
      if (!curStroke) return;
      const s = curStroke; curStroke = null;
      clearInterval(liveTimer);
      store.push('doodleInk/strokes', { c: s.c, w: s.w, p: s.pts.map(p => p.join(',')).join(' ') });
      store.set('doodleInk/live', null);
    };
  }
  function startLive() {
    clearInterval(liveTimer);
    liveTimer = setInterval(() => { if (curStroke) store.set('doodleInk/live', { c: curStroke.c, w: curStroke.w, p: curStroke.pts.map(p => p.join(',')).join(' ') }); }, 250);
  }
  function drawInk() {
    const cv = $('#dd-canvas'); if (!cv) return;
    const g = cv.getContext('2d'), W = cv.width;
    g.fillStyle = '#fffdf8'; g.fillRect(0, 0, W, W);
    const paintS = s => {
      const pts = Array.isArray(s.pts) ? s.pts : String(s.p || '').split(' ').filter(Boolean).map(p => p.split(',').map(Number));
      if (!pts.length) return;
      g.strokeStyle = g.fillStyle = s.c; g.lineWidth = s.w * W / 300; g.lineCap = g.lineJoin = 'round';
      g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, x / 1000 * W, y / 1000 * W));
      if (pts.length === 1) { g.arc(pts[0][0] / 1000 * W, pts[0][1] / 1000 * W, g.lineWidth / 2, 0, 7); g.fill(); } else g.stroke();
    };
    Object.keys(ink.strokes || {}).sort().forEach(k => paintS(ink.strokes[k]));
    if (ink.live && doodle?.drawer !== me()) paintS(ink.live);
    if (curStroke) paintS(curStroke);
  }
  function doodleAct(a) {
    if (a === 'start') return startRound(me());
    if (a === 'next') return startRound(doodle.drawer === me() ? other() : me());
    if (a === 'stop') { store.update('doodle', { state: 'over' }); ctx.hideOverlay(); return; }
    if (a === 'giveup') return store.update('doodle', { state: 'reveal', win: null, ts: store.now() });
    if (a === 'clear') { store.set('doodleInk', null); return; }
    if (a === 'undo') { const ks = Object.keys(ink.strokes || {}).sort(); if (ks.length) store.remove(`doodleInk/strokes/${ks[ks.length - 1]}`); }
  }
  function onDoodle(v) {
    const prev = doodle;
    doodle = v;
    const key = v ? `${v.round}:${v.state}` : '';
    const prevKey = prev ? `${prev.round}:${prev.state}` : '';
    // someone started a round and I'm not looking → invite
    if (v && key !== prevKey && v.state === 'pick' && v.drawer !== me() && prev !== undefined && ctx.overlayMode() !== 'doodle' && store.now() - v.ts < 60000) {
      sfx.ding();
      ctx.toast(`🎨 ${esc(ctx.called(v.drawer))} started Doodle Duel — <b>open 🕹️ Games</b> to guess!`, 5000);
    }
    if (ctx.overlayMode() === 'doodle') {
      if (key !== prevKey || !v) openDoodle();
      else renderGuesses();
    }
    if (v?.state === 'reveal' && prev?.state === 'draw' && v.win && v.win !== me() && ctx.overlayMode() === 'doodle') sfx.yay();
    ctx.refreshGames();
  }
  function onInk(v) { ink = { strokes: v?.strokes || {}, live: v?.live || null }; drawInk(); }

  function route(d, t) {
    if (d.game === 'chess') { openChess(); return true; }
    if (d.game === 'doodle') { openDoodle(); return true; }
    if (d.sq !== undefined) return true;
    if (d.promo) { const m = promoMove?.find(x => x.promo === d.promo); if (m) play(m); return true; }
    if (d.chess) { chessAct(d.chess); return true; }
    if (d.doodle) { doodleAct(d.doodle); return true; }
    if (d.doodleWord !== undefined) {
      const w = doodle?.choices?.[+d.doodleWord]; if (!w) return true;
      store.update('doodle', { state: 'draw', word: w, start: store.now(), guesses: null, ts: store.now() });
      return true;
    }
    if (d.ddInk) { dInk = d.ddInk; t.closest('.dd-tools').querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === t)); return true; }
    if (d.ddSize) { dSize = +d.ddSize; t.closest('.dd-tools').querySelectorAll('[data-dd-size]').forEach(x => x.classList.toggle('on', x === t)); return true; }
    return false;
  }

  let firstDoodle = true;
  return {
    list, route, onChess, onInk, CLOSABLE: [],
    onDoodle: v => { if (firstDoodle) { firstDoodle = false; doodle = v; ctx.refreshGames(); return; } onDoodle(v); },
  };
}
