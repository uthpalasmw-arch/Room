import { createStore } from './store.js';
import { createCall } from './call.js';
import { sfx, unlockAudio, startRing, stopRing } from './sfx.js';

// ── Helpers ──────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const JUMBO = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|\s){1,12}$/u;
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const HOUR = 3600000;

// ── Rooms ────────────────────────────────────────────────────
const ROOMS = {
  living: { name: 'Living room', icon: '🛋️', rest: 'sofa' },
  bedroom: { name: 'Bedroom', icon: '🛏️', rest: 'bed' },
};
const NEXT_ROOM = { living: 'bedroom', bedroom: 'living' };
const DOOR_SPOT = { living: { x: 84, y: 62 }, bedroom: { x: 16, y: 62 } };
const DEFAULT_LOOK = {
  living: { wall: '#ffd6e0', wp: 'dots', floor: '#e9b872', fl: 'wood', rug: '#ff8fab', cur: '#ff5fa2' },
  bedroom: { wall: '#e4c1f9', wp: 'stars', floor: '#bdb2ff', fl: 'carpet', rug: '#ffffff', cur: '#7b5cff' },
};
const SEED = {
  living: {
    'seed-shelf': { t: 'furn', k: 'shelf', x: 14, y: 58, c: '#c8875a' },
    'seed-plant': { t: 'emoji', v: '🪴', x: 30, y: 59 },
    'seed-tv': { t: 'furn', k: 'tv', x: 55, y: 62, c: '#8d5a3b', ch: 0 },
    'seed-clock': { t: 'furn', k: 'clock', x: 22, y: 43, c: '#ff5fa2' },
    'seed-lamp': { t: 'furn', k: 'floorlamp', x: 9, y: 86, c: '#ffb703' },
    'seed-arcade': { t: 'furn', k: 'arcade', x: 89, y: 82, c: '#5a3fd6' },
    'seed-sofa': { t: 'furn', k: 'sofa', x: 50, y: 95, c: '#ff5fa2' },
  },
  bedroom: {
    'seed-fairy': { t: 'furn', k: 'fairy', x: 56, y: 38, s: .85 },
    'seed-wardrobe': { t: 'furn', k: 'wardrobe', x: 86, y: 66, c: '#c8875a' },
    'seed-night': { t: 'furn', k: 'nightstand', x: 14, y: 80, c: '#c8875a' },
    'seed-bed': { t: 'furn', k: 'bed', x: 50, y: 92, c: '#7b5cff' },
    'seed-teddy': { t: 'emoji', v: '🧸', x: 36, y: 84, z: 960 },
    'seed-bean': { t: 'furn', k: 'beanbag', x: 84, y: 76, c: '#ff5fa2' },
  },
};

// ── Palettes & content ───────────────────────────────────────
const FACES = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼', '🐸', '🐯', '🐨', '🐷', '🐧', '🦄', '🐵', '🐙', '🐥', '🐹', '👩', '👨', '👧', '👦'];
const HATS = ['', '👑', '🎀', '🧢', '🎩', '🌸', '🕶️', '🎧', '😇'];
const HAT_CLASS = { '🕶️': 'h-eyes', '🌸': 'h-side', '🎧': 'h-ears' };
const COLORS = ['#ff5fa2', '#ff7a59', '#ffb703', '#8ac926', '#2ec4b6', '#4f8cff', '#7b5cff', '#c77dff', '#ff4d6d', '#06d6a0'];
const WALL_COLORS = ['#ffd6e0', '#ffc8a2', '#fff1a8', '#d0f4de', '#a9def9', '#e4c1f9', '#ff99c8', '#b8f2e6', '#cdb4db', '#90dbf4', '#ffadad', '#2b2d42', '#ffffff'];
const WALLPAPERS = [['none', 'Plain'], ['dots', 'Dots'], ['stripes', 'Stripes'], ['hearts', 'Hearts'], ['stars', 'Stars'], ['checks', 'Checks'], ['waves', 'Waves'], ['bricks', 'Bricks']];
const FLOOR_COLORS = ['#e9b872', '#c8875a', '#8d5a3b', '#f4e1c1', '#b5e48c', '#a0c4ff', '#ffc6ff', '#bdb2ff', '#9b9b9b', '#6d6875'];
const FLOORS = [['wood', 'Wood'], ['tiles', 'Tiles'], ['carpet', 'Carpet'], ['grass', 'Grass']];
const RUGS = ['#ff8fab', '#ffb703', '#8ac926', '#4f8cff', '#c77dff', '#ffffff', 'none'];
const CURTAINS = ['#ff5fa2', '#7b5cff', '#4f8cff', '#8ac926', '#ffb703', '#ffffff', 'none'];
const FURN_COLORS = ['#ff5fa2', '#7b5cff', '#4f8cff', '#2ec4b6', '#8ac926', '#ffb703', '#ff7a59', '#c8875a', '#8d5a3b', '#6d6875', '#ffffff'];
const FRAMES = ['wood', 'gold', 'pink', 'white', 'polaroid', 'none'];
const FRAME_NAMES = { wood: 'Wood', gold: 'Gold', pink: 'Pink', white: 'White', polaroid: 'Polaroid', none: 'No frame' };
const STICKER_SETS = {
  '🌿 Plants': ['🪴', '🌵', '🌻', '💐', '🌷', '🌹', '🌿', '🍄', '🌳', '🌴'],
  '🐾 Pets': ['🐈', '🐕', '🐇', '🐠', '🦜', '🐢', '🦋', '🐹', '🐥', '🦖'],
  '🍕 Food': ['🍕', '🍩', '🧁', '🎂', '☕', '🍉', '🍿', '🍓', '🍪', '🧋'],
  '🎈 Fun': ['🎈', '🎀', '🧸', '🎁', '🎸', '🎹', '🎮', '⚽', '🏀', '🛹', '📚', '💻', '🕯️', '🎶', '🏆'],
  '💖 Love': ['❤️', '💕', '💌', '💘', '🌈', '⭐', '🌙', '✨', '👑', '💍'],
};
const FURN = {
  sofa: { label: 'Sofa', icon: '🛋️', c: '#ff5fa2', html: '<div class="back"></div><div class="arm l"></div><div class="arm r"></div><div class="seat"></div>' },
  bed: { label: 'Bed', icon: '🛏️', c: '#7b5cff', html: '<div class="head"></div><div class="mat"></div><div class="pillow p1"></div><div class="pillow p2"></div><div class="blanket"></div>' },
  tv: { label: 'TV', icon: '📺', c: '#8d5a3b', tap: true, html: '<div class="tv"><div class="scr"><span></span></div></div><div class="neck"></div><div class="stand"></div>' },
  shelf: { label: 'Bookshelf', icon: '📚', c: '#c8875a', html: '<i></i><i></i><i></i>' },
  table: { label: 'Table', icon: '🪑', c: '#c8875a', html: '<div class="top"></div>' },
  nightstand: { label: 'Nightstand', icon: '🗄️', c: '#c8875a', html: '<div class="lshade"></div><div class="lbase"></div><div class="body"></div><div class="drawer"></div>' },
  wardrobe: { label: 'Wardrobe', icon: '🚪', c: '#c8875a', html: '<div class="crown"></div><div class="body"></div><div class="kn l"></div><div class="kn r"></div><div class="feet"></div>' },
  fishtank: { label: 'Fish tank', icon: '🐠', c: '#6d6875', html: '<div class="glass"><span>🐠</span><span>🐟</span></div><div class="cab"></div>' },
  beanbag: { label: 'Bean bag', icon: '🟣', c: '#ff5fa2', html: '<div class="bag"></div>' },
  floorlamp: { label: 'Floor lamp', icon: '💡', c: '#ffb703', tap: true, html: '<div class="lglow"></div><div class="lshade"></div><div class="pole"></div><div class="base"></div>' },
  clock: { label: 'Clock', icon: '🕰️', c: '#ff5fa2', html: '<div class="face"></div><div class="hand hh"></div><div class="hand mh"></div><div class="pin"></div>' },
  fairy: { label: 'Fairy lights', icon: '✨', c: '#ffb703', html: '<div class="wire"></div>' + Array.from({ length: 11 }, (_, i) => {
    const x = 3 + i * 9, y = 2.2 + Math.sin(i / 10 * Math.PI) * 4, col = ['#ff4d6d', '#ffd60a', '#4f8cff', '#8ac926', '#c77dff'][i % 5];
    return `<i style="left:calc(${x}% - 1.2cqw);top:${y}cqw;background:${col};color:${col};animation-delay:${(i % 3) * .5}s"></i>`;
  }).join('') },
  arcade: { label: 'Arcade', icon: '🕹️', c: '#5a3fd6', tap: true, html: '<div class="cab"></div><div class="screen">👾</div><div class="label">GAMES</div><div class="btns"></div>' },
};
const TV_CHANNELS = ['', '🐠', '💕', '⚽', ''];
const THEMES = [
  ['🍑', 'Cozy', '#ffc8a2', { wall: '#ffc8a2', wp: 'stripes', floor: '#c8875a', fl: 'wood', rug: '#ff8fab', cur: '#ff5fa2' }],
  ['🍬', 'Candy', '#ff99c8', { wall: '#ff99c8', wp: 'hearts', floor: '#ffc6ff', fl: 'tiles', rug: '#ffffff', cur: '#c77dff' }],
  ['🚀', 'Space', '#2b2d42', { wall: '#2b2d42', wp: 'stars', floor: '#6d6875', fl: 'carpet', rug: '#7b5cff', cur: '#4f8cff' }],
  ['🌴', 'Jungle', '#d0f4de', { wall: '#d0f4de', wp: 'waves', floor: '#b5e48c', fl: 'grass', rug: '#ffb703', cur: '#8ac926' }],
  ['🌊', 'Ocean', '#90dbf4', { wall: '#90dbf4', wp: 'waves', floor: '#f4e1c1', fl: 'tiles', rug: '#4f8cff', cur: '#ffffff' }],
  ['🍋', 'Sunny', '#fff1a8', { wall: '#fff1a8', wp: 'dots', floor: '#e9b872', fl: 'wood', rug: '#ff7a59', cur: '#ffb703' }],
  ['🧱', 'Loft', '#ffadad', { wall: '#ffadad', wp: 'bricks', floor: '#8d5a3b', fl: 'wood', rug: '#6d6875', cur: 'none' }],
];
const EMOTES = ['❤️', '😂', '😘', '🥺', '😡', '😴', '🎉', '👋'];
const INK = ['#ffffff', '#2a2140', '#ff4d6d', '#ff9f1c', '#ffd60a', '#8ac926', '#4f8cff', '#7b5cff', '#ff5fa2'];
const BRUSHES = [5, 11, 22];
const ERASER_R = { 5: 18, 11: 30, 22: 50 };
const NOTE_COLORS = ['#fff59d', '#ffccbc', '#c8e6c9', '#b3e5fc', '#e1bee7', '#ffcdd2'];
const QUICK = ['❤️', '😂', '😘', '🥰', '😭', '👍', '🔥', '🤗', '🙈', '😴'];
const MAX_PHOTOS = 15;
const GAMES = [
  ['🍕', 'Last Slice', 'Reflex duel — grab the pizza first. Fair even with lag!'],
  ['🎨', 'Doodle Duel', 'One draws, the other guesses. Best with a call on.'],
  ['💘', 'How Well Do You Know Me?', 'Answer questions about each other and compare.'],
  ['🍪', 'Cookie Drop', 'Connect four… but with cookies.'],
  ['🧦', 'Sock Hunt', 'Hide your socks, find theirs. Turn by turn.'],
];
const TIPS = [
  ['👣', 'Tap the floor to walk around'],
  ['🚪', 'Tap the door to go to the other room'],
  ['😘', 'Tap yourself to react, tap your partner to poke them'],
  ['🏏', 'Walk up to your partner and bonk them with the bat!'],
  ['🎨', 'Decorate: furniture, photos, paint — drag anything anywhere'],
  ['✏️', 'Draw on the wall. Their drawings are protected for 1 hour 🔒'],
  ['📌', 'Pin notes on the board in the living room'],
  ['📺', 'Tap the TV to change the channel, the lamp for lights'],
];

const DEFAULT_PROFILES = {
  a: { name: 'Player 1', face: '🐻', color: '#4f8cff' },
  b: { name: 'Player 2', face: '🐰', color: '#ff5fa2' },
};
const HOME = { a: { x: 38, y: 76 }, b: { x: 62, y: 78 } };
const ONLINE_WINDOW = 45000;
const BONK_RANGE = 26;

// ── State ────────────────────────────────────────────────────
const S = { look: {}, profiles: {}, presence: {}, avatars: {}, items: {}, strokes: {}, notes: {}, msgs: [], typing: {} };
let store, roomId, me, other, call, view = 'living';
let panel = null, overlayMode = null, spaceUnsubs = [];
let decoTab = 'furniture', stickerSet = Object.keys(STICKER_SETS)[0], textInk = '#ffffff';
let tool = 'pen', ink = '#ffffff', brush = BRUSHES[1], noteColor = NOTE_COLORS[0], photoFrame = 'wood';
let selectedItem = null, drag = null, emoteTarget = null, erasing = null;
let presenceInit = false, chatInit = false, lastChatTs = 0;
const seenLog = new Set(); let logInit = false;
const lastEmote = {}, lastBonk = {}, lastLogged = {}, prevRoom = {};
const photoCache = new Map();

const sp = () => `spaces/${view}`;
const prof = id => ({ ...DEFAULT_PROFILES[id], ...(S.profiles?.[id] || {}) });
const joined = id => !!S.profiles?.[id];
const isOnline = id => { const p = S.presence[id]; return !!p && p.online && store.now() - p.ts < ONLINE_WINDOW; };
const roomOf = id => S.avatars[id]?.rm || 'living';
const together = () => isOnline(other) && roomOf(other) === view;
const readKey = kind => `ourroom:read:${kind}:${roomId}:${me}`;
const inviteLink = () => `${location.origin}${location.pathname}?room=${roomId}`;
const look = () => ({ ...DEFAULT_LOOK[view], ...S.look });
const canErase = o => !o.by || o.by === me || store.now() - (o.ts || 0) >= HOUR;
const minsLeft = o => Math.max(1, Math.ceil((HOUR - (store.now() - (o.ts || 0))) / 60000));

function ago(ts) {
  if (!ts) return 'a while ago';
  const s = Math.max(0, (store.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
function localTime(tz) {
  try { return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date()); }
  catch { return ''; }
}
function logAct(key, text) {
  const now = store.now();
  if (lastLogged[key] && now - lastLogged[key] < 45000) return;
  lastLogged[key] = now;
  store.push('log', { by: me, text, ts: now });
}
function toast(html, ms = 3800) {
  const t = document.createElement('div');
  t.className = 'toast'; t.innerHTML = html;
  $('#toasts').append(t);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}
function protectedToast(o, what) {
  toast(`🔒 ${esc(prof(o.by).name)}’s ${what} is protected for <b>${minsLeft(o)} more min</b>`);
}

// ── Boot ─────────────────────────────────────────────────────
boot();

async function boot() {
  const q = new URLSearchParams(location.search);
  roomId = q.get('room') || lsGet('ourroom:room');
  if (!roomId) return showRoomChoice();
  lsSet('ourroom:room', roomId);
  if (q.get('room') !== roomId) { q.set('room', roomId); history.replaceState(null, '', `${location.pathname}?${q}`); }

  try { store = await createStore(roomId); }
  catch (err) {
    console.error(err);
    return showCard(`<div class="big">😵</div><h2>Couldn’t open the room</h2><p class="muted">${esc(err.message || err)}</p>
      <p class="muted">Check your internet connection, and the Firebase settings in config.js.</p>
      <button class="btn" data-reload>Try again</button>`, 'error');
  }
  store.onError = msg => toast(esc(msg), 6000);
  if (store.mode === 'local') $('#demo-badge').hidden = false;

  me = q.get('me') || lsGet(`ourroom:me:${roomId}`);
  store.on('profiles', v => {
    S.profiles = v || {};
    if (other) { renderPresence(); renderAvatars(); renderBoard(); }
    if (overlayMode === 'welcome') showWelcome();
  });
  if (me !== 'a' && me !== 'b') { me = null; showWelcome(); }
  else if (!(await store.once(`profiles/${me}`))) showSetup(me);
  else showDoor();
}

function newRoomId() {
  const CH = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), b => CH[b % CH.length]).join('');
}

// ── Overlays ─────────────────────────────────────────────────
function showCard(html, mode, cls = '') {
  overlayMode = mode;
  const o = $('#overlay');
  o.hidden = false;
  o.innerHTML = `<div class="card ${cls}">${html}</div>`;
}
function hideOverlay() { overlayMode = null; $('#overlay').hidden = true; $('#overlay').innerHTML = ''; }

function showRoomChoice() {
  showCard(`<div class="big bounce">🏠</div><h2>Our Room</h2>
    <p class="muted">A cozy little home for two.</p>
    <div class="stack" style="margin-top:18px">
      <button class="btn wide" data-new-room>✨ Make our room</button>
      <p class="muted" style="margin-top:8px">Got an invite link from your partner? Paste it here:</p>
      <div class="linkbox"><input class="field" id="join-input" placeholder="Invite link"><button class="btn small" data-join-room>Join</button></div>
    </div>`, 'room');
}

function showWelcome() {
  const slot = id => {
    const p = prof(id), taken = joined(id);
    return `<button class="slot" data-slot="${id}"><span class="pface" style="--c:${esc(p.color)}">${esc(p.face)}</span>
      ${taken ? esc(p.name) : `Player ${id === 'a' ? 1 : 2}`}<small>${taken ? 'That’s me!' : 'Free spot'}</small></button>`;
  };
  showCard(`<div class="big bounce">🏠</div><h2>Welcome to Our Room</h2>
    <p class="muted">A cozy little home just for you two. Who are you?</p>
    <div class="slots">${slot('a')}${slot('b')}</div>
    <p class="muted" style="font-size:12px">Pick once on each phone. You’ll be remembered.</p>`, 'welcome');
}

function profileForm(id) {
  const p = prof(id);
  return `<label class="lbl">Your name</label>
    <input class="field" id="pf-name" maxlength="20" value="${esc(S.profiles?.[id]?.name || '')}" placeholder="Your name or nickname">
    <label class="lbl">Pick your look</label>
    <div class="faces">${FACES.map(f => `<button class="face-opt ${f === p.face ? 'on' : ''}" data-pick="${f}">${f}</button>`).join('')}</div>
    <label class="lbl">Hat or accessory</label>
    <div class="faces">${HATS.map(h => `<button class="face-opt hat-opt ${h === (p.hat || '') ? 'on' : ''}" data-pick-hat="${h}">${h || '🚫'}</button>`).join('')}</div>
    <label class="lbl">Your color</label>
    <div class="swatches">${COLORS.map(c => `<button class="sw ${c === p.color ? 'on' : ''}" style="background:${c}" data-pick-color="${c}"></button>`).join('')}</div>`;
}
function readProfileForm(root, id) {
  return {
    name: ($('#pf-name', root).value.trim() || prof(id).name).slice(0, 20),
    face: $('.face-opt.on[data-pick]', root)?.dataset.pick || prof(id).face,
    hat: $('.hat-opt.on', root)?.dataset.pickHat ?? '',
    color: $('.sw.on', root)?.dataset.pickColor || prof(id).color,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function showSetup(id) {
  showCard(`<h2>Make your character</h2>${profileForm(id)}
    <button class="btn wide" style="margin-top:20px" data-setup-done="${id}">Enter the room 🚪</button>
    <button class="btn ghost wide small" style="margin-top:8px" data-back>Back</button>`, 'setup');
}

function showDoor() {
  const p = prof(me);
  showCard(`<div class="door-big">🚪</div><h2>Hi ${esc(p.name)}! ${esc(p.face)}</h2>
    <p class="muted">Your room is waiting.</p>
    <button class="btn wide" style="margin-top:14px" data-enter>Knock knock… come in!</button>`, 'door');
}

// ── Entering ─────────────────────────────────────────────────
async function enterRoom() {
  unlockAudio();
  other = me === 'a' ? 'b' : 'a';
  hideOverlay();
  $('#app').hidden = false;

  const prev = await store.once(`presence/${me}`);
  const prevSeen = prev?.ts || 0;
  store.update(`profiles/${me}`, { tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const av = await store.once(`avatars/${me}`);
  view = ROOMS[av?.rm] ? av.rm : 'living';
  if (!av || av.x == null) store.update(`avatars/${me}`, { ...HOME[me], rm: view });
  store.presence(me);

  store.on('presence', onPresence);
  store.on('avatars', onAvatars);
  store.on('notes', v => { S.notes = v || {}; renderBoard(); if (panel === 'notes') { renderNotes(); markRead('notes'); } updateBadges(); });
  store.on('chat', onChat, { last: 150 });
  store.on('log', onLog, { last: 40 });
  store.on('typing', v => { S.typing = v || {}; renderTyping(); });
  await openSpace(view);

  call = createCall(store, me, other, callUI);
  setupStage();
  setupWallDrawing();
  renderWindow();
  setInterval(() => { renderPresence(); renderAvatars(); renderWindow(); tickClocks(); }, 15000);
  setTimeout(() => showAwaySummary(prevSeen), 900);
}

async function openSpace(rid) {
  spaceUnsubs.forEach(u => u());
  view = rid;
  S.look = {}; S.items = {}; S.strokes = {};
  selectItem(null);
  $('#items').innerHTML = '';
  $('#stage').classList.remove('rm-living', 'rm-bedroom');
  $('#stage').classList.add('rm-' + rid);
  const nxt = NEXT_ROOM[rid];
  $('.door-sign').textContent = `${ROOMS[nxt].icon} ${ROOMS[nxt].name}`;
  if (!(await store.once(`${sp()}/seeded`))) {
    const upd = { seeded: true };
    for (const [k, v] of Object.entries(SEED[rid])) upd[`items/${k}`] = { s: 1, ...v, ts: 0 };
    store.update(sp(), upd);
  }
  spaceUnsubs = [
    store.on(`${sp()}/look`, v => { S.look = v || {}; renderLook(); }),
    store.on(`${sp()}/items`, v => { S.items = v || {}; renderItems(); renderAvatars(); }),
    store.on(`${sp()}/strokes`, v => { S.strokes = v || {}; if (!erasing) drawWall(); }),
  ];
  renderLook(); renderAvatars(); renderPresence(); renderBoard();
}

async function goThroughDoor() {
  const next = NEXT_ROOM[view];
  const door = $('#door');
  door.classList.add('open'); sfx.knock();
  store.update(`avatars/${me}`, { x: DOOR_SPOT[view].x, y: DOOR_SPOT[view].y });
  await new Promise(r => setTimeout(r, 700));
  $('#stage').classList.add('switching');
  await new Promise(r => setTimeout(r, 350));
  if (panel && panel !== 'chat' && panel !== 'notes' && panel !== 'games') closePanel();
  store.update(`avatars/${me}`, { rm: next, x: DOOR_SPOT[next].x, y: DOOR_SPOT[next].y + 6 });
  $$('.avatar').forEach(a => a.remove());
  await openSpace(next);
  door.classList.remove('open');
  setTimeout(() => $('#stage').classList.remove('switching'), 60);
}

async function showAwaySummary(prevSeen) {
  if (overlayMode) return;
  if (!prevSeen) return showTips(true);
  const [log, chat, notes] = await Promise.all([store.once('log', { last: 40 }), store.once('chat', { last: 150 }), store.once('notes')]);
  const since = o => Object.values(o || {}).filter(e => e.by === other && e.ts > prevSeen);
  const acts = [...new Set(since(log).map(e => e.text))].slice(-8);
  const nMsg = since(chat).length, nNotes = since(notes).length;
  if (!acts.length && !nMsg && !nNotes) return;
  const p = prof(other);
  const lines = [
    ...acts.map(a => `<li>${esc(a)}</li>`),
    nMsg ? `<li>💬 sent you ${nMsg} message${nMsg > 1 ? 's' : ''}</li>` : '',
    nNotes ? `<li>📌 left ${nNotes} note${nNotes > 1 ? 's' : ''} on the board</li>` : '',
  ].join('');
  showCard(`<div class="big bounce">${esc(p.face)}</div><h2>While you were away…</h2>
    <p class="muted"><b>${esc(p.name)}</b> dropped by:</p><ul class="list">${lines}</ul>
    <div class="row" style="justify-content:center">${nMsg ? '<button class="btn" data-open="chat">Read messages</button>' : ''}
    ${nNotes && !nMsg ? '<button class="btn" data-open="notes">See notes</button>' : ''}
    <button class="btn ghost" data-dismiss>Yay 💕</button></div>`, 'summary');
}

function showTips(first = false) {
  const invite = !joined(other)
    ? `<p class="muted" style="margin-top:14px">Send this link to your partner so they can join:</p>
       <div class="linkbox"><input class="field" readonly value="${esc(inviteLink())}"><button class="btn small" data-share>Share</button></div>` : '';
  showCard(`<div class="big bounce">🏠</div><h2>${first ? 'Welcome home!' : 'How it works'}</h2>
    <ul class="list">${TIPS.map(([e, t]) => `<li>${e} ${t}</li>`).join('')}</ul>${invite}
    <button class="btn wide" style="margin-top:14px" data-dismiss>Let’s go!</button>`, 'tips');
}

// ── Presence ─────────────────────────────────────────────────
function onPresence(v) {
  const was = presenceInit && isOnline(other);
  S.presence = v || {};
  const now = isOnline(other);
  if (presenceInit && now && !was) { toast(`${esc(prof(other).face)} <b>${esc(prof(other).name)}</b> came home! (${esc(ROOMS[roomOf(other)].name)})`); sfx.knock(); }
  if (presenceInit && was && !now) toast(`${esc(prof(other).name)} left 👋`);
  presenceInit = true;
  renderPresence(); renderAvatars();
  if (panel === 'games') renderGamesPanel();
}

function renderPresence() {
  if (!other) return;
  const mp = prof(me), op = prof(other), on = isOnline(other), rm = ROOMS[roomOf(other)];
  $('#pill-me').innerHTML = `<span class="pface" style="--c:${esc(mp.color)}">${esc(mp.face)}</span><span class="pinfo"><b>${esc(mp.name)}</b><small>${ROOMS[view].icon} ${ROOMS[view].name}</small></span>`;
  const status = !joined(other) ? 'Hasn’t joined yet — send the link!'
    : on ? `<i class="dot on"></i>${roomOf(other) === view ? 'Here with you' : `In the ${rm.name.toLowerCase()} ${rm.icon}`}` : `<i class="dot"></i>Away · ${ago(S.presence[other]?.ts)}`;
  const tz = op.tz ? ` · 🕒 ${esc(localTime(op.tz))}` : '';
  $('#pill-other').innerHTML = `<span class="pface" style="--c:${esc(op.color)}">${esc(op.face)}</span><span class="pinfo"><b>${esc(joined(other) ? op.name : 'Your partner')}</b><small>${status}${joined(other) ? tz : ''}</small></span>`;
  $$('.k-arcade').forEach(a => a.closest('.item')?.classList.toggle('ready', on));
}

// ── Room look ────────────────────────────────────────────────
function renderLook() {
  const r = look();
  const wall = $('#wall'), floor = $('#floor');
  wall.style.setProperty('--wall', r.wall);
  wall.className = 'wp-' + r.wp;
  floor.style.setProperty('--floor', r.floor);
  floor.className = 'fl-' + r.fl;
  $('.rug').classList.toggle('none', r.rug === 'none');
  if (r.rug !== 'none') floor.style.setProperty('--rug', r.rug);
  $('#window').classList.toggle('nocur', r.cur === 'none');
  if (r.cur !== 'none') $('#window').style.setProperty('--cur', r.cur);
  $('#stage').classList.toggle('lights-off', r.lights === false);
  if (panel === 'decorate' && ['wall', 'floor', 'themes'].includes(decoTab)) renderDecoBody();
}
function renderWindow() {
  const h = new Date().getHours();
  const w = $('#window');
  w.classList.toggle('night', h >= 19 || h < 6);
  w.classList.toggle('dusk', h >= 17 && h < 19);
}
function toggleLights() {
  const off = look().lights !== false;
  store.update(`${sp()}/look`, { lights: !off });
  sfx.pop();
  logAct('lights', `turned the ${ROOMS[view].name.toLowerCase()} lights ${off ? 'off 🌙' : 'on 💡'}`);
}

// ── Avatars ──────────────────────────────────────────────────
function onAvatars(v) {
  S.avatars = v || {};
  const r = roomOf(other);
  if (prevRoom[other] !== undefined && prevRoom[other] !== r && r === view && isOnline(other)) {
    toast(`${esc(prof(other).face)} <b>${esc(prof(other).name)}</b> came into the ${esc(ROOMS[view].name.toLowerCase())}`);
    sfx.knock();
  }
  prevRoom[other] = r;
  renderAvatars();
}

function restSpot(id) {
  const kind = ROOMS[view].rest;
  const it = Object.values(S.items).find(i => i.t === 'furn' && i.k === kind);
  if (!it) return { x: id === 'a' ? 30 : 70, y: 70, z: 0 };
  const s = it.s || 1, dx = (kind === 'bed' ? 10 : 9) * s * (id === 'a' ? -1 : 1);
  const dy = (kind === 'bed' ? 9 : 4.5) * s;
  return { x: it.x + dx, y: it.y - dy, z: (it.z ?? Math.round(it.y * 10)) + 1 };
}

function renderAvatars() {
  if (!other) return;
  const layer = $('#avatars');
  for (const id of ['a', 'b']) {
    let el = layer.querySelector(`[data-id="${id}"]`);
    const visible = id === me || (joined(id) && roomOf(id) === view);
    if (!visible) { el?.remove(); continue; }
    const p = prof(id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'avatar'; el.dataset.id = id;
      el.innerHTML = '<div class="bubble"></div><div class="body"><span class="face"></span><span class="hat"></span><span class="zzz">💤</span></div><div class="tag"></div>';
      layer.append(el);
    }
    const online = id === me || isOnline(id);
    const a = S.avatars[id];
    const rest = online ? null : restSpot(id);
    const pos = rest || (a?.x != null ? a : HOME[id]);
    const px = parseFloat(el.style.left), py = parseFloat(el.style.top);
    if (!isNaN(px) && (Math.abs(px - pos.x) > .5 || Math.abs(py - pos.y) > .5)) {
      if (pos.x < px - .5) el.classList.add('left'); else if (pos.x > px + .5) el.classList.remove('left');
      el.classList.add('walking');
      clearTimeout(el._wt); el._wt = setTimeout(() => el.classList.remove('walking'), 900);
    }
    el.style.left = pos.x + '%';
    el.style.top = pos.y + '%';
    el.style.zIndex = rest ? rest.z : Math.round(pos.y * 10) + 1;
    el.style.setProperty('--c', p.color);
    if (!el._bonked) $('.face', el).textContent = p.face;
    const hat = $('.hat', el);
    hat.textContent = p.hat || '';
    hat.className = 'hat ' + (HAT_CLASS[p.hat] || '');
    $('.tag', el).textContent = p.name;
    el.classList.toggle('away', !online);
    el.classList.toggle('me', id === me);

    // reactions
    const em = a?.emote;
    if (em && em.ts !== lastEmote[id]) {
      const fresh = lastEmote[id] !== undefined || store.now() - em.ts < 5000;
      lastEmote[id] = em.ts;
      if (fresh && store.now() - em.ts < 8000) {
        showEmote(em.to || id, em.e);
        if (em.to === me && id !== me) { navigator.vibrate?.([80, 40, 80]); sfx.poke(); }
      }
    } else if (!em && lastEmote[id] === undefined) lastEmote[id] = 0;

    // bonks
    const bk = a?.bonk;
    if (bk && bk.ts !== lastBonk[id]) {
      const fresh = lastBonk[id] !== undefined || store.now() - bk.ts < 4000;
      lastBonk[id] = bk.ts;
      if (fresh && store.now() - bk.ts < 6000) playBonk(id, bk.to, bk.hit);
    } else if (!bk && lastBonk[id] === undefined) lastBonk[id] = 0;
  }
  if (!$('#emotebar').hidden && emoteTarget) positionEmotebar();
}

function spawnFx(text, x, y, cls = 'float', extra = {}) {
  const f = document.createElement('div');
  f.className = cls; f.textContent = text;
  f.style.left = x; f.style.top = y;
  for (const [k, v] of Object.entries(extra)) f.style.setProperty(k, v);
  $('#fx').append(f);
  setTimeout(() => f.remove(), 2600);
  return f;
}

function showEmote(id, e) {
  const av = $(`.avatar[data-id="${id}"]`); if (!av) return;
  const n = e === '❤️' || e === '🎉' ? 5 : 1;
  for (let i = 0; i < n; i++) {
    const f = spawnFx(e, `calc(${av.style.left} + ${(Math.random() - .5) * 8}cqw)`, `calc(${av.style.top} - 22cqw)`, 'float', { '--dx': `${(Math.random() - .5) * 16}cqw` });
    f.style.animationDelay = `${i * 0.12}s`;
  }
  if (e === '👋' || e === '😡') { av.classList.remove('shake'); void av.offsetWidth; av.classList.add('shake'); }
}

// 🏏 BONK
function playBonk(from, to, hit) {
  const target = $(`.avatar[data-id="${to}"]`), attacker = $(`.avatar[data-id="${from}"]`);
  if (!target) return;
  const tx = parseFloat(target.style.left), ty = parseFloat(target.style.top);
  const fromLeft = attacker ? parseFloat(attacker.style.left) < tx : true;
  const bat = spawnFx('🏏', `${tx + (fromLeft ? -9 : 9)}%`, `calc(${ty}% - 24cqw)`, 'bat' + (fromLeft ? '' : ' flip'));
  bat.addEventListener('animationend', () => bat.remove());
  setTimeout(() => {
    if (hit) {
      sfx.bonk();
      if (to === me) navigator.vibrate?.(180);
      const face = $('.face', target);
      target._bonked = true;
      face.textContent = '😵';
      target.classList.remove('bonked'); void target.offsetWidth; target.classList.add('bonked');
      spawnFx('BONK!', `${clamp(tx, 22, 78)}%`, `calc(${ty}% - 26cqw)`, 'bonk-word');
      for (let i = 0; i < 3; i++) spawnFx('⭐', `${tx}%`, `calc(${ty}% - 17cqw)`, 'star', { '--a': `${i * 120}deg` });
      setTimeout(() => { target._bonked = false; face.textContent = prof(to).face; target.classList.remove('bonked'); }, 1300);
    } else {
      sfx.whiff();
      target.classList.remove('dodge'); void target.offsetWidth; target.classList.add('dodge');
      spawnFx('MISS!', `${clamp(tx, 18, 82)}%`, `calc(${ty}% - 26cqw)`, 'bonk-word miss');
      setTimeout(() => target.classList.remove('dodge'), 600);
    }
  }, 280);
}

function tryBonk(target) {
  hideEmotebar();
  const mine = S.avatars[me] || HOME[me], theirs = S.avatars[target];
  if (!theirs) return;
  const dist = Math.hypot(mine.x - theirs.x, (mine.y - theirs.y) * 1.2);
  if (dist > BONK_RANGE) {
    // sneak up next to them first
    const side = mine.x < theirs.x ? -1 : 1;
    store.update(`avatars/${me}`, { x: +clamp(theirs.x + side * 14, 8, 92).toFixed(1), y: theirs.y });
    toast('🏏 Sneaking up… tap them again to bonk!', 2500);
    return;
  }
  const hit = Math.random() < 0.75;
  store.update(`avatars/${me}`, { bonk: { to: target, hit, ts: store.now() } });
}

function showBubble(id, text, ms = 5000) {
  const b = $(`.avatar[data-id="${id}"] .bubble`); if (!b) return;
  b.textContent = text.length > 80 ? text.slice(0, 78) + '…' : text;
  b.classList.remove('typing'); b.classList.add('show');
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('show'), ms);
}

function sendEmote(e) {
  store.update(`avatars/${me}`, { emote: { e, ts: store.now(), to: emoteTarget === me ? null : emoteTarget } });
  hideEmotebar();
}
function openEmotebar(target) {
  emoteTarget = target;
  const bar = $('#emotebar');
  const extra = target === me ? '' : `<button data-bonk="${target}" aria-label="Bonk">🏏</button>`;
  bar.innerHTML = extra + EMOTES.map(e => `<button data-emote="${e}">${e}</button>`).join('');
  bar.hidden = false;
  positionEmotebar();
}
function positionEmotebar() {
  const av = $(`.avatar[data-id="${emoteTarget}"]`), bar = $('#emotebar');
  if (!av) return hideEmotebar();
  bar.style.left = clamp(parseFloat(av.style.left), 44, 56) + '%';
  bar.style.top = `calc(${av.style.top} - 22cqw)`;
}
function hideEmotebar() { $('#emotebar').hidden = true; emoteTarget = null; }

// ── Stage interactions ───────────────────────────────────────
function stagePct(e) {
  const r = $('#stage').getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
}

function setupStage() {
  const stage = $('#stage');
  stage.addEventListener('click', e => {
    if (e.target.closest('.popbar')) return;
    const hadEmote = !$('#emotebar').hidden;
    const prevTarget = emoteTarget;
    hideEmotebar();
    if (panel === 'draw') return;
    if (panel === 'decorate') { if (!e.target.closest('.item')) selectItem(null); return; }

    const av = e.target.closest('.avatar');
    if (av) {
      const id = av.dataset.id;
      if (id !== me && !isOnline(id)) return toast(`${esc(prof(id).name)} is napping 💤 Leave a note 📌 or a message 💬!`);
      return hadEmote && prevTarget === id ? null : openEmotebar(id);
    }
    const itemEl = e.target.closest('.item');
    if (itemEl) return tapItem(itemEl.dataset.id);
    if (e.target.closest('#board')) return openPanel('notes');
    if (e.target.closest('#door')) return goThroughDoor();
    if (e.target.closest('#lamp')) return toggleLights();
    if (hadEmote) return;
    const p = stagePct(e);
    if (p.y < 50) return;
    sfx.swish();
    store.update(`avatars/${me}`, { x: +clamp(p.x, 8, 92).toFixed(1), y: +clamp(p.y + 4, 60, 97).toFixed(1) });
  });

  // Drag items while decorating
  const layer = $('#items');
  layer.addEventListener('pointerdown', e => {
    const el = e.target.closest('.item');
    if (!el || panel !== 'decorate') return;
    e.preventDefault();
    const id = el.dataset.id, it = S.items[id]; if (!it) return;
    selectItem(id);
    const p = stagePct(e);
    drag = { id, el, dx: p.x - it.x, dy: p.y - it.y, x: it.x, y: it.y, moved: false };
    el.setPointerCapture(e.pointerId);
  });
  layer.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = stagePct(e);
    drag.x = clamp(p.x - drag.dx, 2, 98); drag.y = clamp(p.y - drag.dy, 4, 99); drag.moved = true;
    Object.assign(drag.el.style, { left: drag.x + '%', top: drag.y + '%' });
    if (S.items[drag.id]?.z == null) drag.el.style.zIndex = Math.round(drag.y * 10);
    positionItembar();
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved) store.update(`${sp()}/items/${d.id}`, { x: +d.x.toFixed(2), y: +d.y.toFixed(2) });
  };
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', end);
}

function tapItem(id) {
  const it = S.items[id]; if (!it) return;
  if (it.t === 'photo') return showPhoto(it);
  if (it.k === 'tv') {
    const ch = ((it.ch ?? 0) + 1) % TV_CHANNELS.length;
    store.update(`${sp()}/items/${id}`, { ch }); sfx.pop();
    return;
  }
  if (it.k === 'arcade') return openPanel('games');
  if (it.k === 'floorlamp') return toggleLights();
}

// ── Items ────────────────────────────────────────────────────
function renderItems() {
  const layer = $('#items');
  const seen = new Set();
  for (const [id, it] of Object.entries(S.items)) {
    seen.add(id);
    const kind = it.t === 'furn' ? 'furn:' + it.k : it.t;
    let el = layer.querySelector(`[data-id="${id}"]`);
    if (el && el.dataset.kind !== kind) { el.remove(); el = null; }
    if (!el) {
      el = document.createElement('div');
      el.dataset.id = id; el.dataset.kind = kind;
      if (it.t === 'furn') el.innerHTML = `<div class="furn k-${it.k}" style="position:relative">${FURN[it.k]?.html || ''}</div>`;
      if (it.t === 'photo') el.innerHTML = `<div class="ph"><div class="ph-empty">🖼️</div><div class="cap"></div></div>`;
      el._new = true; setTimeout(() => { el._new = false; el.classList.remove('new'); }, 450);
      layer.append(el);
    }
    const tappable = it.t === 'photo' || (it.t === 'furn' && FURN[it.k]?.tap);
    el.className = ['item', it.t, tappable ? 'tap' : '', id === selectedItem ? 'sel' : '', el._new ? 'new' : ''].join(' ');
    el.style.setProperty('--s', it.s || 1);
    el.style.setProperty('--fx', it.fl ? -1 : 1);
    if (it.t === 'emoji' || it.t === 'text') el.textContent = it.v;
    if (it.t === 'text') el.style.color = it.c || '#fff';
    if (it.t === 'furn') {
      el.style.setProperty('--c', it.c || FURN[it.k]?.c);
      if (it.k === 'tv') {
        const ch = it.ch ?? 0;
        $('.tv', el).className = 'tv ch' + ch;
        $('.scr span', el).textContent = TV_CHANNELS[ch];
      }
    }
    if (it.t === 'photo') {
      const ph = $('.ph', el);
      ph.className = 'ph f-' + (it.f || 'wood');
      $('.cap', el).textContent = it.cap || '';
      loadPhoto(it.pid).then(src => {
        if (!src || $('img', ph)?.src === src) return;
        const img = new Image(); img.src = src; img.alt = it.cap || 'Photo'; img.draggable = false;
        ($('img', ph) || $('.ph-empty', ph)).replaceWith(img);
        positionItembar();
      });
    }
    if (drag?.id !== id) {
      el.style.left = it.x + '%'; el.style.top = it.y + '%';
      el.style.zIndex = it.z ?? Math.round(it.y * 10);
    }
  }
  $$('.item', layer).forEach(el => { if (!seen.has(el.dataset.id)) el.remove(); });
  if (selectedItem && !S.items[selectedItem]) selectItem(null);
  tickClocks();
  renderPresence();
  positionItembar();
}

function tickClocks() {
  const d = new Date(), m = d.getMinutes(), h = d.getHours() % 12 + m / 60;
  $$('.k-clock').forEach(c => { c.style.setProperty('--h', h * 30 + 'deg'); c.style.setProperty('--m', m * 6 + 'deg'); });
}

async function loadPhoto(pid) {
  if (!pid) return null;
  if (photoCache.has(pid)) return photoCache.get(pid);
  const p = store.once(`photos/${pid}`).then(v => v?.d || null);
  photoCache.set(pid, p);
  const d = await p;
  photoCache.set(pid, d);
  return d;
}
async function showPhoto(it) {
  const src = await loadPhoto(it.pid);
  if (!src) return;
  showCard(`<img src="${esc(src)}" alt="">${it.cap ? `<div class="cap">${esc(it.cap)}</div>` : ''}
    <p class="muted">Hung by ${esc(prof(it.by).name)} · ${ago(it.ts)}</p>
    <button class="btn ghost wide small" data-dismiss style="margin-top:6px">Close</button>`, 'photo', 'photo-view');
}

function selectItem(id) {
  selectedItem = id;
  $$('#items .item').forEach(el => el.classList.toggle('sel', el.dataset.id === id));
  positionItembar();
}
function positionItembar() {
  const bar = $('#itembar');
  const el = selectedItem && $(`#items [data-id="${selectedItem}"]`);
  const it = selectedItem && S.items[selectedItem];
  if (!el || !it || panel !== 'decorate') { bar.hidden = true; return; }
  const sr = $('#stage').getBoundingClientRect(), r = el.getBoundingClientRect();
  bar.hidden = false;
  $('[data-item=style]', bar).hidden = it.t === 'emoji';
  $('[data-item=flip]', bar).hidden = it.t === 'text' || it.t === 'photo';
  bar.style.left = clamp((r.left + r.width / 2 - sr.left) / sr.width * 100, 30, 70) + '%';
  bar.style.top = Math.max(9, (r.top - sr.top) / sr.height * 100 - 1) + '%';
}
function itemAction(act) {
  const id = selectedItem, it = S.items[id]; if (!it) return;
  const path = `${sp()}/items/${id}`;
  if (act === 'delete') {
    if (it.t === 'text' && !canErase(it)) {
      const el = $(`#items [data-id="${id}"]`); el?.classList.remove('shake'); void el?.offsetWidth; el?.classList.add('shake');
      return protectedToast(it, 'writing');
    }
    store.remove(path);
    if (it.t === 'photo' && it.pid) { store.remove(`photos/${it.pid}`); photoCache.delete(it.pid); logAct('photo-rm', `took down a photo in the ${ROOMS[view].name.toLowerCase()} 🖼️`); }
    selectItem(null); sfx.pop();
    return;
  }
  if (act === 'front') {
    const top = Math.max(1000, ...Object.values(S.items).map(i => i.z || 0));
    return store.update(path, { z: top + 1 });
  }
  if (act === 'flip') return store.update(path, { fl: !it.fl });
  if (act === 'style') {
    const cycle = (list, cur) => list[(list.indexOf(cur) + 1) % list.length];
    if (it.t === 'furn') store.update(path, { c: cycle(FURN_COLORS, it.c) });
    if (it.t === 'photo') { const f = cycle(FRAMES, it.f || 'wood'); store.update(path, { f }); toast(`Frame: ${FRAME_NAMES[f]}`, 1200); }
    if (it.t === 'text') store.update(path, { c: cycle(INK, it.c) });
    return;
  }
  const s = clamp((it.s || 1) * (act === 'bigger' ? 1.15 : 1 / 1.15), .35, 3.5);
  store.update(path, { s: +s.toFixed(2) });
}
function addItem(data, logKey, logText) {
  const id = store.push(`${sp()}/items`, { s: 1, ...data, by: me, ts: store.now() });
  selectItem(id); sfx.pop();
  if (logKey) logAct(logKey, logText);
  return id;
}
const addSticker = v => addItem({ t: 'emoji', v, x: 30 + Math.random() * 40, y: 70 + Math.random() * 15 }, 'sticker:' + v, `added ${v} to the ${ROOMS[view].name.toLowerCase()}`);
const addFurniture = k => addItem({ t: 'furn', k, c: FURN[k].c, x: 50, y: k === 'clock' || k === 'fairy' ? 30 : 78, ...(k === 'tv' ? { ch: 0 } : {}) },
  'furn:' + k, `added a ${FURN[k].label.toLowerCase()} ${FURN[k].icon} to the ${ROOMS[view].name.toLowerCase()}`);
function addText() {
  const inp = $('#text-input'); const v = inp?.value.trim(); if (!v) return inp?.focus();
  addItem({ t: 'text', v: v.slice(0, 60), c: textInk, x: 50, y: 28 + Math.random() * 16 }, 'text', 'wrote something on the wall ✍️');
  inp.value = '';
}

// Photos from the gallery: shrink on the phone, then store in the database (free tier friendly)
async function addPhoto(file) {
  if (!file) return;
  if (Object.values(S.items).filter(i => i.t === 'photo').length >= MAX_PHOTOS) return toast(`This room already has ${MAX_PHOTOS} photos — take one down first 🖼️`);
  toast('Hanging your photo… 🔨', 2000);
  try {
    const d = await shrinkImage(file, 720, 0.72);
    const pid = store.newKey('photos');
    await store.set(`photos/${pid}`, { d, by: me, ts: store.now() });
    photoCache.set(pid, d);
    const cap = ($('#photo-cap')?.value || '').trim().slice(0, 40);
    if ($('#photo-cap')) $('#photo-cap').value = '';
    addItem({ t: 'photo', pid, f: photoFrame, cap, x: 30 + Math.random() * 40, y: 26 + Math.random() * 12 }, 'photo', `hung a photo in the ${ROOMS[view].name.toLowerCase()} 🖼️`);
  } catch (err) {
    console.error(err);
    toast('Couldn’t open that photo 😕 Try another one.');
  }
}
async function shrinkImage(file, max, quality) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}

// ── Wall drawing + eraser ────────────────────────────────────
const parsePts = s => String(s.p || '').split(' ').filter(Boolean).map(p => p.split(',').map(Number));
const sortStrokes = obj => Object.entries(obj).sort(([ka, a], [kb, b]) => (a.ts || 0) - (b.ts || 0) || (ka < kb ? -1 : 1));

function setupWallDrawing() {
  const cv = $('#wall-canvas'), wall = $('#wall');
  new ResizeObserver(() => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(wall.clientWidth * dpr); cv.height = Math.round(wall.clientHeight * dpr);
    drawWall();
  }).observe(wall);

  let cur = null, lastPt = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000), Math.round((e.clientY - r.top) / r.height * 1000)]; };
  cv.addEventListener('pointerdown', e => {
    if (panel !== 'draw') return;
    e.preventDefault(); cv.setPointerCapture(e.pointerId);
    const p = pt(e);
    if (tool === 'erase') { startErase(); eraseAt(p, e); lastPt = p; return; }
    cur = { c: ink, w: brush, pts: [p] };
    paint(cur, cur.pts);
  });
  cv.addEventListener('pointermove', e => {
    const p = pt(e);
    if (erasing) {
      const d = Math.hypot(p[0] - lastPt[0], p[1] - lastPt[1]), n = Math.ceil(d / 10);
      for (let i = 1; i <= n; i++) eraseAt([lastPt[0] + (p[0] - lastPt[0]) * i / n, lastPt[1] + (p[1] - lastPt[1]) * i / n], e);
      lastPt = p;
      return;
    }
    if (!cur) return;
    const last = cur.pts[cur.pts.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 4) return;
    cur.pts.push(p);
    paint(cur, [last, p]);
  });
  const end = () => {
    if (erasing) return finishErase();
    if (!cur) return;
    const s = cur; cur = null;
    let pts = s.pts;
    while (pts.length > 500) pts = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);
    store.push(`${sp()}/strokes`, { by: me, c: s.c, w: s.w, p: pts.map(p => p.join(',')).join(' '), ts: store.now() });
    logAct('draw', `drew on the ${ROOMS[view].name.toLowerCase()} wall ✏️`);
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function paint(s, pts, ctx = $('#wall-canvas').getContext('2d')) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.strokeStyle = ctx.fillStyle = s.c;
  ctx.lineWidth = s.w / 1000 * W; ctx.lineCap = ctx.lineJoin = 'round';
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0] / 1000 * W, pts[0][1] / 1000 * H, ctx.lineWidth / 2, 0, 7); ctx.fill(); return; }
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x / 1000 * W, y / 1000 * H));
  ctx.stroke();
}
function drawWall(src = S.strokes) {
  const cv = $('#wall-canvas'), ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  for (const [, s] of sortStrokes(src)) {
    const pts = s.pts || parsePts(s);
    if (pts.length) paint(s, pts, ctx);
  }
}

function densify(pts, step = 6) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const n = Math.floor(Math.hypot(x1 - x0, y1 - y0) / step);
    for (let j = 1; j <= n; j++) out.push([Math.round(x0 + (x1 - x0) * j / (n + 1)), Math.round(y0 + (y1 - y0) * j / (n + 1))]);
    out.push(pts[i]);
  }
  return out;
}
function startErase() {
  const work = {};
  for (const [k, s] of Object.entries(S.strokes)) work[k] = { ...s, pts: parsePts(s) };
  erasing = { work, warned: new Set(), texts: new Set(), n: 0 };
}
function eraseAt([x, y], e) {
  const R = ERASER_R[brush] || 30, W = erasing.work;
  let changed = false;
  for (const [k, s] of Object.entries(W)) {
    const r2 = (R + s.w / 2) ** 2;
    if (!s.pts.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 < r2)) continue;
    if (!canErase(s)) {
      if (!erasing.warned.has(s.by)) { erasing.warned.add(s.by); protectedToast(s, 'drawing'); }
      continue;
    }
    const segs = []; let run = [];
    for (const p of densify(s.pts)) {
      if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < r2) { if (run.length) segs.push(run); run = []; }
      else run.push(p);
    }
    if (run.length) segs.push(run);
    delete W[k];
    segs.forEach((pts, i) => { if (pts.length > 1 || s.w > 8) W[`${k}~${erasing.n++}_${i}`] = { ...s, pts }; });
    changed = true;
  }
  // words written on the wall
  for (const el of $$('#items .item.text')) {
    const id = el.dataset.id, it = S.items[id];
    if (!it || erasing.texts.has(id)) continue;
    const r = el.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) continue;
    erasing.texts.add(id);
    if (!canErase(it)) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); protectedToast(it, 'writing'); continue; }
    store.remove(`${sp()}/items/${id}`);
  }
  if (changed) drawWall(W);
}
function finishErase() {
  const { work } = erasing;
  erasing = null;
  const upd = {};
  for (const k of Object.keys(S.strokes)) if (!work[k]) upd[k] = null;
  for (const [k, s] of Object.entries(work)) {
    if (S.strokes[k]) continue;
    let pts = s.pts;
    while (pts.length > 600) pts = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1);
    upd[store.newKey(`${sp()}/strokes`)] = { by: s.by || null, c: s.c, w: s.w, ts: s.ts || 0, p: pts.map(p => p.join(',')).join(' ') };
  }
  if (Object.keys(upd).length) store.update(`${sp()}/strokes`, upd);
  else drawWall();
}
function undoStroke() {
  const mine = Object.values(S.strokes).filter(s => s.by === me).map(s => s.ts).sort((a, b) => a - b);
  if (!mine.length) return toast('Nothing of yours to undo ✨');
  const ts = mine[mine.length - 1], upd = {};
  for (const [k, s] of Object.entries(S.strokes)) if (s.by === me && s.ts === ts) upd[k] = null;
  store.update(`${sp()}/strokes`, upd);
}
function clearWall() {
  const all = Object.entries(S.strokes);
  if (!all.length) return toast('The wall is already clean ✨');
  const ok = all.filter(([, s]) => canErase(s));
  const locked = all.filter(([, s]) => !canErase(s));
  if (!ok.length) return protectedToast(locked[0][1], 'drawing');
  const note = locked.length ? `\n\n🔒 ${prof(other).name}’s newest drawings are protected and will stay.` : '';
  if (!confirm(`Clear the drawings from this wall?${note}`)) return;
  store.update(`${sp()}/strokes`, Object.fromEntries(ok.map(([k]) => [k, null])));
  logAct('wipe', `cleaned the ${ROOMS[view].name.toLowerCase()} wall 🧽`);
}

// ── Notes board ──────────────────────────────────────────────
const unread = kind => {
  const read = +(lsGet(readKey(kind)) || 0);
  const list = kind === 'chat' ? S.msgs : Object.values(S.notes);
  return list.filter(m => m.by === other && m.ts > read).length;
};
function markRead(kind) { lsSet(readKey(kind), String(store.now())); updateBadges(); }
function updateBadges() {
  const c = unread('chat'), n = unread('notes');
  $('#badge-chat').hidden = !c; $('#badge-chat').textContent = c > 9 ? '9+' : c;
  $('#badge-notes').hidden = !n; $('#badge-notes').textContent = n;
  $('.board-dot').hidden = !n; $('.board-dot').textContent = n;
}
const sortedNotes = () => Object.entries(S.notes).map(([k, n]) => ({ k, ...n })).sort((a, b) => b.ts - a.ts);
function renderBoard() {
  const list = sortedNotes().slice(0, 3);
  const box = $('.board-notes');
  box.className = 'board-notes n' + list.length;
  box.innerHTML = list.length
    ? list.map(n => `<div class="mini-note" style="--n:${esc(n.color)};--r:${(hash(n.k) % 5) - 2}deg"><span>${esc(n.text)}</span></div>`).join('')
    : '<div class="board-empty">Tap to pin a note 💌</div>';
}

// ── Chat ─────────────────────────────────────────────────────
function onChat(v) {
  const msgs = Object.entries(v || {}).map(([k, m]) => ({ k, ...m })).sort((a, b) => a.ts - b.ts || (a.k < b.k ? -1 : 1));
  if (chatInit) {
    for (const m of msgs) {
      if (m.ts <= lastChatTs || m.by === me) continue;
      sfx.ding(); navigator.vibrate?.(50);
      if (together()) showBubble(m.by, m.text);
    }
  }
  lastChatTs = Math.max(lastChatTs, ...msgs.map(m => m.ts), 0);
  chatInit = true;
  S.msgs = msgs;
  if (panel === 'chat') { renderChat(); markRead('chat'); }
  updateBadges();
}
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function renderChat(forceBottom) {
  const list = $('#chat-list'); if (!list) return;
  const atBottom = forceBottom || list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  let lastDay = '';
  list.innerHTML = S.msgs.length ? S.msgs.map(m => {
    const day = new Date(m.ts).toDateString();
    const sep = day !== lastDay ? `<div class="day">${day === new Date().toDateString() ? 'Today' : new Date(m.ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>` : '';
    lastDay = day;
    const jumbo = JUMBO.test(m.text) && [...m.text].length <= 8;
    return `${sep}<div class="msg ${m.by === me ? 'mine' : 'theirs'} ${jumbo ? 'jumbo' : ''}">${esc(m.text)}<time>${fmtTime(m.ts)}</time></div>`;
  }).join('') : `<div class="empty">No messages yet.<br>Say hi to ${esc(prof(other).name)}! 👋</div>`;
  if (atBottom) list.scrollTop = list.scrollHeight;
}
function sendChat(text) {
  text = String(text || '').trim().slice(0, 1000);
  if (!text) return;
  store.push('chat', { by: me, text, ts: store.now() });
  store.remove(`typing/${me}`);
  showBubble(me, text);
  sfx.pop();
  renderChat(true);
}
let lastTypingSent = 0;
function onTyping() {
  const now = store.now();
  if (now - lastTypingSent > 2500) { lastTypingSent = now; store.set(`typing/${me}`, now); }
}
function renderTyping() {
  const t = S.typing[other];
  const on = t && store.now() - t < 5000;
  const el = $('#typing');
  if (el) el.textContent = on ? `${prof(other).name} is typing…` : '';
  const b = $(`.avatar[data-id="${other}"] .bubble`);
  if (b && on && !b.classList.contains('show') && together()) {
    b.textContent = '• • •'; b.classList.add('show', 'typing');
    clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('show', 'typing'), 5000);
  }
  if (on) { clearTimeout(renderTyping._t); renderTyping._t = setTimeout(renderTyping, 5200 - (store.now() - t)); }
}

// ── Activity log ─────────────────────────────────────────────
function onLog(v) {
  for (const [k, e] of Object.entries(v || {})) {
    if (seenLog.has(k)) continue;
    seenLog.add(k);
    if (logInit && e.by !== me) toast(`${esc(prof(e.by).face)} <b>${esc(prof(e.by).name)}</b> ${esc(e.text)}`);
  }
  logInit = true;
}

// ── Dock panels ──────────────────────────────────────────────
const head = (title, sub = '') => `<div class="panel-head"><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div><button class="x" data-close aria-label="Close">✕</button></div>`;

function openPanel(name) {
  if (panel === name) return closePanel();
  closePanel();
  panel = name;
  const dock = $('#dock');
  dock.hidden = false;
  dock.className = ['chat', 'notes', 'games', 'profile', 'decorate'].includes(name) ? 'tall' : '';
  $$('#toolbar [data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  $('#stage').classList.toggle('decorating', name === 'decorate');
  $('#stage').classList.toggle('drawing', name === 'draw');
  ({ chat: renderChatPanel, notes: renderNotesPanel, decorate: renderDecoratePanel, draw: renderDrawPanel, games: renderGamesPanel, profile: renderProfilePanel })[name]();
}
function closePanel() {
  panel = null;
  $('#dock').hidden = true; $('#dock').innerHTML = '';
  $$('#toolbar [data-panel]').forEach(b => b.classList.remove('active'));
  $('#stage').classList.remove('decorating', 'drawing', 'erasing');
  selectItem(null);
}

function renderChatPanel() {
  $('#dock').innerHTML = head(`💬 ${esc(prof(other).name)}`, isOnline(other) ? 'Home right now' : 'They’ll see it when they drop by') +
    `<div class="chat-list" id="chat-list"></div><div class="typing" id="typing"></div>
    <div class="quick">${QUICK.map(e => `<button data-quick="${e}">${e}</button>`).join('')}</div>
    <form class="chat-form" id="chat-form"><input class="field" id="chat-input" placeholder="Say something sweet…" autocomplete="off" maxlength="1000" enterkeyhint="send"><button class="send" aria-label="Send">➤</button></form>`;
  renderChat(true); renderTyping(); markRead('chat');
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); const i = $('#chat-input'); sendChat(i.value); i.value = ''; i.focus(); });
  $('#chat-input').addEventListener('input', onTyping);
}

function renderNotesPanel() {
  $('#dock').innerHTML = head('📌 Notes board', 'Pinned in the living room until someone removes them') +
    `<div class="panel-body">
      <textarea class="field" id="note-text" maxlength="200" placeholder="Leave a little note… 💌"></textarea>
      <div class="row between" style="margin-top:10px">
        <div class="swatches">${NOTE_COLORS.map(c => `<button class="sw small ${c === noteColor ? 'on' : ''}" style="background:${c}" data-note-color="${c}"></button>`).join('')}</div>
        <button class="btn small" data-pin>Pin it 📌</button>
      </div>
      <div class="notes-grid" id="notes-grid"></div>
    </div>`;
  renderNotes(); markRead('notes');
}
function renderNotes() {
  const g = $('#notes-grid'); if (!g) return;
  const list = sortedNotes();
  g.innerHTML = list.length ? list.map(n => `<div class="note" style="--n:${esc(n.color)};--r:${(hash(n.k) % 5) - 2}deg">
      <button class="del" data-del-note="${esc(n.k)}" aria-label="Remove note">✕</button>
      <p>${esc(n.text)}</p><small>${esc(prof(n.by).face)} ${esc(prof(n.by).name)} · ${ago(n.ts)}</small></div>`).join('')
    : '<div class="empty" style="grid-column:1/-1">The board is empty. Pin the first note!</div>';
}
function pinNote() {
  const t = $('#note-text'); const text = t.value.trim(); if (!text) return t.focus();
  store.push('notes', { by: me, text: text.slice(0, 200), color: noteColor, ts: store.now() });
  t.value = ''; sfx.pop();
  logAct('note', 'pinned a note on the board 📌');
}

function renderDecoratePanel() {
  const tabs = [['furniture', '🛋️ Furniture'], ['photos', '🖼️ Photos'], ['stickers', '🧸 Stuff'], ['themes', '✨ Themes'], ['wall', '🧱 Wall'], ['floor', '🪵 Floor'], ['text', '🔤 Words']];
  $('#dock').innerHTML = head(`🎨 Decorate the ${ROOMS[view].name.toLowerCase()}`, 'Drag things around · tap one for options') +
    `<div class="tabs">${tabs.map(([k, l]) => `<button class="chip ${k === decoTab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="panel-body" id="deco-body"></div>`;
  renderDecoBody();
}
const swatches = (list, cur, key) => `<div class="swatches">${list.map(c => `<button class="sw ${c === cur ? 'on' : ''} ${c === 'none' ? 'none' : ''}" style="background:${c}" data-set="${key}" data-val="${c}" aria-label="${c}"></button>`).join('')}</div>`;
const chips = (list, cur, key) => `<div class="chips">${list.map(([k, l]) => `<button class="chip ${k === cur ? 'on' : ''}" data-set="${key}" data-val="${k}">${l}</button>`).join('')}</div>`;
function renderDecoBody() {
  const b = $('#deco-body'); if (!b) return;
  const r = look();
  const nPhotos = Object.values(S.items).filter(i => i.t === 'photo').length;
  const html = {
    furniture: `<div class="furn-grid">${Object.entries(FURN).map(([k, f]) => `<button data-furn="${k}"><span>${f.icon}</span>${f.label}</button>`).join('')}</div>
      <p class="hint">Tip: tap a piece in the room, then 🎨 to change its color.</p>`,
    photos: `<div class="photo-pick"><div class="big">🖼️</div>
        <input class="field" id="photo-cap" maxlength="40" placeholder="Caption (optional)" style="margin:8px 0">
        <h4 style="margin-top:6px">Frame</h4>
        <div class="chips" style="justify-content:center">${FRAMES.map(f => `<button class="chip ${f === photoFrame ? 'on' : ''}" data-frame="${f}">${FRAME_NAMES[f]}</button>`).join('')}</div>
        <button class="btn" style="margin-top:14px" data-add-photo>📷 Choose from gallery</button>
        <p class="hint">${nPhotos}/${MAX_PHOTOS} photos in this room. Either of you can move or take them down.</p></div>`,
    stickers: `<div class="chips">${Object.keys(STICKER_SETS).map(k => `<button class="chip ${k === stickerSet ? 'on' : ''}" data-set-stickers="${esc(k)}">${k}</button>`).join('')}</div>
      <div class="stickers">${STICKER_SETS[stickerSet].map(s => `<button data-sticker="${s}">${s}</button>`).join('')}</div>`,
    themes: `<div class="themes">${THEMES.map(([i, n, bg], idx) => `<button style="background:${bg};color:${bg === '#2b2d42' ? '#fff' : 'inherit'}" data-theme="${idx}"><span>${i}</span>${n}</button>`).join('')}</div>
      <p class="hint">A theme repaints the walls, floor, rug and curtains of this room.</p>`,
    wall: `<h4>Paint</h4>${swatches(WALL_COLORS, r.wall, 'wall')}<h4>Wallpaper</h4>${chips(WALLPAPERS, r.wp, 'wp')}<h4>Curtains</h4>${swatches(CURTAINS, r.cur, 'cur')}`,
    floor: `<h4>Floor</h4>${chips(FLOORS, r.fl, 'fl')}<h4>Floor color</h4>${swatches(FLOOR_COLORS, r.floor, 'floor')}<h4>Rug</h4>${swatches(RUGS, r.rug, 'rug')}`,
    text: `<h4>Write on the wall</h4>
      <div class="row"><input class="field" id="text-input" maxlength="60" placeholder="e.g. I miss you!" enterkeyhint="done"><button class="btn small" data-add-text>Add</button></div>
      <h4>Color</h4><div class="swatches">${INK.map(c => `<button class="sw ${c === textInk ? 'on' : ''}" style="background:${c}" data-text-ink="${c}"></button>`).join('')}</div>
      <p class="hint">🔒 Words are protected from the other person for 1 hour.</p>`,
  };
  b.innerHTML = html[decoTab];
}
const LOOK_LOG = { wall: 'painted the wall 🎨', wp: 'changed the wallpaper 🖼️', floor: 'changed the floor 🪵', fl: 'changed the floor 🪵', rug: 'got a new rug 🧶', cur: 'hung new curtains 🪟' };

function renderDrawPanel() {
  $('#stage').classList.toggle('erasing', tool === 'erase');
  $('#dock').innerHTML = head('✏️ Draw on the wall', tool === 'erase' ? 'Rub over drawings or words to erase' : 'Use your finger on the wall') +
    `<div class="panel-body">
      <div class="chips"><button class="chip ${tool === 'pen' ? 'on' : ''}" data-tool="pen">✏️ Pen</button><button class="chip ${tool === 'erase' ? 'on' : ''}" data-tool="erase">🧽 Eraser</button></div>
      ${tool === 'pen' ? `<div class="swatches" style="margin-top:12px">${INK.map(c => `<button class="sw ${c === ink ? 'on' : ''}" style="background:${c}" data-ink="${c}"></button>`).join('')}</div>` : ''}
      <div class="row between" style="margin-top:12px">
        <div class="row brushes">${BRUSHES.map(w => `<button class="${w === brush ? 'on' : ''}" data-brush="${w}" aria-label="Size ${w}"><i style="width:${w / 1.3 + 3}px;height:${w / 1.3 + 3}px"></i></button>`).join('')}</div>
        <div class="row"><button class="btn ghost small" data-undo>↶ Undo</button><button class="btn ghost small" data-wipe>🗑️ Clear</button></div>
      </div>
      <p class="hint">🔒 Your partner’s drawings and words can only be erased 1 hour after they make them (and yours the same for them).</p>
    </div>`;
}

function renderGamesPanel() {
  const both = isOnline(other);
  $('#dock').innerHTML = head('🕹️ Game corner', 'Play together when you’re both home') +
    `<div class="panel-body">
      <div class="status ${both ? 'ok' : 'wait'}">${both ? `🎉 You’re both here! Games are on the way…` : `⏳ Waiting for ${esc(prof(other).name)} to come home`}</div>
      ${GAMES.map(([i, n, d]) => `<div class="game"><div class="gi">${i}</div><div><b>${n}<span class="soon">SOON</span></b><p>${d}</p></div></div>`).join('')}
    </div>`;
}

function renderProfilePanel() {
  $('#dock').innerHTML = head('🙂 You') +
    `<div class="panel-body" id="profile-body">${profileForm(me)}
      <button class="btn wide" style="margin-top:16px" data-save-profile>Save</button>
      <h4 style="margin-top:22px">Invite link</h4>
      <p class="muted">Your partner opens this on their phone to join. Keep it private!</p>
      <div class="linkbox"><input class="field" readonly value="${esc(inviteLink())}"><button class="btn small" data-share>Share</button></div>
      <h4 style="margin-top:22px">More</h4>
      <div class="stack">
        <button class="btn ghost wide small" data-tips>❓ How it works</button>
        <button class="btn ghost wide small" data-switch>🔁 I picked the wrong player</button>
      </div>
      <p class="muted" style="margin-top:14px;font-size:12px">${store.mode === 'local' ? '⚠️ Demo mode — only works on this device. Add Firebase settings to go online.' : '🌐 Online'}</p>
    </div>`;
}

// ── Calls UI ─────────────────────────────────────────────────
let callTimer = null, muted = false;
const callUI = {
  set(s) {
    stopRing(); clearInterval(callTimer);
    const bar = $('#callbar'), n = esc(prof(other).name);
    if (overlayMode === 'incoming' && s !== 'incoming') hideOverlay();
    if (s === 'idle') { bar.hidden = true; muted = false; return; }
    if (s === 'incoming') {
      bar.hidden = true; startRing('ring');
      const p = prof(other);
      return showCard(`<div class="big bounce">${esc(p.face)}</div><h2>${n} is calling!</h2><p class="muted">📞 Voice call</p>
        <div class="row" style="justify-content:center;margin-top:18px"><button class="btn red" data-decline>Decline</button><button class="btn green" data-accept>Answer</button></div>`, 'incoming');
    }
    bar.hidden = false; bar.className = s;
    if (s === 'calling') { startRing('ringback'); bar.innerHTML = `<span class="pulse">📞</span><span class="grow">Calling ${n}…</span><button class="hang" data-hangup aria-label="Hang up">✕</button>`; }
    if (s === 'connecting') bar.innerHTML = `<span class="pulse">🔗</span><span class="grow">Connecting…</span><button class="hang" data-hangup aria-label="Hang up">✕</button>`;
    if (s === 'active') {
      const start = Date.now();
      bar.innerHTML = `<span>🔊</span><span class="grow">On call with ${n} · <b id="call-time">0:00</b></span><button data-mute aria-label="Mute">${muted ? '🔇' : '🎙️'}</button><button class="hang" data-hangup aria-label="Hang up">✕</button>`;
      callTimer = setInterval(() => {
        const s = Math.floor((Date.now() - start) / 1000);
        const el = $('#call-time'); if (el) el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }, 1000);
    }
  },
  error(msg) { toast(esc(msg), 5500); },
};
function onCallButton() {
  if (call.state !== 'idle') return;
  if (!isOnline(other)) return toast(`${esc(prof(other).name)} isn’t home right now 💤<br>Leave a message 💬 or a note 📌!`);
  call.start();
}

// ── Global click routing ─────────────────────────────────────
document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  const d = t.dataset;
  unlockAudio();
  if ('close' in d) return closePanel();
  if (d.panel) return openPanel(d.panel);
  if (d.action === 'call') return onCallButton();
  if (d.open) { hideOverlay(); return openPanel(d.open); }
  if ('dismiss' in d) return hideOverlay();
  if ('reload' in d) return location.reload();
  if ('newRoom' in d) { roomId = newRoomId(); lsSet('ourroom:room', roomId); location.href = `${location.pathname}?room=${roomId}`; return; }
  if ('joinRoom' in d) {
    const v = $('#join-input').value.trim();
    const m = v.match(/[?&#]room=([a-z0-9]{16,})/i) || v.match(/^([a-z0-9]{16,})$/i);
    if (!m) return toast('Hmm, that doesn’t look like an invite link 🤔');
    location.href = `${location.pathname}?room=${m[1]}`; return;
  }
  if (d.slot) return showSetup(d.slot);
  if ('back' in d) return showWelcome();
  if (d.pick || d.pickColor || d.pickHat !== undefined) {
    const sel = d.pick ? '[data-pick]' : d.pickColor ? '[data-pick-color]' : '[data-pick-hat]';
    $$(sel, t.parentElement).forEach(x => x.classList.remove('on')); t.classList.add('on'); return;
  }
  if (d.setupDone) {
    me = d.setupDone;
    store.set(`profiles/${me}`, readProfileForm($('#overlay'), me));
    lsSet(`ourroom:me:${roomId}`, me);
    return enterRoom();
  }
  if ('enter' in d) return enterRoom();
  if ('saveProfile' in d) { store.set(`profiles/${me}`, readProfileForm($('#profile-body'), me)); toast('Saved ✨'); return closePanel(); }
  if ('share' in d) {
    const url = inviteLink();
    if (navigator.share) navigator.share({ title: 'Our Room', text: 'Come hang out in our room 🏠💕', url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Link copied 📋'), () => toast('Copy the link from the box above'));
    return;
  }
  if ('tips' in d) { closePanel(); return showTips(); }
  if ('switch' in d) {
    if (!confirm('Switch to the other player on this phone?')) return;
    try { localStorage.removeItem(`ourroom:me:${roomId}`); } catch {}
    location.href = `${location.pathname}?room=${roomId}`; return;
  }
  if (d.emote) return sendEmote(d.emote);
  if (d.bonk) return tryBonk(d.bonk);
  if (d.item) return itemAction(d.item);
  if (d.tab) { decoTab = d.tab; $$('.tabs .chip').forEach(c => c.classList.toggle('on', c.dataset.tab === decoTab)); return renderDecoBody(); }
  if (d.set) { store.update(`${sp()}/look`, { [d.set]: d.val }); logAct(d.set, `${LOOK_LOG[d.set]} in the ${ROOMS[view].name.toLowerCase()}`); return; }
  if (d.theme) {
    const [icon, name, , vals] = THEMES[+d.theme];
    store.update(`${sp()}/look`, vals); sfx.pop();
    logAct('theme', `made the ${ROOMS[view].name.toLowerCase()} ${name} themed ${icon}`); return;
  }
  if (d.setStickers) { stickerSet = d.setStickers; return renderDecoBody(); }
  if (d.sticker) return addSticker(d.sticker);
  if (d.furn) return addFurniture(d.furn);
  if (d.frame) { photoFrame = d.frame; $$('[data-frame]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if ('addPhoto' in d) return $('#photo-input').click();
  if ('addText' in d) return addText();
  if (d.textInk) { textInk = d.textInk; $$('[data-text-ink]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if (d.tool) { tool = d.tool; return renderDrawPanel(); }
  if (d.ink) { ink = d.ink; $$('[data-ink]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if (d.brush) { brush = +d.brush; $$('[data-brush]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if ('undo' in d) return undoStroke();
  if ('wipe' in d) return clearWall();
  if (d.quick) return sendChat(d.quick);
  if (d.noteColor) { noteColor = d.noteColor; $$('[data-note-color]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if ('pin' in d) return pinNote();
  if (d.delNote) { if (confirm('Remove this note?')) store.remove(`notes/${d.delNote}`); return; }
  if ('accept' in d) return call.accept();
  if ('decline' in d) return call.decline();
  if ('hangup' in d) return call.hangup();
  if ('mute' in d) { muted = call.mute(); t.textContent = muted ? '🔇' : '🎙️'; return; }
});

$('#photo-input').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; addPhoto(f); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'text-input') { e.preventDefault(); addText(); }
  if (e.key === 'Enter' && e.target.id === 'join-input') $('[data-join-room]')?.click();
});
addEventListener('resize', () => { positionItembar(); if (emoteTarget) positionEmotebar(); });
