import { createStore } from './store.js?v=12';
import { createCall } from './call.js?v=12';
import { sfx, unlockAudio, startRing, stopRing } from './sfx.js?v=12';
import { initKitchen, APPLIANCE_CAT } from './kitchen.js?v=12';
import { initTV } from './tv.js?v=12';
import { initGames } from './games.js?v=12';
import { initPet } from './pet.js?v=12';
import { cropPhoto } from './dp.js?v=12';
import { initVmail } from './vmail.js?v=12';

// ── Helpers ──────────────────────────────────────────────────
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);
const JUMBO = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|\s){1,12}$/u;
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const HOUR = 3600000;
// Room coordinates: x is in "room units" (100 = one screen-width of room), y is % of room height.
const ux = x => `calc(${x} * var(--u))`;
const UPCT = 0.5625; // 1 room unit expressed as % of room height

// ── Rooms ────────────────────────────────────────────────────
const ROOMS = {
  living: { name: 'Living room', icon: '🛋️', rest: 'sofa', w: 2 },
  bedroom: { name: 'Bedroom', icon: '🛏️', rest: 'bed', w: 1 },
  kitchen: { name: 'Kitchen', icon: '🍳', rest: 'chair', w: 1.6 },
  garden: { name: 'Garden', icon: '🌷', rest: 'gbench', w: 1.6 },
};
const ROOM_BLURB = { living: 'TV, sofa, arcade & notes board', bedroom: 'Cozy bed & fairy lights', kitchen: 'Cook, bake & make tea together', garden: 'Flowers, swing, pond & butterflies' };
const DOOR_SPOT = { living: { x: 184, y: 62 }, bedroom: { x: 16, y: 62 }, kitchen: { x: 14, y: 64 }, garden: { x: 14, y: 64 } };
const DEFAULT_LOOK = {
  living: { wall: '#ffd6e0', wp: 'dots', floor: '#e9b872', fl: 'wood', rug: '#ff8fab', cur: '#ff5fa2' },
  bedroom: { wall: '#e4c1f9', wp: 'stars', floor: '#bdb2ff', fl: 'carpet', rug: '#ffffff', cur: '#7b5cff' },
  kitchen: { wall: '#b8f2e6', wp: 'checks', floor: '#f4f1fb', fl: 'tiles', rug: 'none', cur: '#ffb703' },
  garden: { wall: '#8fd3ff', wp: 'none', floor: '#8ac926', fl: 'grass', rug: 'none', cur: 'none' },
};
const SEED = {
  living: {
    'seed-shelf': { t: 'furn', k: 'shelf', x: 14, y: 58, c: '#c8875a' },
    'seed-plant': { t: 'emoji', v: '🪴', x: 30, y: 59 },
    'seed-tv': { t: 'furn', k: 'tv', x: 55, y: 62, c: '#8d5a3b', ch: 0 },
    'seed-clock': { t: 'furn', k: 'clock', x: 22, y: 43, c: '#ff5fa2' },
    'seed-lamp': { t: 'furn', k: 'floorlamp', x: 9, y: 86, c: '#ffb703' },
    'seed-arcade': { t: 'furn', k: 'arcade', x: 89, y: 82, c: '#5a3fd6' },
    'seed-sofa': { t: 'furn', k: 'sofa', x: 55, y: 92, c: '#ff5fa2', face: 'back' },
  },
  bedroom: {
    'seed-fairy': { t: 'furn', k: 'fairy', x: 56, y: 38, s: .85 },
    'seed-wardrobe': { t: 'furn', k: 'wardrobe', x: 86, y: 66, c: '#c8875a' },
    'seed-night': { t: 'furn', k: 'nightstand', x: 14, y: 80, c: '#c8875a' },
    'seed-bed': { t: 'furn', k: 'bed', x: 50, y: 92, c: '#7b5cff' },
    'seed-teddy': { t: 'emoji', v: '🧸', x: 50, y: 90, z: 960 },
    'seed-bean': { t: 'furn', k: 'beanbag', x: 84, y: 76, c: '#ff5fa2' },
  },
  kitchen: {
    'seed-wcab1': { t: 'furn', k: 'wcabinet', x: 30, y: 30, c: '#90dbf4' },
    'seed-wcab2': { t: 'furn', k: 'wcabinet', x: 134, y: 30, c: '#90dbf4' },
    'seed-fridge': { t: 'furn', k: 'fridge', x: 36, y: 63, c: '#eef4ff' },
    'seed-counter1': { t: 'furn', k: 'counter', x: 58, y: 63, c: '#90dbf4' },
    'seed-sink': { t: 'furn', k: 'sink', x: 80, y: 63, c: '#90dbf4' },
    'seed-stove': { t: 'furn', k: 'stove', x: 103, y: 63, c: '#f4f1fb' },
    'seed-counter2': { t: 'furn', k: 'counter', x: 126, y: 63, c: '#90dbf4' },
    'seed-counter3': { t: 'furn', k: 'counter', x: 148, y: 63, c: '#90dbf4' },
    'seed-toaster': { t: 'furn', k: 'toaster', x: 53, y: 51.9, c: '#ff5fa2', z: 632 },
    'seed-blender': { t: 'furn', k: 'blender', x: 63, y: 51.9, c: '#8ac926', z: 632 },
    'seed-kettle': { t: 'furn', k: 'kettle', x: 121, y: 51.9, c: '#ff7a59', z: 632 },
    'seed-coffee': { t: 'furn', k: 'coffee', x: 131, y: 51.9, c: '#2b2d42', z: 632 },
    'seed-micro': { t: 'furn', k: 'microwave', x: 148, y: 51.9, c: '#f4f1fb', z: 632 },
    'seed-kdtable': { t: 'furn', k: 'dtable', x: 90, y: 90, c: '#c8875a' },
    'seed-kchair1': { t: 'furn', k: 'chair', x: 72, y: 91, c: '#ff5fa2', face: 'right' },
    'seed-kchair2': { t: 'furn', k: 'chair', x: 108, y: 91, c: '#4f8cff', face: 'left' },
    'seed-kplant': { t: 'emoji', v: '🪴', x: 152, y: 90 },
  },
  garden: {
    'seed-gtree': { t: 'furn', k: 'tree', x: 134, y: 70, c: '#6cc24a' },
    'seed-swing': { t: 'furn', k: 'swing', x: 48, y: 78, c: '#ff5fa2' },
    'seed-gbench': { t: 'furn', k: 'gbench', x: 94, y: 68, c: '#c8875a' },
    'seed-pond': { t: 'furn', k: 'pond', x: 100, y: 93, c: '#4fc3f7' },
    'seed-bed1': { t: 'furn', k: 'flowerbed', x: 26, y: 95, c: '#8d5a3b' },
    'seed-bed2': { t: 'furn', k: 'flowerbed', x: 140, y: 96, c: '#8d5a3b' },
    'seed-bfly1': { t: 'emoji', v: '🦋', x: 70, y: 40 },
    'seed-bfly2': { t: 'emoji', v: '🦋', x: 116, y: 55 },
    'seed-bee': { t: 'emoji', v: '🐝', x: 30, y: 80 },
    'seed-mush': { t: 'emoji', v: '🍄', x: 154, y: 82 },
  },
};
// Added when the living room grew to two screens wide.
const SEED2 = {
  living: {
    'seed2-fish': { t: 'furn', k: 'fishtank', x: 128, y: 66, c: '#6d6875' },
    'seed2-plant': { t: 'emoji', v: '🪴', x: 168, y: 64 },
    'seed2-bean': { t: 'furn', k: 'beanbag', x: 104, y: 93, c: '#c77dff' },
    'seed2-dtable': { t: 'furn', k: 'dtable', x: 142, y: 86, c: '#c8875a' },
    'seed2-chair1': { t: 'furn', k: 'chair', x: 124, y: 87, c: '#ff5fa2', face: 'right' },
    'seed2-chair2': { t: 'furn', k: 'chair', x: 160, y: 87, c: '#4f8cff', face: 'left' },
  },
};

// ── Palettes & content ───────────────────────────────────────
const PALETTE = ['#ffffff', '#f4f1fb', '#ffd6e0', '#ffadad', '#ff99c8', '#ff5fa2', '#ff4d6d', '#e63946', '#ffc8a2', '#ff7a59', '#ff9f1c', '#ffb703',
  '#fff1a8', '#ffd60a', '#d0f4de', '#b5e48c', '#8ac926', '#06d6a0', '#2ec4b6', '#b8f2e6', '#a9def9', '#90dbf4', '#4f8cff', '#1d4ed8',
  '#e4c1f9', '#cdb4db', '#c77dff', '#7b5cff', '#5a3fd6', '#f4e1c1', '#e9b872', '#c8875a', '#8d5a3b', '#5a3b25', '#9b9b9b', '#6d6875', '#2b2d42', '#111111'];
const VIVID = ['#ff5fa2', '#ff4d6d', '#e63946', '#ff7a59', '#ff9f1c', '#ffb703', '#ffd60a', '#8ac926', '#06d6a0', '#2ec4b6', '#4f8cff', '#1d4ed8', '#7b5cff', '#5a3fd6', '#c77dff', '#8d5a3b', '#6d6875', '#2b2d42'];
const NOTE_COLORS = ['#fff59d', '#ffe082', '#ffccbc', '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#bbdefb', '#b3e5fc', '#b2ebf2', '#c8e6c9', '#dcedc8', '#ffffff'];
const FACES = ['🐻', '🐰', '🐱', '🐶', '🦊', '🐼', '🐸', '🐯', '🐨', '🐷', '🐧', '🦄', '🐵', '🐙', '🐥', '🐹', '👩', '👨', '👧', '👦'];
const HATS = ['', '👑', '🎀', '🧢', '🎩', '🌸', '🕶️', '🎧', '😇'];
const HAT_CLASS = { '🕶️': 'h-eyes', '🌸': 'h-side', '🎧': 'h-ears' };
const WALLPAPERS = [['none', 'Plain'], ['dots', 'Dots'], ['stripes', 'Stripes'], ['hearts', 'Hearts'], ['stars', 'Stars'], ['checks', 'Checks'], ['waves', 'Waves'], ['bricks', 'Bricks']];
const FLOORS = [['wood', 'Wood'], ['tiles', 'Tiles'], ['carpet', 'Carpet'], ['grass', 'Grass']];
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
  chair: { label: 'Chair', icon: '🪑', c: '#ff5fa2', html: '<div class="cback"></div><div class="cseat"></div>' },
  bed: { label: 'Bed', icon: '🛏️', c: '#7b5cff', html: '<div class="head"></div><div class="mat"></div><div class="pillow p1"></div><div class="pillow p2"></div><div class="blanket"></div>' },
  tv: { label: 'TV', icon: '📺', c: '#8d5a3b', tap: true, html: '<div class="tv"><div class="scr"><span></span></div></div><div class="neck"></div><div class="stand"></div>' },
  shelf: { label: 'Bookshelf', icon: '📚', c: '#c8875a', html: '<i></i><i></i><i></i>' },
  table: { label: 'Coffee table', icon: '☕', c: '#c8875a', html: '<div class="top"></div>' },
  dtable: { label: 'Dining table', icon: '🍽️', c: '#c8875a', html: '<div class="top"></div><div class="cloth"></div>' },
  nightstand: { label: 'Nightstand', icon: '🗄️', c: '#c8875a', html: '<div class="lshade"></div><div class="lbase"></div><div class="body"></div><div class="drawer"></div>' },
  wardrobe: { label: 'Wardrobe', icon: '🚪', c: '#c8875a', html: '<div class="crown"></div><div class="body"></div><div class="kn l"></div><div class="kn r"></div><div class="feet"></div>' },
  fishtank: { label: 'Fish tank', icon: '🐠', c: '#6d6875', html: '<div class="glass"><span>🐠</span><span>🐟</span></div><div class="cab"></div>' },
  beanbag: { label: 'Bean bag', icon: '🟣', c: '#ff5fa2', html: '<div class="bag"></div>' },
  floorlamp: { label: 'Floor lamp', icon: '💡', c: '#ffb703', tap: true, html: '<div class="lglow"></div><div class="lshade"></div><div class="pole"></div><div class="base"></div>' },
  clock: { label: 'Clock', icon: '🕰️', c: '#ff5fa2', html: '<div class="face"></div><div class="hand hh"></div><div class="hand mh"></div><div class="pin"></div>' },
  fairy: { label: 'Fairy lights', icon: '✨', c: '#ffb703', html: '<div class="wire"></div>' + Array.from({ length: 11 }, (_, i) => {
    const x = 3 + i * 9, y = 2.2 + Math.sin(i / 10 * Math.PI) * 4, col = ['#ff4d6d', '#ffd60a', '#4f8cff', '#8ac926', '#c77dff'][i % 5];
    return `<i style="left:calc(${x}% - 1.2 * var(--u));top:${ux(y)};background:${col};color:${col};animation-delay:${(i % 3) * .5}s"></i>`;
  }).join('') },
  fridge: { label: 'Fridge', icon: '🧊', c: '#eef4ff', tap: true, cook: true, html: '<div class="body"></div><div class="line"></div><div class="h1"></div><div class="h2"></div><div class="fnote"></div>'
    + [['#ff4d6d', 4, 12], ['#ffd60a', 9, 20], ['#4f8cff', 5, 26], ['#8ac926', 11, 8]].map(([c, x, y]) => `<div class="mag" style="background:${c};left:${ux(x)};top:${ux(y)}"></div>`).join('') },
  counter: { label: 'Counter', icon: '🗄️', c: '#90dbf4', tap: true, cook: true, html: '<div class="cab"></div><div class="top"></div><div class="kn l"></div><div class="kn r"></div>' },
  sink: { label: 'Sink', icon: '🚰', c: '#90dbf4', tap: true, cook: true, html: '<div class="tap"></div><div class="cab"></div><div class="top"></div><div class="basin"></div><div class="kn l"></div><div class="kn r"></div>' },
  stove: { label: 'Stove & oven', icon: '🔥', c: '#f4f1fb', tap: true, cook: true, html: '<div class="body"></div><div class="top"></div><div class="bn b1"></div><div class="bn b2"></div><div class="knobs"></div><div class="ovw"></div><div class="kpan">🍳</div>' },
  microwave: { label: 'Microwave', icon: '📻', c: '#f4f1fb', tap: true, cook: true, html: '<div class="body"></div><div class="win"></div><div class="pad"></div>' },
  kettle: { label: 'Kettle', icon: '🫖', c: '#ff7a59', tap: true, cook: true, html: '<div class="handle"></div><div class="spout"></div><div class="kb"></div>' },
  toaster: { label: 'Toaster', icon: '🍞', c: '#ff5fa2', tap: true, cook: true, html: '<div class="bread br1"></div><div class="bread br2"></div><div class="tb"></div><div class="lever"></div>' },
  coffee: { label: 'Coffee maker', icon: '☕', c: '#2b2d42', tap: true, cook: true, html: '<div class="cb"></div><div class="recess"></div><div class="kcup"></div><div class="light"></div>' },
  blender: { label: 'Blender', icon: '🥤', c: '#8ac926', tap: true, cook: true, html: '<div class="jar"></div><div class="lid"></div><div class="bb"></div>' },
  wcabinet: { label: 'Wall cabinet', icon: '🗃️', c: '#90dbf4', html: '<div class="wb"></div>' + ['calc(33.3% - 2.6 * var(--u))', 'calc(33.3% + 1.4 * var(--u))', 'calc(66.6% - 2.6 * var(--u))', 'calc(66.6% + 1.4 * var(--u))'].map(l => `<div class="kn" style="left:${l}"></div>`).join('') },
  tree: { label: 'Apple tree', icon: '🌳', c: '#6cc24a', html: '<div class="trunk"></div><div class="leaf l1"></div><div class="leaf l2"></div><div class="leaf l3"></div>'
    + [[10, 14], [22, 8], [30, 18], [16, 24]].map(([x, y]) => `<div class="apple" style="left:${ux(x)};top:${ux(y)}">🍎</div>`).join('') },
  swing: { label: 'Swing', icon: '🎠', c: '#ff5fa2', html: '<div class="post p1"></div><div class="post p2"></div><div class="post p3"></div><div class="post p4"></div><div class="bar"></div><div class="hang"><div class="rope r1"></div><div class="rope r2"></div><div class="plank"></div></div>' },
  gbench: { label: 'Garden bench', icon: '🪵', c: '#c8875a', html: '<div class="bk"></div><div class="st"></div><div class="lg l1"></div><div class="lg l2"></div>' },
  pond: { label: 'Pond', icon: '🦆', c: '#4fc3f7', html: '<div class="water"><span class="duck">🦆</span><span class="fish">🐟</span><i class="pad a"></i><i class="pad b"></i></div>' },
  flowerbed: { label: 'Flower bed', icon: '🌷', c: '#8d5a3b', tap: true, html: '<div class="soil"></div>' + [0, 1, 2, 3].map(i => `<span class="plot" data-plot="${i}"></span>`).join('') },
  vmail: { label: 'Answering machine', icon: '📼', c: '#6d6875', tap: true, html: '<div class="vm-base"></div><div class="vm-tape"><i></i><i></i></div><div class="vm-screen"><span class="vm-count">0</span></div><div class="vm-light"></div><div class="vm-keys"><i></i><i></i><i></i></div>' },
  arcade: { label: 'Arcade', icon: '🕹️', c: '#5a3fd6', tap: true, html: '<div class="cab"></div><div class="screen">👾</div><div class="label">GAMES</div><div class="btns"></div>' },
};
// Where characters sit or lie on furniture: [dx, height above the item's bottom, pose] in room units
const SEATS = {
  sofa: { front: [[-8, 6, 'sit'], [8, 6, 'sit']], back: [[-8, 11.5, 'back'], [8, 11.5, 'back']], left: [[-6, 6, 'sit'], [4, 6, 'sit']], right: [[6, 6, 'sit'], [-4, 6, 'sit']] },
  chair: { front: [[0, 7, 'sit']], back: [[0, 9, 'back']], left: [[-1, 7, 'sit']], right: [[1, 7, 'sit']] },
  bed: { front: [[-10, 13, 'lie'], [10, 13, 'lie']] },
  beanbag: { front: [[0, 5, 'sit']] },
  swing: { front: [[-6, 10, 'swing'], [6, 10, 'swing']] },
  gbench: { front: [[-7, 6.5, 'sit'], [7, 6.5, 'sit']] },
};
const TURNABLE = { sofa: ['front', 'back', 'left', 'right'], chair: ['front', 'back', 'left', 'right'] };
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
const BRUSHES = [5, 11, 22];
const ERASER_R = { 5: 18, 11: 30, 22: 50 };
const QUICK = ['❤️', '😂', '😘', '🥰', '😭', '👍', '🔥', '🤗', '🙈', '😴'];
const NICK_IDEAS = ['Honey Bun 🍯', 'Cutie Pie 🥧', 'Sweetie 🍬', 'Baby 🍼', 'Sunshine ☀️', 'Teddy 🧸', 'Pumpkin 🎃', 'Mr. Grumpy 😤', 'Sleepyhead 😴', 'My Love ❤️'];
const MAX_PHOTOS = 15;
const MOODS = [['😊', 'Happy'], ['😍', 'In love'], ['🥺', 'Missing you'], ['😴', 'Sleepy'], ['🤒', 'Not well'], ['😤', 'Grumpy'], ['🥳', 'Excited'], ['📚', 'Busy'],
  ['😢', 'Sad'], ['🤗', 'Need a hug'], ['🍕', 'Hungry'], ['😌', 'Relaxed'], ['💼', 'At work'], ['🏃', 'Out & about'], ['🤯', 'Stressed'], ['🥰', 'Cozy']];
const FLYERS = ['🦋', '🐝', '🕊️'];
const FLOWERS = [['🌷', 'Tulip'], ['🌹', 'Rose'], ['🌻', 'Sunflower'], ['🌼', 'Daisy'], ['🌸', 'Blossom'], ['🌺', 'Hibiscus']];
const GROW = { sprout: 6 * 3600000, bud: 24 * 3600000, bloom: 48 * 3600000, thirsty: 48 * 3600000 };
const POWER_MS = 20000, SPAWN_MS = 25000;
const GAMES = [
  ['🍕', 'Last Slice', 'Reflex duel — grab the pizza first. Fair even with lag!'],
  ['🎨', 'Doodle Duel', 'One draws, the other guesses. Best with a call on.'],
  ['💘', 'How Well Do You Know Me?', 'Answer questions about each other and compare.'],
  ['🍪', 'Cookie Drop', 'Connect four… but with cookies.'],
  ['🧦', 'Sock Hunt', 'Hide your socks, find theirs. Turn by turn.'],
];
const TIPS = [
  ['👆', 'Swipe to look around the room, pinch (or ＋/－) to zoom'],
  ['👣', 'Tap the floor to walk, tap the sofa or bed to sit or lie down'],
  ['🚪', 'Tap the door to go to another room'],
  ['🍳', 'In the kitchen, tap the fridge, stove or kettle to cook!'],
  ['😘', 'Tap your partner to react, poke, bonk 🏏 or give a nickname 🏷️'],
  ['⚡', 'Grab the ⚡ when it appears for a SUPER KICK!'],
  ['🎨', 'Decorate: furniture, photos, colors — drag anything anywhere'],
  ['✏️', 'Draw on the wall. Their drawings are protected for 1 hour 🔒'],
  ['📺', 'Tap the TV to watch YouTube together, the lamp for lights'],
  ['🧊', 'Open the fridge to save food for later — or grab a snack'],
  ['🌷', 'Plant flowers in the garden — water them and they bloom in 2 days'],
  ['😊', 'Tap yourself → 😊 to set your mood'],
  ['♟️', 'Play chess or Doodle Duel from the 🕹️ Games button'],
  ['📼', 'Decorate → Furniture → Answering machine: leave a 15-second voice message'],
  ['🐾', 'Adopt a pet from the 🐾 Pet button — tap it to cuddle, feed and play'],
];

const DEFAULT_PROFILES = {
  a: { name: 'Player 1', face: '🐻', color: '#4f8cff' },
  b: { name: 'Player 2', face: '🐰', color: '#ff5fa2' },
  v: { name: 'Visitor', face: '🦊', color: '#ff9f1c' },
};
const HOME = { a: { x: 38, y: 76 }, b: { x: 62, y: 78 }, v: { x: 50, y: 86 } };
const ONLINE_WINDOW = 45000;
const REACH = 26;

// ── State ────────────────────────────────────────────────────
const S = { pics: {}, garden: {}, look: {}, profiles: {}, nicks: {}, presence: {}, avatars: {}, items: {}, strokes: {}, notes: {}, msgs: [], typing: {}, power: null };
let store, roomId, me, other, call, view = 'living';
let panel = null, overlayMode = null, spaceUnsubs = [];
let drawHintShown = false;
let decoTab = 'furniture', stickerSet = Object.keys(STICKER_SETS)[0], textInk = '#ffffff';
let tool = 'pen', ink = '#ffffff', brush = BRUSHES[1], noteColor = NOTE_COLORS[0], photoFrame = 'wood';
let selectedItem = null, drag = null, emoteTarget = null, erasing = null;
let kitchen = null, tv = null, games = null, pet = null, vmail = null;
const prevMood = {};
let presenceInit = false, chatInit = false, lastChatTs = 0, lastKickAt = 0, powerKey = '';
const seenLog = new Set(); let logInit = false;
const lastEmote = {}, lastBonk = {}, lastKick = {}, lastLogged = {}, prevRoom = {};
const photoCache = new Map();
const cam = { z: 1, tx: 0, ty: 0, W: 1, H: 1 };
// visitors (declared early: the boot code uses them straight away)
let isVisitor = false, visitCode = null, gstore = null, gUnsub = null, visitHost = null, joinedAt = 0, myKnock = null, visitorInside = false;
const shownKnocks = new Set();

const sp = () => `spaces/${view}`;
const roomW = () => (ROOMS[view].w || 1) * 100;
const prof = id => ({ ...DEFAULT_PROFILES[id], ...(S.profiles?.[id] || {}) });
const nick = id => S.nicks?.[id] || '';
const called = id => nick(id) || prof(id).name;
const joined = id => !!S.profiles?.[id];
// Profile pictures: a photo if they set one, otherwise their emoji face
const pic = id => S.pics?.[id]?.d || null;
const faceHTML = id => pic(id) ? `<img class="dp-img" src="${esc(pic(id))}" alt="">` : esc(prof(id).face);
function setFace(el, id) {
  const src = pic(id);
  if (src) { if (el._pic !== src) { el.innerHTML = `<img class="dp-img" src="${esc(src)}" alt="">`; el._pic = src; } }
  else if (el._pic || el.textContent !== prof(id).face) { el.textContent = prof(id).face; el._pic = null; }
}
const isOnline = id => { const p = S.presence[id]; return !!p && p.online && store.now() - p.ts < ONLINE_WINDOW; };
const roomOf = id => (ROOMS[S.avatars[id]?.rm] ? S.avatars[id].rm : 'living');
const together = () => isOnline(other) && roomOf(other) === view;
const readKey = kind => `ourroom:read:${kind}:${roomId}:${me}`;
const inviteLink = () => `${location.origin}${location.pathname}?room=${roomId}`;
const look = () => ({ ...DEFAULT_LOOK[view], ...S.look });
const canErase = o => !o.by || o.by === me || store.now() - (o.ts || 0) >= HOUR;
const minsLeft = o => Math.max(1, Math.ceil((HOUR - (store.now() - (o.ts || 0))) / 60000));
const powered = id => { const p = S.power; return !!p && p.state === 'held' && p.by === id && store.now() < p.until; };
const itemZ = it => it.z ?? Math.round(it.y * 10);

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
  toast(`🔒 ${esc(called(o.by))}’s ${what} is protected for <b>${minsLeft(o)} more min</b>`);
}
function swatches(list, cur, attr, { none = false, any = true, small = false } = {}) {
  const all = none ? [...list, 'none'] : list;
  const btns = all.map(c => `<button class="sw ${small ? 'small' : ''} ${c === cur ? 'on' : ''} ${c === 'none' ? 'none' : ''}" style="background:${c}" ${attr}="${c}" aria-label="${c}"></button>`).join('');
  const custom = any ? `<label class="sw any ${small ? 'small' : ''}" title="Any color"><input type="color" value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#ff5fa2'}" data-custom="${attr}"></label>` : '';
  return `<div class="swatches">${btns}${custom}</div>`;
}

// ── Boot ─────────────────────────────────────────────────────
// Phones cache the page; ask the server for the newest one and reload once if we're behind.
const VERSION = 12;
fetch(location.pathname, { cache: 'reload' }).then(r => r.text()).then(t => {
  const live = +(t.match(/app\.js\?v=(\d+)/)?.[1] || 0);
  if (live > VERSION && !sessionStorage.getItem('ourroom:updated:' + live)) {
    sessionStorage.setItem('ourroom:updated:' + live, '1');
    location.reload();
  }
}).catch(() => {});
boot();

async function boot() {
  const q = new URLSearchParams(location.search);
  if (q.get('visit')) return visitorBoot(q.get('visit'));
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
  watchProfiles();
  if (me !== 'a' && me !== 'b') { me = null; showWelcome(); }
  else if (!(await store.once(`profiles/${me}`))) showSetup(me);
  else showDoor();
}
function watchProfiles() {
  store.on('profiles', v => {
    S.profiles = v || {};
    if (other) {
      const m = S.profiles[other]?.mood, key = m ? m.ts : 0;
      if (prevMood[other] !== undefined && key !== prevMood[other] && m) toast(`${esc(prof(other).face)} <b>${esc(called(other))}</b> is feeling ${esc(m.e)} ${esc(m.t || '')}`);
      prevMood[other] = key;
    }
    if (other) { renderPresence(); renderAvatars(); renderBoard(); }
    if (overlayMode === 'welcome') showWelcome();
  });
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
function hideOverlay() { if (overlayMode === 'vmail') vmail?.closed(); overlayMode = null; $('#overlay').hidden = true; $('#overlay').innerHTML = ''; }

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
    <input class="field" id="pf-name" maxlength="20" value="${esc(S.profiles?.[id]?.name || '')}" placeholder="Your name">
    <label class="lbl">Pick your look</label>
    <div class="faces">${FACES.map(f => `<button class="face-opt ${f === p.face ? 'on' : ''}" data-pick="${f}">${f}</button>`).join('')}</div>
    <label class="lbl">Hat or accessory</label>
    <div class="faces">${HATS.map(h => `<button class="face-opt hat-opt ${h === (p.hat || '') ? 'on' : ''}" data-pick-hat="${h}">${h || '🚫'}</button>`).join('')}</div>
    <label class="lbl">Your color</label>
    ${swatches(VIVID.includes(p.color) ? VIVID : [p.color, ...VIVID], p.color, 'data-pick-color')}`;
}
function readProfileForm(root, id) {
  return {
    name: ($('#pf-name', root).value.trim() || prof(id).name).slice(0, 20),
    face: $('.face-opt.on[data-pick]', root)?.dataset.pick || prof(id).face,
    hat: $('.hat-opt.on', root)?.dataset.pickHat ?? '',
    color: $('.sw.on[data-pick-color]', root)?.dataset.pickColor || prof(id).color,
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

function showNickCard() {
  const p = prof(other);
  showCard(`<div class="big">🏷️</div><h2>Nickname for ${esc(p.name)}</h2>
    <p class="muted">It shows above their head — on both phones.</p>
    <input class="field" id="nick-input" maxlength="24" value="${esc(nick(other))}" placeholder="e.g. Honey Bun 🍯" style="margin-top:10px">
    <div class="nick-sugg">${NICK_IDEAS.map(n => `<button class="chip" data-nick-idea="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <div class="row" style="justify-content:center;margin-top:10px">
      ${nick(other) ? '<button class="btn ghost" data-nick-clear>Remove</button>' : ''}
      <button class="btn" data-nick-save>Save 💕</button>
    </div>`, 'nick');
}

// ── Entering ─────────────────────────────────────────────────
async function enterRoom() {
  unlockAudio();
  other = me === 'v' ? visitHost : me === 'a' ? 'b' : 'a';
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
  store.on('pics', v => { S.pics = v || {}; renderPresence(); renderAvatars(); renderBubble(); if (panel === 'profile') renderProfilePanel(); });
  store.on('nicks', v => { S.nicks = v || {}; renderPresence(); renderAvatars(); });
  store.on('power', v => { S.power = v; renderPower(); });
  store.on('notes', v => { S.notes = v || {}; renderBoard(); if (panel === 'notes') { renderNotes(); markRead('notes'); } updateBadges(); });
  store.on('chat', onChat, { last: 150 });
  store.on('log', onLog, { last: 40 });
  store.on('typing', v => { S.typing = v || {}; renderTyping(); });

  kitchen = initKitchen({
    $, esc, sfx, store, UPCT,
    me: () => me, other: () => other, view: () => view, items: () => S.items,
    showCard, hideOverlay, overlayMode: () => overlayMode, toast, ago,
    together, isOnline, roomOf, called, joined, roomName: rm => ROOMS[rm]?.name || rm,
    avatar: id => S.avatars[id], avatarEl, spawnFx,
    petName: () => pet?.name(), feedPet: id => pet?.feedDish(id),
  });
  store.on('cook', v => kitchen.onSession(v));
  store.on('fridge', v => kitchen.setFridge(v));
  tv = initTV({
    $, esc, store, sfx, me: () => me, called, showCard, hideOverlay, toast, lsGet, lsSet,
    changeChannel: () => { const t = Object.entries(S.items).find(([, i]) => i.k === 'tv'); if (t) store.update(`${sp()}/items/${t[0]}`, { ch: ((t[1].ch ?? 0) + 1) % TV_CHANNELS.length }); },
    onChange: () => renderItems(),
    resizeTV: () => {
      const t = Object.entries(S.items).find(([, i]) => i.k === 'tv');
      if (!t) return toast('📏 Go to the room with the TV to change its size');
      const sizes = [1, 1.3, 1.6, 2, 2.5], cur = t[1].s || 1;
      const next = sizes.find(s => s > cur + 0.01) || sizes[0];
      store.update(`${sp()}/items/${t[0]}`, { s: next });
      toast(`📏 TV size: ${['S', 'M', 'L', 'XL', 'XXL'][sizes.indexOf(next)]}`, 1500);
    },
    tvScreen: () => $('#items .item[data-kind="furn:tv"] .scr'),
    otherOnline: () => isOnline(other),
  });
  const leaving = () => tv?.pauseIfAlone();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leaving(); });
  addEventListener('pagehide', leaving);
  setTimeout(() => tv.pauseIfAlone(), 6000);
  store.on('tv', v => tv.onTv(v));
  games = initGames({
    $, esc, store, sfx, me: () => me, other: () => other, called, together: () => isOnline(other), overlayMode: () => overlayMode,
    showCard, hideOverlay, toast, logAct, face: id => prof(id).face,
    refreshGames: () => { if (panel === 'games') renderGamesPanel(); },
    sitForGame, isVisitor: () => isVisitor,
  });
  store.on('chess', v => games.onChess(v));
  store.on('doodle', v => games.onDoodle(v));
  store.on('doodleInk', v => games.onInk(v));
  pet = initPet({
    $, esc, sfx, store, UPCT, SEATS, itemZ, ux, U, swatches, lsGet, lsSet, toast, logAct, showCard, hideOverlay, spawnFx, avatarEl,
    me: () => me, other: () => other, view: () => view, items: () => S.items, roomW, roomOf, isOnline, centerOn,
    overlayMode: () => overlayMode, isVisitor: () => isVisitor, roomName: rm => ROOMS[rm]?.name || rm,
    goRoom: rm => goThroughDoor(rm),
    rooms: () => Object.keys(ROOMS), doorSpot: rm => DOOR_SPOT[rm] || { x: 14, y: 64 },
  });
  store.on('garden', v => { S.garden = v || {}; $$('.item[data-kind="furn:flowerbed"]').forEach(renderBed); if (overlayMode === 'bed') showBed(openBedId); });
  setInterval(flyAround, 2600);
  setupCamera();
  setupStage();
  setupWallDrawing();
  await openSpace(view);
  store.on('pet', v => pet.onPet(v));
  vmail = initVmail({ $, esc, sfx, store, me: () => me, other: () => other, called, ago, toast, showCard, hideOverlay, overlayMode: () => overlayMode, isVisitor: () => isVisitor });
  store.on('vmail', v => vmail.onData(v));

  call = createCall(store, me, callUI);
  if (!isVisitor) store.on('visit', v => { S.visit = v; watchGuests(v?.code); if (panel === 'profile') renderProfilePanel(); });
  setInterval(() => { call.prune(isOnline); tidyVisitor(); }, 20000);
  renderWindow();
  setInterval(() => { renderPresence(); renderAvatars(); renderWindow(); tickClocks(); }, 15000);
  setInterval(tickPower, 500);
  setInterval(spawnTick, 5000);
  setupBubble();
  setTimeout(() => isVisitor ? showTips(true) : showAwaySummary(prevSeen), 900);
  if (!lsGet('ourroom:panhint')) {
    lsSet('ourroom:panhint', '1');
    const h = document.createElement('div'); h.className = 'pan-hint'; h.textContent = '👆 Swipe to look around · pinch to zoom';
    $('#stage').append(h); setTimeout(() => h.remove(), 4200);
  }
}

async function openSpace(rid) {
  spaceUnsubs.forEach(u => u());
  view = rid;
  S.look = {}; S.items = {}; S.strokes = {};
  selectItem(null);
  $('#items').innerHTML = '';
  $('#stage').classList.remove(...Object.keys(ROOMS).map(r => 'rm-' + r));   // clear every room's look
  $('#stage').classList.add('rm-' + rid);
  $('.door-sign').textContent = '🚪 Rooms';

  // First visit furnishes the room; later versions add new furniture once.
  const [seeded, seedv, sofa] = await Promise.all([store.once(`${sp()}/seeded`), store.once(`${sp()}/seedv`), store.once(`${sp()}/items/seed-sofa`)]);
  const upd = {};
  if (!seeded) { upd.seeded = true; for (const [k, v] of Object.entries(SEED[rid])) upd[`items/${k}`] = { s: 1, ...v, ts: 0 }; }
  if ((seedv || 0) < 2) {
    upd.seedv = 2;
    for (const [k, v] of Object.entries(SEED2[rid] || {})) upd[`items/${k}`] = { s: 1, ...v, ts: 0 };
    if (seeded && sofa && sofa.x === 50 && sofa.y === 95) Object.assign(upd, { 'items/seed-sofa/face': 'back', 'items/seed-sofa/x': 55, 'items/seed-sofa/y': 92 });
  }
  if (Object.keys(upd).length) store.update(sp(), upd);

  spaceUnsubs = [
    store.on(`${sp()}/look`, v => { S.look = v || {}; renderLook(); }),
    store.on(`${sp()}/items`, v => { S.items = v || {}; renderItems(); renderAvatars(); }),
    store.on(`${sp()}/strokes`, v => { S.strokes = v || {}; if (!erasing) drawWall(); }),
  ];
  cam.z = 1;
  layoutWorld();
  const mine = S.avatars[me];
  centerOn(mine?.rm === rid && mine.x != null ? mine.x : roomW() / 2 - 20);
  renderLook(); renderAvatars(); renderPresence(); renderBoard(); renderPower();
  pet?.render(true);
}

function showRoomPicker() {
  const here = rm => ['a', 'b'].filter(id => (id === me || isOnline(id)) && roomOf(id) === rm && rm !== view).map(id => prof(id).face).join('');
  showCard(`<div class="big">🚪</div><h2>Where to?</h2>
    <div class="room-pick">${Object.entries(ROOMS).filter(([k]) => k !== view).map(([k, r]) => `<button data-go-room="${k}"><span>${r.icon}</span><div>${r.name} ${here(k)}<small>${ROOM_BLURB[k]}</small></div></button>`).join('')}</div>
    <button class="btn ghost wide small" data-dismiss style="margin-top:12px">Stay here</button>`, 'rooms');
}
async function goThroughDoor(next) {
  if (!ROOMS[next] || next === view) return;
  const door = $('#door');
  door.classList.add('open'); sfx.knock();
  store.update(`avatars/${me}`, { x: DOOR_SPOT[view].x, y: DOOR_SPOT[view].y, seat: null });
  await new Promise(r => setTimeout(r, 700));
  $('#stage').classList.add('switching');
  await new Promise(r => setTimeout(r, 350));
  if (panel && !['chat', 'notes', 'games'].includes(panel)) closePanel();
  store.update(`avatars/${me}`, { rm: next, x: DOOR_SPOT[next].x, y: DOOR_SPOT[next].y + 6, seat: null });
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
  const lines = [
    ...acts.map(a => `<li>${esc(a)}</li>`),
    nMsg ? `<li>💬 sent you ${nMsg} message${nMsg > 1 ? 's' : ''}</li>` : '',
    nNotes ? `<li>📌 left ${nNotes} note${nNotes > 1 ? 's' : ''} on the board</li>` : '',
  ].join('');
  showCard(`<div class="big bounce">${esc(prof(other).face)}</div><h2>While you were away…</h2>
    <p class="muted"><b>${esc(called(other))}</b> dropped by:</p><ul class="list">${lines}</ul>
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

// ── Camera: pan + zoom ───────────────────────────────────────
const U = () => cam.H * cam.z * 0.005625;
const zMin = () => clamp(cam.W / (roomW() * 0.005625 * cam.H), 0.45, 1);
function layoutWorld() {
  const st = $('#stage');
  cam.W = st.clientWidth || 1; cam.H = st.clientHeight || 1;
  cam.z = clamp(cam.z, zMin(), 2.6);
  const w = $('#world'), u = U();
  w.style.height = cam.H * cam.z + 'px';
  w.style.width = roomW() * u + 'px';
  w.style.setProperty('--u', u + 'px');
  clampCam(); applyCam();
}
function clampCam() {
  const wW = roomW() * U(), wH = cam.H * cam.z;
  cam.tx = wW <= cam.W ? (cam.W - wW) / 2 : clamp(cam.tx, cam.W - wW, 0);
  cam.ty = wH <= cam.H ? (cam.H - wH) / 2 : clamp(cam.ty, cam.H - wH, 0);
}
function applyCam() { $('#world').style.transform = `translate(${cam.tx}px, ${cam.ty}px)`; }
function zoomAt(nz, fx = cam.W / 2, fy = cam.H / 2) {
  nz = clamp(nz, zMin(), 2.6);
  const k = nz / cam.z;
  cam.tx = fx - (fx - cam.tx) * k; cam.ty = fy - (fy - cam.ty) * k; cam.z = nz;
  layoutWorld();
  positionItembar(); if (emoteTarget) positionEmotebar();
}
function centerOn(x, y = 72) {
  cam.tx = cam.W / 2 - x * U(); cam.ty = cam.H / 2 - y / 100 * cam.H * cam.z;
  clampCam(); applyCam();
}
function worldPt(e) {
  const r = $('#world').getBoundingClientRect();
  return { x: (e.clientX - r.left) / U(), y: (e.clientY - r.top) / r.height * 100 };
}
function setupCamera() {
  const st = $('#stage');
  new ResizeObserver(() => layoutWorld()).observe(st);
  const ptrs = new Map();
  let g = null;
  st.addEventListener('pointerdown', e => {
    if (e.target.closest('.zoombar, .popbar, #tvctl, #ytwrap.big')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = st.getBoundingClientRect();
    if (ptrs.size === 1) g = { type: 'maybe', sx: e.clientX, sy: e.clientY, tx: cam.tx, ty: cam.ty };
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      g = { type: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: cam.z, tx: cam.tx, ty: cam.ty,
        fx: (a.x + b.x) / 2 - r.left, fy: (a.y + b.y) / 2 - r.top };
      st._panned = true;
    }
  });
  st.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId) || !g) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.type === 'maybe' && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 9) { g.type = 'pan'; st._panned = true; hideEmotebar(); pet?.hideBar(); }
    if (g.type === 'pan') {
      cam.tx = g.tx + e.clientX - g.sx; cam.ty = g.ty + e.clientY - g.sy;
      clampCam(); applyCam(); positionItembar();
    }
    if (g.type === 'pinch' && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()], r = st.getBoundingClientRect();
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
      cam.z = g.z; cam.tx = g.tx + (mx - g.fx); cam.ty = g.ty + (my - g.fy);
      zoomAt(g.z * d / g.d, mx, my);
    }
  });
  const up = e => {
    ptrs.delete(e.pointerId);
    if (!ptrs.size) { g = null; setTimeout(() => { st._panned = false; }, 0); }
    else if (g?.type === 'pinch') g = null;
  };
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);
  st.addEventListener('wheel', e => {
    e.preventDefault();
    const r = st.getBoundingClientRect();
    zoomAt(cam.z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), e.clientX - r.left, e.clientY - r.top);
  }, { passive: false });
}

// ── Presence ─────────────────────────────────────────────────
function onPresence(v) {
  const was = presenceInit && isOnline(other), wasV = presenceInit && isOnline('v');
  S.presence = v || {};
  const now = isOnline(other);
  if (presenceInit && now && !was) { toast(`${esc(prof(other).face)} <b>${esc(called(other))}</b> came home! (${esc(ROOMS[roomOf(other)].name)})`); sfx.knock(); }
  if (presenceInit && was && !now) toast(`${esc(called(other))} left 👋`);
  if (me !== 'v' && S.profiles?.v) {
    const nowV = isOnline('v');
    if (presenceInit && nowV && !wasV) { toast(`${esc(prof('v').face)} <b>${esc(called('v'))}</b> is visiting! 👋`); sfx.knock(); }
    if (presenceInit && wasV && !nowV) toast(`${esc(called('v'))} went home 👋`);
  }
  presenceInit = true;
  renderPresence(); renderAvatars(); renderBubble();
  if (panel === 'games') renderGamesPanel();
}

function renderPresence() {
  if (!other) return;
  const mp = prof(me), op = prof(other), on = isOnline(other), rm = ROOMS[roomOf(other)];
  const myNick = nick(me);
  const moodTxt = m => m?.e ? `${esc(m.e)} ${esc(m.t || MOODS.find(x => x[0] === m.e)?.[1] || '')}` : '';
  const vc = $('#visitor-chip');
  if (vc) { const on = me !== 'v' && S.profiles?.v && isOnline('v'); vc.hidden = !on; if (on) vc.textContent = `${prof('v').face} ${called('v')}`; }
  $('#pill-me').innerHTML = `<span class="pface" style="--c:${esc(mp.color)}">${faceHTML(me)}</span><span class="pinfo"><b>${esc(myNick || mp.name)}</b><small>${mp.mood?.e ? moodTxt(mp.mood) : `${ROOMS[view].icon} ${ROOMS[view].name}`}</small></span>`;
  const status = !joined(other) ? 'Hasn’t joined yet — send the link!'
    : on ? `<i class="dot on"></i>${roomOf(other) === view ? 'Here with you' : `In the ${rm.name.toLowerCase()} ${rm.icon}`}` : `<i class="dot"></i>Away · ${ago(S.presence[other]?.ts)}`;
  const tz = (op.mood?.e ? ` · ${moodTxt(op.mood)}` : '') + (op.tz ? ` · 🕒 ${esc(localTime(op.tz))}` : '');
  $('#pill-other').innerHTML = `<span class="pface" style="--c:${esc(op.color)}">${faceHTML(other)}</span><span class="pinfo"><b>${esc(joined(other) ? called(other) : 'Your partner')}</b><small>${status}${joined(other) ? tz : ''}</small></span>`;
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
  $('#stage').classList.toggle('night', h >= 19 || h < 6);
  $('#stage').classList.toggle('dusk', h >= 17 && h < 19);
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
    toast(`${esc(prof(other).face)} <b>${esc(called(other))}</b> came into the ${esc(ROOMS[view].name.toLowerCase())}`);
    sfx.knock();
  }
  prevRoom[other] = r;
  renderAvatars();
}

function seatPos(itemId, idx) {
  const it = S.items[itemId];
  const set = it && SEATS[it.k];
  if (!set) return null;
  const s = (set[it.face || 'front'] || set.front)[idx];
  if (!s) return null;
  const sc = it.s || 1, flip = it.fl ? -1 : 1, [dx, up, pose] = s;
  return {
    x: it.x + dx * sc * flip, y: it.y - up * sc * UPCT, pose,
    z: pose === 'back' ? itemZ(it) - 1 : itemZ(it) + (pose === 'lie' ? 60 : 1),
    left: it.face === 'left' ? true : it.face === 'right' ? false : null,
    blanket: it.k === 'bed' ? (it.c || FURN.bed.c) : null,
  };
}
function freeSeat(itemId, preferred = 0) {
  const it = S.items[itemId], set = it && SEATS[it.k];
  if (!set) return -1;
  const n = (set[it.face || 'front'] || set.front).length;
  const taken = new Set(['a', 'b'].filter(id => id !== me && roomOf(id) === view && S.avatars[id]?.seat?.id === itemId).map(id => S.avatars[id].seat.i));
  for (let k = 0; k < n; k++) { const i = (preferred + k) % n; if (!taken.has(i)) return i; }
  return -1;
}
function restSeat(id) {
  const kind = ROOMS[view].rest;
  const found = Object.entries(S.items).find(([, i]) => i.t === 'furn' && i.k === kind);
  if (!found) return null;
  const seats = (SEATS[kind][found[1].face || 'front'] || SEATS[kind].front);
  return seatPos(found[0], (id === 'a' ? 0 : 1) % seats.length);
}

function renderAvatars() {
  if (!other) return;
  const layer = $('#avatars');
  for (const id of ['a', 'b', 'v']) {
    let el = layer.querySelector(`[data-id="${id}"]`);
    const visible = id === me || (joined(id) && roomOf(id) === view && (id !== 'v' || isOnline('v')));
    if (!visible) { el?.remove(); continue; }
    const p = prof(id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'avatar'; el.dataset.id = id;
      el.innerHTML = '<div class="bubble"></div><div class="body"><span class="face"></span><span class="hat"></span><span class="zzz">💤</span><span class="blanket"></span><span class="mood"></span></div><div class="tag"><b></b><small></small></div>';
      layer.append(el);
    }
    const online = id === me || isOnline(id);
    const a = S.avatars[id];
    const seat = online ? (a?.seat && seatPos(a.seat.id, a.seat.i)) : restSeat(id);
    const pos = seat || (a?.x != null ? a : HOME[id]);
    if (!el._anim) {
      if (el._x != null && (Math.abs(el._x - pos.x) > .5 || Math.abs(el._y - pos.y) > .5)) {
        if (seat?.left == null) { if (pos.x < el._x - .5) el.classList.add('left'); else if (pos.x > el._x + .5) el.classList.remove('left'); }
        el.classList.add('walking');
        clearTimeout(el._wt); el._wt = setTimeout(() => el.classList.remove('walking'), 900);
      }
      if (seat?.left != null) el.classList.toggle('left', seat.left);
      el._x = pos.x; el._y = pos.y;
      el.style.left = ux(pos.x);
      el.style.top = pos.y + '%';
      el.style.zIndex = seat ? seat.z : Math.round(pos.y * 10) + 1;
    }
    ['sit', 'back', 'lie', 'swing'].forEach(c => el.classList.toggle(c, seat?.pose === c));
    const mood = $('.mood', el); mood.textContent = p.mood?.e || ''; mood.hidden = !p.mood?.e;
    if (seat?.blanket) el.style.setProperty('--blanket', seat.blanket);
    el.style.setProperty('--c', p.color);
    if (!el._bonked) setFace($('.face', el), id);
    el.classList.toggle('has-pic', !!pic(id));
    const hat = $('.hat', el);
    hat.textContent = p.hat || '';
    hat.className = 'hat ' + (HAT_CLASS[p.hat] || '');
    $('.tag b', el).textContent = called(id);
    $('.tag small', el).textContent = nick(id) ? p.name : '';
    el.classList.toggle('away', !online);
    el.classList.toggle('me', id === me);
    el.classList.toggle('powered', online && powered(id));

    const em = a?.emote;
    if (em && em.ts !== lastEmote[id]) {
      const fresh = lastEmote[id] !== undefined || store.now() - em.ts < 5000;
      lastEmote[id] = em.ts;
      if (fresh && store.now() - em.ts < 8000) {
        showEmote(em.to || id, em.e);
        if (em.to === me && id !== me) { navigator.vibrate?.([80, 40, 80]); sfx.poke(); }
      }
    } else if (!em && lastEmote[id] === undefined) lastEmote[id] = 0;

    const bk = a?.bonk;
    if (bk && bk.ts !== lastBonk[id]) {
      const fresh = lastBonk[id] !== undefined || store.now() - bk.ts < 4000;
      lastBonk[id] = bk.ts;
      if (fresh && store.now() - bk.ts < 6000) setTimeout(() => playBonk(id, bk.to, bk.hit), 0);
    } else if (!bk && lastBonk[id] === undefined) lastBonk[id] = 0;

    const kk = a?.kick;
    if (kk && kk.ts !== lastKick[id]) {
      const fresh = lastKick[id] !== undefined || store.now() - kk.ts < 4000;
      lastKick[id] = kk.ts;
      if (fresh && store.now() - kk.ts < 6000) setTimeout(() => playKick(id, kk), 0);
    } else if (!kk && lastKick[id] === undefined) lastKick[id] = 0;
  }
  if (!$('#emotebar').hidden && emoteTarget) positionEmotebar();
}

function spawnFx(text, x, y, up, cls = 'float', extra = {}) {
  const f = document.createElement('div');
  f.className = cls; f.textContent = text;
  f.style.left = ux(x); f.style.top = `calc(${y}% - ${up} * var(--u))`;
  for (const [k, v] of Object.entries(extra)) f.style.setProperty(k, v);
  $('#fx').append(f);
  setTimeout(() => f.remove(), 3200);
  return f;
}
const avatarEl = id => $(`.avatar[data-id="${id}"]`);

function showEmote(id, e) {
  const av = avatarEl(id); if (!av) return;
  const n = e === '❤️' || e === '🎉' ? 5 : 1;
  for (let i = 0; i < n; i++) {
    const f = spawnFx(e, av._x + (Math.random() - .5) * 8, av._y, 22, 'float', { '--dx': `calc(${(Math.random() - .5) * 16} * var(--u))` });
    f.style.animationDelay = `${i * 0.12}s`;
  }
  if (e === '👋' || e === '😡') { av.classList.remove('shake'); void av.offsetWidth; av.classList.add('shake'); }
}

function dizzy(id, ms = 1300, birds = false) {
  const el = avatarEl(id); if (!el) return;
  const face = $('.face', el);
  el._bonked = true; face.textContent = '😵'; face._pic = null;
  for (let i = 0; i < 3; i++) spawnFx('⭐', el._x, el._y, 17, 'star', { '--a': `${i * 120}deg` });
  if (birds) for (let i = 0; i < 2; i++) spawnFx('🐦', el._x, el._y, 19, 'bird', { '--a': `${60 + i * 180}deg` });
  clearTimeout(el._dz);
  el._dz = setTimeout(() => { el._bonked = false; setFace(face, id); }, ms);
}

// 🏏 BONK
function playBonk(from, to, hit) {
  const target = avatarEl(to), attacker = avatarEl(from);
  if (!target) return;
  const tx = target._x, ty = target._y;
  const fromLeft = attacker ? attacker._x < tx : true;
  const bat = spawnFx('🏏', tx + (fromLeft ? -9 : 9), ty, 24, 'bat' + (fromLeft ? '' : ' flip'));
  bat.addEventListener('animationend', () => bat.remove());
  setTimeout(() => {
    if (hit) {
      sfx.bonk();
      if (to === me) navigator.vibrate?.(180);
      target.classList.remove('bonked'); void target.offsetWidth; target.classList.add('bonked');
      spawnFx('BONK!', clamp(tx, 22, roomW() - 22), ty, 26, 'bonk-word');
      dizzy(to);
      pet?.scare();
      setTimeout(() => target.classList.remove('bonked'), 1300);
    } else {
      sfx.whiff();
      target.classList.remove('dodge'); void target.offsetWidth; target.classList.add('dodge');
      spawnFx('MISS!', clamp(tx, 18, roomW() - 18), ty, 26, 'bonk-word miss');
      setTimeout(() => target.classList.remove('dodge'), 600);
    }
  }, 280);
}

// 🦶 SUPER KICK → fly into the wall → slide down → dizzy
function playKick(from, k) {
  const target = avatarEl(k.to), attacker = avatarEl(from);
  if (!target || target._anim) return;
  if (attacker && attacker !== target) {
    attacker.animate([{ translate: '0 0' }, { translate: `${(target._x - attacker._x) * 0.35 * U()}px 0` }, { translate: '0 0' }], { duration: 350, easing: 'ease-out' });
    spawnFx('🦶', (attacker._x + target._x) / 2, target._y, 10, 'float');
  }
  sfx.kick();
  spawnFx('POW!', clamp(target._x, 20, roomW() - 20), target._y, 24, 'bonk-word kick-word');
  const u = U(), H = $('#world').clientHeight, x0 = target._x, y0 = target._y;
  const dx1 = (k.wx - x0) * u, dy1 = (k.wy - y0) / 100 * H, dx2 = (k.land.x - x0) * u, dy2 = (k.land.y - y0) / 100 * H;
  target._anim = true; target._bonked = true;
  $('.face', target).textContent = '😵'; $('.face', target)._pic = null;
  target.style.zIndex = 4500;
  target.classList.add('bonked');
  const anim = target.animate([
    { translate: '0px 0px', rotate: '0deg', scale: '1' },
    { translate: `${dx1 * .5}px ${Math.min(dy1, 0) - 18 * u}px`, rotate: '360deg', scale: '1.15', offset: .2 },
    { translate: `${dx1}px ${dy1}px`, rotate: '720deg', scale: '1', offset: .36 },
    { translate: `${dx1}px ${dy1}px`, rotate: '720deg', scale: '1.4 .45', offset: .44 },
    { translate: `${dx1}px ${dy1}px`, rotate: '720deg', scale: '1.2 .75', offset: .56 },
    { translate: `${dx2}px ${dy2}px`, rotate: '716deg', scale: '1', offset: .86 },
    { translate: `${dx2}px ${dy2}px`, rotate: '720deg', scale: '1' },
  ], { duration: 2000, easing: 'ease-in-out' });
  setTimeout(() => {
    sfx.splat();
    if (k.to === me) navigator.vibrate?.([250, 60, 120]);
    const wall = $('#wall'); wall.classList.remove('shake'); void wall.offsetWidth; wall.classList.add('shake');
    const c = document.createElement('div'); c.className = 'crack'; c.textContent = '💥';
    c.style.left = ux(k.wx); c.style.top = `calc(${k.wy}% - 8 * var(--u))`;
    $('#fx').append(c); setTimeout(() => c.remove(), 2300);
    spawnFx('SPLAT!', clamp(k.wx, 20, roomW() - 20), k.wy, 22, 'bonk-word');
  }, 720);
  anim.onfinish = () => {
    anim.cancel();
    target._anim = false;
    target._x = k.land.x; target._y = k.land.y;
    target.style.left = ux(k.land.x); target.style.top = k.land.y + '%';
    target.style.zIndex = Math.round(k.land.y * 10) + 1;
    target.classList.remove('bonked');
    dizzy(k.to, 2600, true);
    if (k.to === me) store.update(`avatars/${me}`, { x: k.land.x, y: k.land.y, seat: null });
  };
}

function approach(target) {
  const mine = S.avatars[me] || HOME[me], theirs = avatarEl(target);
  if (!theirs) return false;
  const dist = Math.hypot(mine.x - theirs._x, (mine.y - theirs._y) * 1.2);
  if (dist <= REACH && !S.avatars[me]?.seat) return true;
  const side = mine.x < theirs._x ? -1 : 1;
  store.update(`avatars/${me}`, { x: +clamp(theirs._x + side * 14, 8, roomW() - 8).toFixed(1), y: +clamp(theirs._y, 60, 97).toFixed(1), seat: null });
  return false;
}
function tryBonk(target) {
  hideEmotebar();
  if (!approach(target)) return toast('🏏 Sneaking up… tap them again to bonk!', 2500);
  store.update(`avatars/${me}`, { bonk: { to: target, hit: Math.random() < 0.75, ts: store.now() } });
}
function tryKick(target) {
  hideEmotebar();
  if (!powered(me)) return toast('⚡ Your super power ran out!');
  if (Date.now() - lastKickAt < 2200) return;
  if (!approach(target)) return toast('🦶 Getting close… tap them again to KICK!', 2500);
  lastKickAt = Date.now();
  const t = avatarEl(target), mine = S.avatars[me];
  const dir = t._x >= mine.x ? 1 : -1;
  const wx = +clamp(t._x + dir * 24, 10, roomW() - 10).toFixed(1);
  store.update(`avatars/${me}`, { kick: { to: target, ts: store.now(), wx, wy: 42, land: { x: wx, y: 64 } } });
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
  const extra = target === me ? `<button data-mood-open aria-label="Set my mood">🙂</button>` :
    (powered(me) ? `<button data-kick="${target}" aria-label="Super kick" style="font-size:calc(7 * var(--u))">🦶</button>` : '') +
    `<button data-bonk="${target}" aria-label="Bonk">🏏</button>${isVisitor || target === 'v' ? '' : '<button data-nick-open aria-label="Nickname">🏷️</button>'}`;
  bar.innerHTML = extra + EMOTES.map(e => `<button data-emote="${e}">${e}</button>`).join('');
  bar.hidden = false;
  positionEmotebar();
}
function positionEmotebar() {
  const av = avatarEl(emoteTarget), bar = $('#emotebar');
  if (!av) return hideEmotebar();
  const half = bar.offsetWidth / 2 / U() + 2;
  bar.style.left = ux(clamp(av._x, half, roomW() - half));
  bar.style.top = `calc(${av._y}% - 22 * var(--u))`;
}
function hideEmotebar() { $('#emotebar').hidden = true; emoteTarget = null; }

// ── ⚡ Power-ups ─────────────────────────────────────────────
function renderPower() {
  const p = S.power, now = store.now();
  $('.powerup')?.remove();
  if (p?.state === 'spawn' && p.rm === view && now - p.ts < SPAWN_MS) {
    const el = document.createElement('div');
    el.className = 'powerup'; el.textContent = '⚡';
    el.style.left = ux(p.x); el.style.top = p.y + '%';
    $('#fx').append(el);
  }
  const key = p ? `${p.state}:${p.ts}:${p.by || ''}` : '';
  if (key !== powerKey && powerKey !== '' || (key && powerKey === '' && p && now - p.ts < 3000)) {
    if (p?.state === 'spawn' && p.rm === view) { toast('⚡ A power-up appeared! Grab it first!', 3000); sfx.power(); }
    if (p?.state === 'held' && p.by === me && now < p.until) { toast(`⚡ <b>SUPER KICK</b> for ${Math.round(POWER_MS / 1000)}s! ${p.gift ? '(a gift from the universe 🌠) ' : ''}Tap ${esc(called(other))} to kick!`, 4500); sfx.power(); }
    if (p?.state === 'held' && p.by === other && now < p.until) toast(`⚠️ ${esc(called(other))} has <b>SUPER KICK</b>! Run! 🏃`, 4000);
  }
  powerKey = key;
  tickPower();
  renderAvatars();
}
function tickPower() {
  const t = $('#power-timer');
  const p = S.power;
  if (powered(me)) { t.hidden = false; t.textContent = `⚡ SUPER KICK · ${Math.ceil((p.until - store.now()) / 1000)}s`; }
  else if (!t.hidden) { t.hidden = true; renderAvatars(); }
  if (p?.state === 'spawn' && store.now() - p.ts >= SPAWN_MS && $('.powerup')) $('.powerup').remove();
  $$('.avatar').forEach(el => el.classList.toggle('powered', powered(el.dataset.id) && (el.dataset.id === me || isOnline(el.dataset.id))));
}
async function grabPower() {
  const p = S.power;
  if (!p || p.state !== 'spawn') return;
  store.update(`avatars/${me}`, { x: p.x, y: clamp(p.y + 2, 60, 97), seat: null });
  const ok = await store.transact('power', cur =>
    cur && cur.state === 'spawn' && store.now() - cur.ts < SPAWN_MS ? { state: 'held', by: me, until: store.now() + POWER_MS, ts: store.now() } : undefined);
  if (!ok) toast('Too slow! 😜');
}
// Only player 1's phone decides when power-ups appear (so they never double up).
let nextSpawn = 0;
function spawnTick() {
  if (me !== 'a' || !together()) return;
  const p = S.power, now = store.now();
  const active = p && ((p.state === 'spawn' && now - p.ts < SPAWN_MS) || (p.state === 'held' && now < p.until));
  if (active) return;
  if (p) store.remove('power');
  if (!nextSpawn) nextSpawn = now + rand(40, 100) * 1000;
  if (now < nextSpawn) return;
  nextSpawn = now + rand(70, 180) * 1000;
  if (Math.random() < 0.3) store.set('power', { state: 'held', by: Math.random() < .5 ? 'a' : 'b', until: now + POWER_MS, ts: now, gift: true });
  else store.set('power', { state: 'spawn', rm: view, x: +rand(12, roomW() - 12).toFixed(1), y: +rand(66, 92).toFixed(1), ts: now });
}

// ── Stage interactions ───────────────────────────────────────
function setupStage() {
  const stage = $('#stage');
  stage.addEventListener('click', e => {
    if (stage._panned) { stage._panned = false; return; }
    if (e.target.closest('.popbar, .zoombar, #tvctl, #ytwrap')) return;
    const hadEmote = !$('#emotebar').hidden;
    const prevTarget = emoteTarget;
    hideEmotebar();
    if (panel === 'draw') return;
    if (panel === 'decorate') { if (!e.target.closest('.item')) selectItem(null); return; }
    if (e.target.closest('.powerup')) return grabPower();
    if (e.target.closest('.pet-sprite')) return pet?.tap();
    pet?.hideBar();

    const av = e.target.closest('.avatar');
    if (av) {
      const id = av.dataset.id;
      if (id !== me && !isOnline(id)) return toast(`${esc(called(id))} is napping 💤 Leave a note 📌 or a message 💬!`);
      if (id !== me && powered(me) && !(hadEmote && prevTarget === id)) return tryKick(id);
      return hadEmote && prevTarget === id ? null : openEmotebar(id);
    }
    const itemEl = e.target.closest('.item');
    if (itemEl) return tapItem(itemEl.dataset.id);
    if (e.target.closest('#board')) return openPanel('notes');
    if (e.target.closest('#door')) return showRoomPicker();
    if (e.target.closest('#lamp')) return toggleLights();
    if (hadEmote) return;
    const p = worldPt(e);
    if (p.y < 50) return;
    sfx.swish();
    store.update(`avatars/${me}`, { x: +clamp(p.x, 6, roomW() - 6).toFixed(1), y: +clamp(p.y + 4, 60, 97).toFixed(1), seat: null });
  });

  // Drag items while decorating (stops the camera from panning)
  const layer = $('#items');
  layer.addEventListener('pointerdown', e => {
    const el = e.target.closest('.item');
    if (!el || panel !== 'decorate') return;
    e.preventDefault(); e.stopPropagation();
    const id = el.dataset.id, it = S.items[id]; if (!it) return;
    selectItem(id);
    const p = worldPt(e);
    drag = { id, el, dx: p.x - it.x, dy: p.y - it.y, x: it.x, y: it.y, moved: false };
    $('#dock').classList.add('dragging');
    try { el.setPointerCapture(e.pointerId); } catch {}
  });
  layer.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = worldPt(e);
    drag.x = clamp(p.x - drag.dx, 2, roomW() - 2); drag.y = clamp(p.y - drag.dy, 4, 99); drag.moved = true;
    drag.el.style.left = ux(drag.x); drag.el.style.top = drag.y + '%';
    if (S.items[drag.id]?.z == null) drag.el.style.zIndex = Math.round(drag.y * 10);
    positionItembar();
  });
  const end = () => {
    if (!drag) return;
    const d = drag; drag = null;
    $('#dock').classList.remove('dragging');
    if (d.moved) { $('#stage')._panned = true; store.update(`${sp()}/items/${d.id}`, { x: +d.x.toFixed(2), y: +d.y.toFixed(2) }); }
  };
  layer.addEventListener('pointerup', end);
  layer.addEventListener('pointercancel', end);
}

function tapItem(id) {
  const it = S.items[id]; if (!it) return;
  if (it.t === 'photo') return showPhoto(it);
  if (it.t === 'food') return kitchen.openFood(id);
  if (it.k === 'fridge') return kitchen.openFridgeMenu();
  if (FURN[it.k]?.cook) return kitchen.openBook(APPLIANCE_CAT[it.k]);
  if (SEATS[it.k]) {
    const mine = S.avatars[me]?.seat;
    if (mine?.id === id) {   // already sitting here → stand up in front of it
      store.update(`avatars/${me}`, { seat: null, x: it.x, y: clamp(it.y + 4, 60, 97) });
      return;
    }
    const i = freeSeat(id, me === 'a' ? 0 : 1);
    if (i < 0) return toast('No room left there! 🙈');
    const pos = seatPos(id, i);
    store.update(`avatars/${me}`, { seat: { id, i }, x: pos.x, y: pos.y });
    sfx.pop();
    return;
  }
  if (it.k === 'tv') return tv.tapTV();
  if (it.k === 'vmail') return vmail?.open();
  if (it.k === 'arcade') return openPanel('games');
  if (it.k === 'flowerbed') return showBed(id);
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
    const tappable = it.t === 'photo' || it.t === 'food' || (it.t === 'furn' && FURN[it.k]?.tap);
    el.className = ['item', it.t, tappable ? 'tap' : '', SEATS[it.k] ? 'sitable' : '', id === selectedItem ? 'sel' : '', el._new ? 'new' : ''].join(' ');
    el.style.setProperty('--s', it.s || 1);
    el.style.setProperty('--fx', it.fl ? -1 : 1);
    if (it.t === 'emoji' || it.t === 'text') el.textContent = it.v;
    const flyer = it.t === 'emoji' && FLYERS.includes(it.v);
    el.classList.toggle('flyer', flyer);
    if (it.k === 'flowerbed') renderBed(el);
    if (it.k === 'vmail') vmail?.decorate(el);
    if (it.t === 'food') kitchen?.renderFood(el, it);
    if (it.t === 'text') el.style.color = it.c || '#fff';
    if (it.t === 'furn') {
      el.style.setProperty('--c', it.c || FURN[it.k]?.c);
      $('.furn', el).className = `furn k-${it.k} f-${it.face || 'front'}`;
      if (it.k === 'tv') {
        const ch = it.ch ?? 0, yt = tv?.active();
        $('.tv', el).className = yt ? 'tv chyt' : 'tv ch' + ch;
        $('.scr span', el).textContent = yt ? '🎬' : TV_CHANNELS[ch];
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
    if (drag?.id !== id && !(flyer && el._flying && panel !== 'decorate')) {
      el.style.left = ux(it.x); el.style.top = it.y + '%';
      el.style.zIndex = flyer ? 3500 : itemZ(it);
    }
  }
  $$('.item', layer).forEach(el => { if (!seen.has(el.dataset.id)) el.remove(); });
  if (selectedItem && !S.items[selectedItem]) selectItem(null);
  tickClocks();
  renderPresence();
  positionItembar();
  if (panel === 'decorate') renderSelStrip();
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
    <p class="muted">Hung by ${esc(called(it.by))} · ${ago(it.ts)}</p>
    <button class="btn ghost wide small" data-dismiss style="margin-top:6px">Close</button>`, 'photo', 'photo-view');
}

function selectItem(id) {
  selectedItem = id;
  $$('#items .item').forEach(el => el.classList.toggle('sel', el.dataset.id === id));
  positionItembar();
  if (panel === 'decorate') renderSelStrip();
}
function positionItembar() {
  const bar = $('#itembar');
  const el = selectedItem && $(`#items [data-id="${selectedItem}"]`);
  const it = selectedItem && S.items[selectedItem];
  if (!el || !it || panel !== 'decorate') { bar.hidden = true; return; }
  const wr = $('#world').getBoundingClientRect(), r = el.getBoundingClientRect();
  bar.hidden = false;
  $('[data-item=style]', bar).hidden = true;
  $('[data-item=turn]', bar).hidden = !TURNABLE[it.k];
  $('[data-item=flip]', bar).hidden = it.t === 'text' || it.t === 'photo' || !!TURNABLE[it.k];
  const half = bar.offsetWidth / 2 + 4;
  bar.style.left = clamp(r.left + r.width / 2 - wr.left, half, wr.width - half) + 'px';
  bar.style.top = Math.max(bar.offsetHeight + 8, r.top - wr.top - 4) + 'px';
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
  if (act === 'turn') {
    const faces = TURNABLE[it.k]; if (!faces) return;
    return store.update(path, { face: faces[(faces.indexOf(it.face || 'front') + 1) % faces.length] });
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
// New things appear in the middle of what you're looking at
const viewCenterX = () => clamp((cam.W / 2 - cam.tx) / U(), 12, roomW() - 12);
const addSticker = v => addItem({ t: 'emoji', v, x: viewCenterX() + rand(-12, 12), y: rand(70, 85) }, 'sticker:' + v, `added ${v} to the ${ROOMS[view].name.toLowerCase()}`);
const addFurniture = k => addItem({ t: 'furn', k, c: FURN[k].c, x: viewCenterX(), y: k === 'clock' || k === 'fairy' ? 30 : 78, ...(k === 'tv' ? { ch: 0 } : {}) },
  'furn:' + k, `added a ${FURN[k].label.toLowerCase()} ${FURN[k].icon} to the ${ROOMS[view].name.toLowerCase()}`);
function addText() {
  const inp = $('#text-input'); const v = inp?.value.trim(); if (!v) return inp?.focus();
  addItem({ t: 'text', v: v.slice(0, 60), c: textInk, x: viewCenterX(), y: rand(28, 44) }, 'text', 'wrote something on the wall ✍️');
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
    addItem({ t: 'photo', pid, f: photoFrame, cap, x: viewCenterX() + rand(-10, 10), y: rand(24, 36) }, 'photo', `hung a photo in the ${ROOMS[view].name.toLowerCase()} 🖼️`);
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
// Stroke points are 0–1000 per screen-width of room (x) and 0–1000 of wall height (y).
const parsePts = s => String(s.p || '').split(' ').filter(Boolean).map(p => p.split(',').map(Number));
const sortStrokes = obj => Object.entries(obj).sort(([ka, a], [kb, b]) => (a.ts || 0) - (b.ts || 0) || (ka < kb ? -1 : 1));

function setupWallDrawing() {
  const cv = $('#wall-canvas'), wall = $('#wall');
  let raf = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const scale = Math.min(dpr, Math.sqrt(6e6 / Math.max(1, wall.clientWidth * wall.clientHeight)));
      cv.width = Math.round(wall.clientWidth * scale); cv.height = Math.round(wall.clientHeight * scale);
      drawWall();
    });
  }).observe(wall);

  let cur = null, lastPt = null;
  const pt = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 10 * roomW()), Math.round((e.clientY - r.top) / r.height * 1000)]; };
  cv.addEventListener('pointerdown', e => {
    if (panel !== 'draw') return;
    e.preventDefault(); e.stopPropagation(); cv.setPointerCapture(e.pointerId);
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
  const BW = ctx.canvas.width / (roomW() / 100), H = ctx.canvas.height;   // pixels per screen-width of room
  ctx.strokeStyle = ctx.fillStyle = s.c;
  ctx.lineWidth = s.w / 1000 * BW; ctx.lineCap = ctx.lineJoin = 'round';
  if (pts.length === 1) { ctx.beginPath(); ctx.arc(pts[0][0] / 1000 * BW, pts[0][1] / 1000 * H, ctx.lineWidth / 2, 0, 7); ctx.fill(); return; }
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x / 1000 * BW, y / 1000 * H));
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
  const note = locked.length ? `\n\n🔒 ${called(other)}’s newest drawings are protected and will stay.` : '';
  if (!confirm(`Clear the drawings from this wall?${note}`)) return;
  store.update(`${sp()}/strokes`, Object.fromEntries(ok.map(([k]) => [k, null])));
  logAct('wipe', `cleaned the ${ROOMS[view].name.toLowerCase()} wall 🧽`);
}

// ── Notes board ──────────────────────────────────────────────
const unread = kind => {
  if (isVisitor && kind === 'notes') return 0;
  const read = +(lsGet(readKey(kind)) || 0);
  const list = kind === 'chat' ? S.msgs : Object.values(S.notes);
  return list.filter(m => m.by === other && m.ts > read).length;
};
function markRead(kind) { lsSet(readKey(kind), String(store.now())); updateBadges(); if (kind === 'chat') { const b = $('#chatbub .badge'); if (b) b.hidden = true; } }
function updateBadges() {
  const c = unread('chat'), n = unread('notes');
  $('#badge-chat').hidden = !c; $('#badge-chat').textContent = c > 9 ? '9+' : c;
  $('#badge-notes').hidden = !n; $('#badge-notes').textContent = n;
  $('.board-dot').hidden = !n; $('.board-dot').textContent = n;
}
const sortedNotes = () => Object.entries(S.notes).map(([k, n]) => ({ k, ...n })).sort((a, b) => b.ts - a.ts);
function renderBoard() {
  const box = $('.board-notes');
  if (isVisitor) { box.className = 'board-notes n0'; box.innerHTML = '<div class="board-empty">🔒 Private notes</div>'; return; }
  const list = sortedNotes().slice(0, 3);
  box.className = 'board-notes n' + list.length;
  box.innerHTML = list.length
    ? list.map(n => `<div class="mini-note" style="--n:${esc(n.color)};--r:${(hash(n.k) % 5) - 2}deg"><span>${esc(n.text)}</span></div>`).join('')
    : '<div class="board-empty">Tap to pin a note 💌</div>';
}

// ── Chat ─────────────────────────────────────────────────────
function onChat(v) {
  const msgs = Object.entries(v || {}).map(([k, m]) => ({ k, ...m })).filter(m => !isVisitor || m.ts >= joinedAt).sort((a, b) => a.ts - b.ts || (a.k < b.k ? -1 : 1));
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
  renderBubble();
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
    return `${sep}<div class="msg ${m.by === me ? 'mine' : 'theirs'} ${jumbo ? 'jumbo' : ''}">${m.by !== me && m.by !== other ? `<small class="who">${esc(called(m.by))}</small>` : ''}${esc(m.text)}<time>${fmtTime(m.ts)}</time></div>`;
  }).join('') : `<div class="empty">No messages yet.<br>Say hi to ${esc(called(other))}! 👋</div>`;
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
  if (bubOpen) renderMini();
  const el = $('#typing');
  if (el) el.textContent = on ? `${called(other)} is typing…` : '';
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
    if (logInit && e.by !== me) toast(`${esc(prof(e.by).face)} <b>${esc(called(e.by))}</b> ${esc(e.text)}`);
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
  dock.className = name === 'decorate' ? 'slim deco' : name === 'draw' ? 'slim' : ['chat', 'notes', 'games', 'profile'].includes(name) ? 'tall' : '';
  $$('#toolbar [data-panel]').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
  $('#stage').classList.toggle('decorating', name === 'decorate');
  $('#stage').classList.toggle('drawing', name === 'draw');
  renderBubble();
  if (name === 'chat' && bubOpen) toggleMini(false);
  ({ chat: renderChatPanel, notes: renderNotesPanel, decorate: renderDecoratePanel, draw: renderDrawPanel, games: renderGamesPanel, profile: renderProfilePanel })[name]();
}
function closePanel() {
  panel = null;
  $('#dock').hidden = true; $('#dock').innerHTML = ''; $('#dock').classList.remove('folded', 'dragging');
  $$('#toolbar [data-panel]').forEach(b => b.classList.remove('active'));
  $('#stage').classList.remove('decorating', 'drawing', 'erasing');
  selectItem(null);
  renderBubble();
}

function renderChatPanel() {
  $('#dock').innerHTML = head(`💬 ${esc(called(other))}`, isOnline(other) ? 'Home right now' : 'They’ll see it when they drop by') +
    `<div class="chat-list" id="chat-list"></div><div class="typing" id="typing"></div>
    <div class="quick">${QUICK.map(e => `<button data-quick="${e}">${e}</button>`).join('')}</div>
    <form class="chat-form" id="chat-form"><input class="field" id="chat-input" placeholder="Say something sweet…" autocomplete="off" maxlength="1000" enterkeyhint="send"><button class="send" aria-label="Send">➤</button></form>`;
  renderChat(true); renderTyping(); markRead('chat');
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); const i = $('#chat-input'); sendChat(i.value); i.value = ''; i.focus(); });
  $('#chat-input').addEventListener('input', onTyping);
}

function renderNotesPanel() {
  if (isVisitor) { $('#dock').innerHTML = head('📌 Notes board') + '<div class="panel-body"><p class="status wait">🔒 The notes board is private to the hosts.</p></div>'; return; }
  $('#dock').innerHTML = head('📌 Notes board', 'Pinned in the living room until someone removes them') +
    `<div class="panel-body">
      <textarea class="field" id="note-text" maxlength="200" placeholder="Leave a little note… 💌"></textarea>
      <div style="margin-top:10px">${swatches(NOTE_COLORS, noteColor, 'data-note-color', { small: true })}</div>
      <button class="btn small" data-pin style="margin-top:10px">Pin it 📌</button>
      <div class="notes-grid" id="notes-grid"></div>
    </div>`;
  renderNotes(); markRead('notes');
}
function renderNotes() {
  const g = $('#notes-grid'); if (!g) return;
  const list = sortedNotes();
  g.innerHTML = list.length ? list.map(n => `<div class="note" style="--n:${esc(n.color)};--r:${(hash(n.k) % 5) - 2}deg">
      <button class="del" data-del-note="${esc(n.k)}" aria-label="Remove note">✕</button>
      <p>${esc(n.text)}</p><small>${esc(prof(n.by).face)} ${esc(called(n.by))} · ${ago(n.ts)}</small></div>`).join('')
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
  $('#dock').innerHTML = `<div class="slim-top"><div class="tabs">${tabs.map(([k, l]) => `<button class="chip ${k === decoTab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <button class="x" data-fold aria-label="Fold the panel">${$('#dock').classList.contains('folded') ? '▴' : '▾'}</button><button class="x" data-close aria-label="Close">✕</button></div>
    <div class="sel-strip" id="sel-strip" hidden></div>
    <div class="panel-body" id="deco-body"></div>`;
  renderSelStrip();
  renderDecoBody();
}
function renderSelStrip() {
  const box = $('#sel-strip'); if (!box) return;
  const it = selectedItem && S.items[selectedItem];
  if (!it || it.t === 'emoji' || it.t === 'food') { box.hidden = true; return; }
  box.hidden = false;
  if (it.t === 'photo') {
    box.innerHTML = `<div class="chips">${FRAMES.map(f => `<button class="chip ${f === (it.f || 'wood') ? 'on' : ''}" data-item-frame="${f}">${FRAME_NAMES[f]}</button>`).join('')}</div>`;
  } else {
    const label = it.t === 'text' ? 'Text color' : `${FURN[it.k]?.label || 'Item'} color`;
    box.innerHTML = `<small>${label}</small>${swatches(PALETTE, it.c || FURN[it.k]?.c, 'data-item-color')}`;
  }
}
const chips = (list, cur, key) => `<div class="chips">${list.map(([k, l]) => `<button class="chip ${k === cur ? 'on' : ''}" data-set="${key}" data-val="${k}">${l}</button>`).join('')}</div>`;
function renderDecoBody() {
  const b = $('#deco-body'); if (!b) return;
  const r = look();
  const nPhotos = Object.values(S.items).filter(i => i.t === 'photo').length;
  const html = {
    furniture: `<div class="furn-grid">${Object.entries(FURN).map(([k, f]) => `<button data-furn="${k}"><span>${f.icon}</span>${f.label}</button>`).join('')}</div>
      <p class="hint">Tip: tap a piece in the room to change its color, turn it 🔄, resize or remove it.</p>`,
    photos: `<div class="row"><input class="field" id="photo-cap" maxlength="40" placeholder="Caption (optional)"><button class="btn small" data-add-photo>📷 Gallery</button></div>
        <div class="slim-line"><small>Frame</small><div class="chips">${FRAMES.map(f => `<button class="chip ${f === photoFrame ? 'on' : ''}" data-frame="${f}">${FRAME_NAMES[f]}</button>`).join('')}</div></div>
        <p class="slim-note">${nPhotos}/${MAX_PHOTOS} photos in this room</p>`,
    stickers: `<div class="chips">${Object.keys(STICKER_SETS).map(k => `<button class="chip ${k === stickerSet ? 'on' : ''}" data-set-stickers="${esc(k)}">${k}</button>`).join('')}</div>
      <div class="stickers">${STICKER_SETS[stickerSet].map(s => `<button data-sticker="${s}">${s}</button>`).join('')}</div>`,
    themes: `<div class="themes">${THEMES.map(([i, n, bg], idx) => `<button style="background:${bg};color:${bg === '#2b2d42' ? '#fff' : 'inherit'}" data-theme="${idx}"><span>${i}</span>${n}</button>`).join('')}</div>
      <p class="hint">A theme repaints the walls, floor, rug and curtains of this room.</p>`,
    wall: `<div class="slim-line"><small>Paint</small>${swatches(PALETTE, r.wall, 'data-look-wall')}</div><div class="slim-line"><small>Paper</small>${chips(WALLPAPERS, r.wp, 'wp')}</div><div class="slim-line"><small>Curtains</small>${swatches(PALETTE, r.cur, 'data-look-cur', { none: true })}</div>`,
    floor: `<div class="slim-line"><small>Floor</small>${chips(FLOORS, r.fl, 'fl')}</div><div class="slim-line"><small>Colour</small>${swatches(PALETTE, r.floor, 'data-look-floor')}</div><div class="slim-line"><small>Rug</small>${swatches(PALETTE, r.rug, 'data-look-rug', { none: true })}</div>`,
    text: `<div class="row"><input class="field" id="text-input" maxlength="60" placeholder="Write on the wall… (🔒 1 hour)" enterkeyhint="done"><button class="btn small" data-add-text>Add</button></div>
      <div class="slim-line"><small>Colour</small>${swatches(PALETTE, textInk, 'data-text-ink')}</div>`,
  };
  b.innerHTML = html[decoTab];
}
const LOOK_LOG = { wall: 'painted the wall 🎨', wp: 'changed the wallpaper 🖼️', floor: 'changed the floor 🪵', fl: 'changed the floor 🪵', rug: 'got a new rug 🧶', cur: 'hung new curtains 🪟' };
function setLook(key, val) {
  store.update(`${sp()}/look`, { [key]: val });
  logAct(key, `${LOOK_LOG[key]} in the ${ROOMS[view].name.toLowerCase()}`);
}

function renderDrawPanel() {
  $('#stage').classList.toggle('erasing', tool === 'erase');
  $('#dock').innerHTML = `<div class="slim-top">
      <button class="chip ${tool === 'pen' ? 'on' : ''}" data-tool="pen" aria-label="Pen">✏️</button><button class="chip ${tool === 'erase' ? 'on' : ''}" data-tool="erase" aria-label="Eraser">🧽</button>
      <div class="row brushes">${BRUSHES.map(w => `<button class="${w === brush ? 'on' : ''}" data-brush="${w}" aria-label="Size ${w}"><i style="width:${w / 1.3 + 3}px;height:${w / 1.3 + 3}px"></i></button>`).join('')}</div>
      <span class="grow"></span>
      <button class="x" data-undo aria-label="Undo">↶</button><button class="x" data-wipe aria-label="Clear my drawings">🗑️</button><button class="x" data-close aria-label="Close">✕</button>
    </div>
    ${tool === 'pen' ? `<div class="slim-line">${swatches(PALETTE, ink, 'data-ink', { small: true })}</div>` : '<p class="slim-note">🧽 Rub over drawings or words to erase them</p>'}`;
  if (!drawHintShown) { drawHintShown = true; toast('✏️ Draw on the wall · 🔒 each other’s drawings are protected for 1 hour', 3500); }
}

function renderGamesPanel() {
  const both = isOnline(other);
  $('#dock').innerHTML = head('🕹️ Game corner', 'Play together when you’re both home') +
    `<div class="panel-body">
      <div class="status ${both ? 'ok' : 'wait'}">${both ? '🎉 You’re both home — pick a game!' : `♟️ Chess works anytime · 🎨 Doodle Duel needs ${esc(called(other))} home`}</div>
      ${games.list().map(g => `<button class="game play" data-game="${g.id}"><div class="gi">${g.icon}</div><div><b>${g.name}</b><p>${esc(g.desc)}</p></div><span class="go">▶</span></button>`).join('')}
      ${GAMES.filter(([, n]) => !['Doodle Duel'].includes(n)).map(([i, n, d]) => `<div class="game"><div class="gi">${i}</div><div><b>${n}<span class="soon">SOON</span></b><p>${d}</p></div></div>`).join('')}
    </div>`;
}

function picBlock() {
  const p = prof(me);
  return `<div class="dp-row"><span class="pface dp-big" style="--c:${esc(p.color)}">${faceHTML(me)}</span>
    <div class="stack"><button class="btn small" data-dp-pick>📷 ${pic(me) ? 'Change photo' : 'Add a photo'}</button>
    ${pic(me) ? '<button class="btn ghost small" data-dp-remove>Use my emoji instead</button>' : '<small class="muted">Shows as your face in the room</small>'}</div></div>`;
}
async function pickDP() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    const d = await cropPhoto(f, { $, showCard, hideOverlay, toast });
    if (!d) return;
    await store.set(`pics/${me}`, { d, ts: store.now() });
    toast('📸 Looking good!'); sfx.pop();
    logAct('dp', 'has a new profile picture 📸');
  };
  inp.click();
}
function renderProfilePanel() {
  if (isVisitor) {
    $('#dock').innerHTML = head('🙂 You (visiting)') + `<div class="panel-body" id="profile-body">${picBlock()}${profileForm(me)}
      <button class="btn wide" style="margin-top:16px" data-save-profile>Save</button>
      <button class="btn ghost wide" style="margin-top:10px" data-visit-leave>🚪 Leave the house</button></div>`;
    return;
  }
  const theirNick = nick(me);
  $('#dock').innerHTML = head('🙂 You') +
    `<div class="panel-body" id="profile-body">
      ${theirNick ? `<div class="status ok">💕 ${esc(prof(other).name)} calls you <b>${esc(theirNick)}</b></div>` : ''}
      ${picBlock()}
      <h4>Mood</h4>
      <button class="btn ghost wide small" data-mood-open>${prof(me).mood?.e ? `${esc(prof(me).mood.e)} ${esc(prof(me).mood.t || '')} — change` : '🙂 Set your mood'}</button>
      ${profileForm(me)}
      <button class="btn wide" style="margin-top:16px" data-save-profile>Save</button>
      <h4 style="margin-top:22px">Nickname for ${esc(prof(other).name)}</h4>
      <button class="btn ghost wide small" data-nick-open>🏷️ ${nick(other) ? `“${esc(nick(other))}” — change` : 'Give a nickname'}</button>
      <h4 style="margin-top:22px">Invite link</h4>
      <p class="muted">Your partner opens this on their phone to join. Keep it private!</p>
      <div class="linkbox"><input class="field" readonly value="${esc(inviteLink())}"><button class="btn small" data-share>Share</button></div>
      <h4 style="margin-top:22px">👋 Visitors</h4>
      <p class="muted">Send this to a friend. They knock, and one of you lets them in. It never shows your private room link.</p>
      ${S.visit?.code ? `<div class="linkbox"><input class="field" readonly value="${esc(visitLink(S.visit.code))}"><button class="btn small" data-share-visit>Share</button></div>
        <button class="btn ghost wide small" style="margin-top:8px" data-visit-renew>🔄 Make a new link (old one stops working)</button>` : '<button class="btn ghost wide small" data-visit-create>👋 Create a visitor link</button>'}
      <h4 style="margin-top:22px">More</h4>
      <div class="stack">
        <button class="btn ghost wide small" data-tips>❓ How it works</button>
        <button class="btn ghost wide small" data-switch>🔁 I picked the wrong player</button>
      </div>
      <p class="muted" style="margin-top:14px;font-size:12px">${store.mode === 'local' ? '⚠️ Demo mode — only works on this device. Add Firebase settings to go online.' : '🌐 Online'}</p>
    </div>`;
}

// ── Calls UI (group calls: you two + a visitor) ─────────────
let callTimer = null, muted = false, callKey = '', activeSince = 0;
const callUI = {
  set(s, info = {}) {
    const key = s + JSON.stringify(info);
    if (key === callKey) return;
    callKey = key;
    stopRing(); clearInterval(callTimer);
    const bar = $('#callbar');
    const names = (info.members || []).map(id => esc(called(id))).join(' & ') || '…';
    if (overlayMode === 'incoming' && s !== 'incoming') hideOverlay();
    if (s !== 'active') activeSince = 0;
    if (s === 'idle') { bar.hidden = true; muted = false; return; }
    if (s === 'incoming') {
      bar.hidden = true; startRing('ring');
      return showCard(`<div class="big bounce">${esc(prof(info.by).face)}</div><h2>${esc(called(info.by))} is calling!</h2><p class="muted">📞 Voice call</p>
        <div class="row" style="justify-content:center;margin-top:18px"><button class="btn red" data-decline>Decline</button><button class="btn green" data-accept>Answer</button></div>`, 'incoming');
    }
    bar.hidden = false; bar.className = s;
    if (s === 'available') bar.innerHTML = `<span>📞</span><span class="grow">Call going on with ${names}</span><button class="join" data-accept>Join</button>`;
    if (s === 'calling') { startRing('ringback'); bar.innerHTML = `<span class="pulse">📞</span><span class="grow">Calling…</span><button class="hang" data-hangup aria-label="Hang up">✕</button>`; }
    if (s === 'active') {
      activeSince = activeSince || Date.now();
      bar.innerHTML = `<span>🔊</span><span class="grow">On call with ${names} · <b id="call-time">0:00</b></span><button data-mute aria-label="Mute">${muted ? '🔇' : '🎙️'}</button><button class="hang" data-hangup aria-label="Hang up">✕</button>`;
      const tick = () => {
        const s = Math.floor((Date.now() - activeSince) / 1000);
        const el = $('#call-time'); if (el) el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      };
      tick(); callTimer = setInterval(tick, 1000);
    }
  },
  error(msg) { toast(esc(msg), 5500); },
};
function onCallButton() {
  if (call.state !== 'idle') return;
  const home = people().filter(id => id !== me && isOnline(id));
  if (!home.length) return toast(`${esc(called(other))} isn’t home right now 💤<br>Leave a message 💬 or a note 📌!`);
  call.start();
}

// ── 👋 Visitors ──────────────────────────────────────────────
// A visitor gets a separate link (?visit=CODE). They knock at /guests/CODE; one of you lets them in,
// and only then do they learn the room. When they leave, their character disappears.
const people = () => ['a', 'b', ...(S.profiles?.v ? ['v'] : [])];
const visitLink = code => `${location.origin}${location.pathname}?visit=${code}`;

// hosts: listen at the visitor door
async function watchGuests(code) {
  if (code === visitCode) return;
  gUnsub?.(); gUnsub = null; visitCode = code;
  if (!code) return;
  gstore = await createStore(code, { base: 'guests' });
  gUnsub = gstore.on('', g => {
    S.guest = g;
    const k = g?.knock;
    if (g?.state === 'knock' && k && store.now() - k.ts < 180000 && !shownKnocks.has(k.id)) {
      shownKnocks.add(k.id);
      if (overlayMode === 'incoming') return;
      sfx.knock(); navigator.vibrate?.([120, 80, 120]);
      showCard(`<div class="door-big">🚪</div><h2>${esc(k.face)} ${esc(k.name)} is at the door!</h2>
        <p class="muted">They’d like to visit your home 👋</p>
        <div class="row" style="justify-content:center;margin-top:14px"><button class="btn ghost" data-visit-no>Not now</button><button class="btn green" data-visit-yes>Let them in 🏠</button></div>`, 'knock');
    }
    if (g?.state !== 'knock' && overlayMode === 'knock') hideOverlay();
  });
}
function letVisitorIn(yes) {
  const k = S.guest?.knock; hideOverlay();
  if (!k || !gstore) return;
  if (!yes) { gstore.update('', { state: 'declined' }); return; }
  const now = store.now();
  gstore.update('', { state: 'in', room: roomId, by: me, at: now });
  store.set('profiles/v', { name: k.name, face: k.face, color: k.color, hat: k.hat || '', visitor: true, since: now, host: me });
  store.set('avatars/v', { x: DOOR_SPOT[view].x, y: DOOR_SPOT[view].y + 8, rm: view });
  store.push('log', { by: me, text: `let ${k.name} ${k.face} in to visit 👋`, ts: now });
}
async function createVisitLink(renew) {
  if (renew && visitCode && gstore) gstore.update('', { state: 'closed', room: null });
  const code = newRoomId();
  const g = await createStore(code, { base: 'guests' });
  await g.set('', { state: 'open', ts: store.now(), hosts: [prof('a').name, prof('b').name] });
  await store.set('visit', { code, ts: store.now() });
  toast(renew ? '🔄 New visitor link made — the old one no longer works' : '👋 Visitor link ready!');
  if (panel === 'profile') renderProfilePanel();
}
// when the visitor leaves (or their phone goes quiet for a while), tidy up so they must knock next time
function tidyVisitor() {
  if (isVisitor || !S.profiles?.v) return;
  const p = S.presence.v;
  if (isOnline('v') || store.now() - (p?.ts || S.profiles.v.since || 0) < 90000) return;
  ['profiles/v', 'avatars/v', 'presence/v', 'nicks/v', 'typing/v'].forEach(x => store.remove(x));
  if (gstore && S.guest?.state === 'in') gstore.update('', { state: 'open', room: null, knock: null });
}

// visitor side
async function visitorBoot(code) {
  isVisitor = true; visitCode = code;
  try { gstore = await createStore(code, { base: 'guests' }); }
  catch (err) { return showCard(`<div class="big">😵</div><h2>Couldn’t reach the house</h2><p class="muted">${esc(err.message || err)}</p><button class="btn" data-reload>Try again</button>`, 'error'); }
  const g = await gstore.once('');
  if (!g || g.state === 'closed') return showCard(`<div class="big">🔒</div><h2>This invite isn’t active anymore</h2><p class="muted">Ask for a new visitor link 💌</p>`, 'error');
  if (sessionStorage.getItem('ourroom:left:' + code)) {
    sessionStorage.removeItem('ourroom:left:' + code);
    watchDoor();
    return showCard('<div class="big">👋</div><h2>Thanks for visiting!</h2><p class="muted">You’ve left the house.</p><button class="btn" data-visit-again>🚪 Knock again</button>', 'error');
  }
  myKnock = sessionStorage.getItem('ourroom:knock:' + code);
  if (g.state === 'in' && g.knock?.id && g.knock.id === myKnock) return enterAsVisitor(g);
  watchDoor();
  showVisitorSetup(g);
}
function watchDoor() { if (gstore && !gstore._watched) { gstore._watched = true; gstore.on('', onDoorAnswer); } }
function showVisitorSetup(g) {
  const hosts = (g?.hosts || []).filter(Boolean).join(' & ') || 'your friends';
  showCard(`<div class="big bounce">🏠</div><h2>You’re invited!</h2><p class="muted">to <b>${esc(hosts)}</b>’s home 💕</p>
    ${profileForm('v')}
    <button class="btn wide" style="margin-top:18px" data-visit-knock>🚪 Knock knock!</button>`, 'setup');
}
function knock() {
  const p = readProfileForm($('#overlay'), 'v');
  myKnock = Math.random().toString(36).slice(2, 12);
  sessionStorage.setItem('ourroom:knock:' + visitCode, myKnock);
  gstore.update('', { state: 'knock', knock: { id: myKnock, name: p.name, face: p.face, color: p.color, hat: p.hat, ts: gstore.now() } });
  sfx.knock();
  showCard(`<div class="door-big">🚪</div><h2>Knock knock…</h2><p class="muted">Waiting for someone to open the door 🙈</p>`, 'waiting');
}
function onDoorAnswer(g) {
  if (visitorInside) {
    if (g?.state !== 'in') { visitorInside = false; showCard(`<div class="big">👋</div><h2>You’ve left the house</h2><p class="muted">Thanks for visiting! Knock again anytime with the same link.</p><button class="btn" data-reload>🚪 Knock again</button>`, 'error'); }
    return;
  }
  if (!g || g.state === 'closed') return showCard(`<div class="big">🔒</div><h2>This invite isn’t active anymore</h2>`, 'error');
  if (g.knock?.id !== myKnock) return;
  if (g.state === 'in') return enterAsVisitor(g);
  if (g.state === 'declined') showCard(`<div class="big">🙈</div><h2>They can’t let you in right now</h2><p class="muted">Try again a bit later!</p><button class="btn" data-visit-knock-again>🚪 Knock again</button>`, 'waiting');
}
async function enterAsVisitor(g) {
  watchDoor();   // hear it if the hosts close the door
  visitorInside = true;
  roomId = g.room; visitHost = g.by || 'a'; joinedAt = g.at || 0;
  try { store = await createStore(roomId); } catch (err) { return showCard(`<div class="big">😵</div><h2>Couldn’t open the house</h2><p class="muted">${esc(err.message || err)}</p>`, 'error'); }
  store.onError = msg => toast(esc(msg), 6000);
  me = 'v';
  watchProfiles();
  await store.once('profiles');
  enterRoom();
}
function leaveAsVisitor() {
  if (!confirm('Leave the house?')) return;
  const now = store.now();
  store.update('presence/v', { online: false, ts: now });
  ['avatars/v', 'profiles/v', 'typing/v'].forEach(x => store.remove(x));
  gstore?.update('', { state: 'open', room: null, knock: null });
  sessionStorage.removeItem('ourroom:knock:' + visitCode);
  sessionStorage.setItem('ourroom:left:' + visitCode, '1');
  setTimeout(() => location.reload(), 400);   // stop being 'home' right away
}


// ── 😊 Mood ─────────────────────────────────────────────────
function showMood() {
  const m = prof(me).mood;
  showCard(`<div class="big">${esc(m?.e || '🙂')}</div><h2>How are you feeling?</h2>
    <div class="faces" style="margin-top:12px">${MOODS.map(([e, l]) => `<button class="face-opt ${m?.e === e ? 'on' : ''}" data-mood-pick="${e}" title="${l}">${e}</button>`).join('')}</div>
    <input class="field" id="mood-text" maxlength="40" value="${esc(m?.t || '')}" placeholder="Add a few words (optional) — e.g. exam today 😭" style="margin-top:12px">
    <div class="row" style="justify-content:center;margin-top:14px">${m ? '<button class="btn ghost" data-mood-clear>Clear</button>' : ''}<button class="btn" data-mood-save>Save 💕</button></div>`, 'mood');
}

// ── 🦋 Butterflies & friends flutter around their room ──────
function flyAround() {
  $$('#items .item.flyer').forEach(el => {
    if (panel === 'decorate' || document.hidden) { if (el._flying) { el._flying = false; el.style.transition = ''; renderItems(); } return; }
    const it = S.items[el.dataset.id]; if (!it) return;
    const x0 = el._fx ?? it.x, y0 = el._fy ?? it.y;
    const x = clamp(x0 + rand(-28, 28), 4, roomW() - 4), y = clamp(y0 + rand(-14, 14), 8, 92);
    el._fx = x; el._fy = y; el._flying = true;
    el.style.transition = 'left 2.5s ease-in-out, top 2.5s ease-in-out';
    el.style.left = ux(x); el.style.top = y + '%';
    el.style.setProperty('--fx', x < x0 ? 1 : -1);
  });
}

// ── 🌷 Garden: flower beds that grow over real days ─────────
let openBedId = null;
function plantState(pl) {
  if (!pl) return null;
  const now = store.now(), age = now - pl.p, dry = now - (pl.w || pl.p);
  const stage = age >= GROW.bloom ? 'bloom' : age >= GROW.bud ? 'bud' : age >= GROW.sprout ? 'sprout' : 'seed';
  return { stage, thirsty: dry >= GROW.thirsty, flower: FLOWERS.find(f => f[0] === pl.f) || FLOWERS[0], age, dry };
}
const STAGE_ICON = { seed: '🟤', sprout: '🌱', bud: '🌿' };
function renderBed(el) {
  const id = el.dataset.id, plots = S.garden?.[id] || {};
  $$('.plot', el).forEach(p => {
    const st = plantState(plots[p.dataset.plot]);
    p.textContent = !st ? '' : st.stage === 'bloom' ? (st.thirsty ? '🥀' : st.flower[0]) : STAGE_ICON[st.stage];
    p.className = 'plot ' + (st ? `s-${st.stage}` : 'empty') + (st?.thirsty ? ' thirsty' : '');
  });
}
function whenTxt(ms) { const h = Math.ceil(ms / 3600000); return h >= 24 ? `~${Math.round(h / 24)} day${h >= 36 ? 's' : ''}` : `~${h}h`; }
function showBed(id) {
  openBedId = id;
  const plots = S.garden?.[id] || {};
  const rows = [0, 1, 2, 3].map(i => {
    const pl = plots[i], st = plantState(pl);
    if (!st) return `<li><span class="pi">🟫</span><div>Empty spot</div><button class="chip" data-plant-pick="${id}:${i}">🌱 Plant</button></li>`;
    const name = st.flower[1];
    const status = st.thirsty ? '🥀 Thirsty! Water me' : st.stage === 'bloom' ? '🌸 In bloom!' : `${st.stage === 'seed' ? 'Seed' : st.stage === 'sprout' ? 'Sprout' : 'Bud'} — blooms in ${whenTxt(GROW.bloom - st.age)}`;
    const icon = st.stage === 'bloom' ? (st.thirsty ? '🥀' : st.flower[0]) : STAGE_ICON[st.stage];
    return `<li><span class="pi">${icon}</span><div>${name}<small>${status} · planted by ${esc(called(pl.by))}</small></div>${st.stage === 'bloom' && !st.thirsty ? `<button class="chip" data-pick-flower="${id}:${i}">💐 Pick</button>` : ''}</li>`;
  }).join('');
  showCard(`<div class="cook-head"><span class="dish">🌷</span><div><b>Flower bed</b><small>Water every 2 days · blooms after 2 days</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
    <ul class="bed-list">${rows}</ul>
    <button class="btn wide" data-water="${id}">💧 Water the flowers</button>`, 'bed');
}
function showPlantChoice(bed, i) {
  showCard(`<div class="big">🌱</div><h2>What shall we plant?</h2>
    <div class="choose-grid" style="width:100%;margin-top:12px">${FLOWERS.map(([e, n]) => `<button data-plant="${bed}:${i}:${e}"><span>${e}</span>${n}</button>`).join('')}</div>
    <button class="btn ghost wide small" data-dismiss style="margin-top:12px">Cancel</button>`, 'bouquet');
}
function plantFlower(v) {
  const [bed, i, e] = v.split(':');
  const now = store.now();
  store.set(`garden/${bed}/${i}`, { f: e, p: now, w: now, by: me });
  const name = FLOWERS.find(f => f[0] === e)?.[1] || 'flower';
  logAct('plant', `planted a ${name.toLowerCase()} ${e} in the garden 🌱`);
  sfx.pop(); showBed(bed);
}
function waterBed(bed) {
  const plots = S.garden?.[bed] || {};
  if (!Object.keys(plots).length) return toast('Plant something first 🌱');
  const now = store.now();
  store.update(`garden/${bed}`, Object.fromEntries(Object.keys(plots).map(i => [`${i}/w`, now])));
  const el = $(`#items [data-id="${bed}"]`), it = S.items[bed];
  hideOverlay();
  if (it) { spawnFx('🚿', it.x - 8, it.y, 16, 'float'); for (let k = 0; k < 6; k++) setTimeout(() => spawnFx('💧', it.x + rand(-12, 12), it.y, 8, 'drop'), k * 120); }
  logAct('water', 'watered the flowers 💧');
  sfx.pour();
}
let picked = null;
function pickFlower(v) {
  const [bed, i] = v.split(':');
  const pl = S.garden?.[bed]?.[i]; if (!pl) return;
  const fl = FLOWERS.find(f => f[0] === pl.f) || FLOWERS[0];
  store.remove(`garden/${bed}/${i}`);
  picked = fl;
  sfx.yay();
  showCard(`<div class="result-dish">💐<span>${fl[0]}</span></div><h2>You picked a ${fl[1].toLowerCase()}!</h2>
    <div class="stack" style="margin-top:12px">
      ${joined(other) ? `<button class="btn wide" data-bouquet="give">💝 Give it to ${esc(called(other))}</button>` : ''}
      <button class="btn ghost wide" data-bouquet="vase">🏺 Put it in a vase in the living room</button>
      <button class="btn ghost wide" data-bouquet="here">🌷 Put it down here</button>
    </div>`, 'bouquet');
}
function placeBouquet(how) {
  const fl = picked; hideOverlay(); if (!fl) return;
  picked = null;
  const now = store.now();
  if (how === 'give') {
    const rm = isOnline(other) ? roomOf(other) : 'living';
    const a = S.avatars[other] || { x: 60, y: 80 };
    const x = rm === roomOf(other) ? a.x + rand(-8, 8) : rand(40, 120);
    store.push(`spaces/${rm}/items`, { t: 'emoji', v: '💐', s: 0.8, x: +clamp(x, 8, (ROOMS[rm].w || 1) * 100 - 8).toFixed(1), y: +clamp((a.y || 80) + 2, 62, 96).toFixed(1), by: me, ts: now });
    store.push('log', { by: me, text: `picked you a ${fl[1].toLowerCase()} ${fl[0]} from the garden 💐`, ts: now });
    return toast(`💐 Sent to ${esc(called(other))}!`);
  }
  const rm = how === 'vase' ? 'living' : view;
  store.push(`spaces/${rm}/items`, { t: 'emoji', v: '💐', s: 0.8, x: how === 'vase' ? +rand(70, 100).toFixed(1) : +clamp(S.avatars[me]?.x ?? 50, 8, roomW() - 8).toFixed(1), y: how === 'vase' ? 60 : +clamp((S.avatars[me]?.y ?? 80) + 2, 62, 96).toFixed(1), by: me, ts: now });
  toast(how === 'vase' ? '🏺 Your flowers are in the living room' : '💐 Put down here');
}

// ♟️ sit at a table when a game starts (if there's a free chair here)
function sitForGame() {
  if (S.avatars[me]?.seat) return;
  const chair = Object.entries(S.items).find(([id, i]) => i.k === 'chair' && freeSeat(id) >= 0);
  if (!chair) return;
  const pos = seatPos(chair[0], 0);
  store.update(`avatars/${me}`, { seat: { id: chair[0], i: 0 }, x: pos.x, y: pos.y });
}

// ── 💬 Floating chat bubble (works over games too) ──────────
let bubOpen = false;
function setupBubble() {
  const bub = $('#chatbub');
  bub.hidden = false;
  let pos = null;
  try { pos = JSON.parse(lsGet('ourroom:bub')); } catch {}
  const place = (x, y) => {
    x = clamp(x, 6, innerWidth - 62); y = clamp(y, 60, innerHeight - 130);
    bub.style.left = x + 'px'; bub.style.top = y + 'px';
    bub._x = x; bub._y = y;
    if (bubOpen) placeMini();
  };
  place(pos?.x ?? innerWidth - 70, pos?.y ?? innerHeight * 0.55);
  let d = null;
  bub.addEventListener('pointerdown', e => { e.preventDefault(); try { bub.setPointerCapture(e.pointerId); } catch {} d = { x: e.clientX, y: e.clientY, bx: bub._x, by: bub._y, moved: false }; });
  bub.addEventListener('pointermove', e => {
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 7) return;
    d.moved = true;
    place(d.bx + e.clientX - d.x, d.by + e.clientY - d.y);
  });
  const up = () => {
    if (!d) return;
    const moved = d.moved; d = null;
    if (moved) { lsSet('ourroom:bub', JSON.stringify({ x: bub._x, y: bub._y })); return; }
    unlockAudio();
    toggleMini(!bubOpen);
  };
  bub.addEventListener('pointerup', up);
  bub.addEventListener('pointercancel', () => { d = null; });
  addEventListener('resize', () => place(bub._x, bub._y));
  renderBubble();
}
function renderBubble() {
  const bub = $('#chatbub'); if (!bub || !other) return;
  const p = prof(other);
  setFace($('.cb-face', bub), other);
  bub.style.setProperty('--c', p.color);
  bub.hidden = panel === 'chat';
  const n = unread('chat'), badge = $('.badge', bub);
  badge.hidden = !n; badge.textContent = n > 9 ? '9+' : n;
  bub.classList.toggle('online', isOnline(other));
  if (bubOpen) renderMini();
}
function toggleMini(on) {
  bubOpen = on;
  $('#minichat').hidden = !on;
  if (on) { const l = $('#minichat .mini-list'); if (l) l.dataset.n = 0; renderMini(true); markRead('chat'); setTimeout(() => $('#mini-input')?.focus(), 50); }
}
function placeMini() {
  const bub = $('#chatbub'), box = $('#minichat');
  const w = Math.min(320, innerWidth - 16);
  box.style.width = w + 'px';
  const left = clamp(bub._x + 28 - w / 2, 8, innerWidth - w - 8);
  box.style.left = left + 'px';
  const h = box.offsetHeight || 190;
  const above = bub._y - h - 10;
  box.style.top = (above > 50 ? above : bub._y + 64) + 'px';
}
// The card is built once; new messages only refresh the list (so the keyboard never closes while typing)
function renderMini() {
  const box = $('#minichat'); if (!box || box.hidden) return;
  if (!box.firstChild) {
    box.innerHTML = `<div class="mini-head"><span class="pface"></span><b></b><button class="mini-btn" data-mini="full" aria-label="Open full chat">↗</button><button class="mini-btn" data-mini="close" aria-label="Close">✕</button></div>
      <div class="mini-list"></div><button class="mini-new" data-mini="bottom" hidden>↓ New message</button><div class="typing"></div>
      <form class="chat-form" id="mini-form"><input class="field" id="mini-input" placeholder="Message…" autocomplete="off" maxlength="1000" enterkeyhint="send"><button class="send" aria-label="Send">➤</button></form>`;
    const inp = $('#mini-input');
    $('#mini-form').addEventListener('submit', e => { e.preventDefault(); sendChat(inp.value); inp.value = ''; inp.focus(); });
    inp.addEventListener('input', onTyping);
    const list = $('.mini-list', box);
    list.addEventListener('scroll', () => { if (list.scrollHeight - list.scrollTop - list.clientHeight < 24) $('.mini-new', box).hidden = true; });
  }
  const p = prof(other), face = $('.mini-head .pface', box);
  setFace(face, other); face.style.setProperty('--c', p.color);
  $('.mini-head b', box).textContent = called(other);
  const list = $('.mini-list', box), last = S.msgs.slice(-150);
  const atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 24, prevN = +list.dataset.n || 0;
  list.innerHTML = last.length ? last.map(m => `<div class="msg ${m.by === me ? 'mine' : 'theirs'} ${JUMBO.test(m.text) && [...m.text].length <= 8 ? 'jumbo' : ''}">${m.by !== me && m.by !== other ? `<small class="who">${esc(called(m.by))}</small>` : ''}${esc(m.text)}<time>${fmtTime(m.ts)}</time></div>`).join('') : '<div class="empty">Say hi 👋</div>';
  list.dataset.n = last.length;
  if (atEnd || !prevN || last.length < prevN) list.scrollTop = list.scrollHeight;
  else if (last.length > prevN) $('.mini-new', box).hidden = false;
  const t = S.typing[other];
  $('.typing', box).textContent = t && store.now() - t < 5000 ? `${called(other)} is typing…` : '';
  placeMini();
  markRead('chat');
}

// ── Global click routing ─────────────────────────────────────
function route(d, t) {
  if (kitchen?.route(d)) return;
  if (pet?.route(d)) return;
  if (vmail?.route(d)) return;
  if (d.action === 'pet') { closePanel(); return pet?.openMain(); }
  if (d.tv) return tv?.act(d.tv);
  if (d.mini === 'close') return toggleMini(false);
  if (d.mini === 'bottom') { const l = $('#minichat .mini-list'); if (l) l.scrollTop = l.scrollHeight; t.hidden = true; return; }
  if ('visitYes' in d || 'visitNo' in d) return letVisitorIn('visitYes' in d);
  if ('visitCreate' in d) return createVisitLink(false);
  if ('visitRenew' in d) { if (confirm('Make a new visitor link? The old link will stop working.')) createVisitLink(true); return; }
  if ('shareVisit' in d) {
    const url = visitLink(S.visit.code);
    if (navigator.share) navigator.share({ title: 'Come visit us!', text: 'Come visit our home 🏠👋', url }).catch(() => {});
    else navigator.clipboard?.writeText(url).then(() => toast('Link copied 📋'), () => toast('Copy the link from the box above'));
    return;
  }
  if ('visitKnock' in d) return knock();
  if ('visitKnockAgain' in d) return knock();
  if ('visitAgain' in d) return gstore.once('').then(showVisitorSetup);
  if ('visitLeave' in d) return leaveAsVisitor();
  if (d.mini === 'full') { toggleMini(false); hideOverlay(); return openPanel('chat'); }
  if (games?.route(d, t)) return;
  if ('moodOpen' in d) { hideEmotebar(); return showMood(); }
  if (d.moodPick) { $$('[data-mood-pick]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if ('moodSave' in d || 'moodClear' in d) {
    const e = $('[data-mood-pick].on')?.dataset.moodPick;
    const txt = ($('#mood-text')?.value || '').trim().slice(0, 40);
    store.update(`profiles/${me}`, { mood: 'moodClear' in d || !e ? null : { e, t: txt || null, ts: store.now() } });
    hideOverlay(); sfx.pop(); if (panel === 'profile') renderProfilePanel(); return;
  }
  if (d.plant) return plantFlower(d.plant);
  if (d.plantPick) { const [bed, i] = d.plantPick.split(':'); return showPlantChoice(bed, +i); }
  if (d.water) return waterBed(d.water);
  if (d.pickFlower) return pickFlower(d.pickFlower);
  if (d.bouquet) return placeBouquet(d.bouquet);
  if (d.goRoom) { hideOverlay(); return goThroughDoor(d.goRoom); }
  if ('close' in d) return closePanel();
  if ('dpPick' in d) return pickDP();
  if ('dpRemove' in d) { store.remove(`pics/${me}`); return toast('Back to your emoji face 🙂'); }
  if ('fold' in d) { const dk = $('#dock'); dk.classList.toggle('folded'); t.textContent = dk.classList.contains('folded') ? '▴' : '▾'; return; }
  if (d.panel) return openPanel(d.panel);
  if (d.action === 'call') return onCallButton();
  if (d.zoom) {
    if (d.zoom === 'me') { cam.z = 1; layoutWorld(); const m = avatarEl(me); return centerOn(m?._x ?? 50, m?._y ?? 72); }
    return zoomAt(cam.z * (d.zoom === 'in' ? 1.25 : 0.8));
  }
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
  if (d.pick !== undefined || d.pickHat !== undefined) {
    const sel = d.pick !== undefined ? '[data-pick]' : '[data-pick-hat]';
    $$(sel, t.parentElement).forEach(x => x.classList.remove('on')); t.classList.add('on'); return;
  }
  if (d.pickColor) {
    const box = t.closest('.swatches');
    let btn = $(`button[data-pick-color="${d.pickColor}"]`, box);
    if (!btn) { btn = document.createElement('button'); btn.className = 'sw'; btn.dataset.pickColor = d.pickColor; btn.style.background = d.pickColor; box.prepend(btn); }
    $$('.sw', box).forEach(x => x.classList.remove('on')); btn.classList.add('on'); return;
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
  if ('nickOpen' in d) { hideEmotebar(); return showNickCard(); }
  if (d.nickIdea) { $('#nick-input').value = d.nickIdea; return; }
  if ('nickSave' in d || 'nickClear' in d) {
    const v = 'nickClear' in d ? '' : $('#nick-input').value.trim().slice(0, 24);
    store.update('nicks', { [other]: v || null });
    if (v) { store.push('log', { by: me, text: `gave you a new nickname: “${v}” 🏷️`, ts: store.now() }); toast(`🏷️ ${esc(prof(other).name)} is now <b>${esc(v)}</b>`); }
    hideOverlay();
    if (panel === 'profile') renderProfilePanel();
    return;
  }
  if (d.emote) return sendEmote(d.emote);
  if (d.bonk) return tryBonk(d.bonk);
  if (d.kick) return tryKick(d.kick);
  if (d.item) return itemAction(d.item);
  if (d.itemColor) { if (S.items[selectedItem]) store.update(`${sp()}/items/${selectedItem}`, { c: d.itemColor }); return; }
  if (d.itemFrame) { if (S.items[selectedItem]) store.update(`${sp()}/items/${selectedItem}`, { f: d.itemFrame }); return; }
  if (d.tab) { decoTab = d.tab; $$('.tabs .chip').forEach(c => c.classList.toggle('on', c.dataset.tab === decoTab)); return renderDecoBody(); }
  if (d.set) return setLook(d.set, d.val);
  if (d.lookWall) return setLook('wall', d.lookWall);
  if (d.lookFloor) return setLook('floor', d.lookFloor);
  if (d.lookRug) return setLook('rug', d.lookRug);
  if (d.lookCur) return setLook('cur', d.lookCur);
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
  if (d.textInk) { textInk = d.textInk; return markSwatch(t, 'data-text-ink'); }
  if (d.tool) { tool = d.tool; return renderDrawPanel(); }
  if (d.ink) { ink = d.ink; return markSwatch(t, 'data-ink'); }
  if (d.brush) { brush = +d.brush; $$('[data-brush]').forEach(x => x.classList.toggle('on', x === t)); return; }
  if ('undo' in d) return undoStroke();
  if ('wipe' in d) return clearWall();
  if (d.quick) return sendChat(d.quick);
  if (d.noteColor) { noteColor = d.noteColor; return markSwatch(t, 'data-note-color'); }
  if ('pin' in d) return pinNote();
  if (d.delNote) { if (confirm('Remove this note?')) store.remove(`notes/${d.delNote}`); return; }
  if ('accept' in d) return call.join();
  if ('decline' in d) return call.decline();
  if ('hangup' in d) return call.hangup();
  if ('mute' in d) { muted = call.mute(); t.textContent = muted ? '🔇' : '🎙️'; return; }
}
function markSwatch(t, attr) {
  const box = t.closest('.swatches'); if (!box) return;
  $$(`[${attr}]`, box).forEach(x => x.classList.toggle('on', x === t));
}

document.addEventListener('click', e => {
  const t = e.target.closest('button'); if (!t) return;
  unlockAudio();
  route(t.dataset, t);
});
// 🌈 "any color" pickers: behave like tapping a swatch of that color
document.addEventListener('change', e => {
  const inp = e.target;
  if (inp.type !== 'color' || !inp.dataset.custom) return;
  const key = inp.dataset.custom.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  route({ [key]: inp.value }, inp);
});

const CLOSABLE = ['tips', 'summary', 'photo', 'rooms', 'nick', 'tv', 'mood', 'bed', 'bouquet', 'chess', 'doodle'];
const canClose = () => overlayMode && (CLOSABLE.includes(overlayMode) || kitchen?.CLOSABLE.includes(overlayMode) || pet?.CLOSABLE.includes(overlayMode) || overlayMode === 'vmail');
$('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay' && canClose()) hideOverlay(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && canClose()) hideOverlay(); });

$('#photo-input').addEventListener('change', e => { const f = e.target.files?.[0]; e.target.value = ''; addPhoto(f); });
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'text-input') { e.preventDefault(); addText(); }
  if (e.key === 'Enter' && e.target.id === 'join-input') $('[data-join-room]')?.click();
  if (e.key === 'Enter' && e.target.id === 'nick-input') $('[data-nick-save]')?.click();
  if (e.key === 'Enter' && e.target.id === 'tv-url') tv?.act('start');
});
addEventListener('resize', () => { positionItembar(); if (emoteTarget) positionEmotebar(); });
