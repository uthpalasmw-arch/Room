// 🐾 Pet: adopt, name, cuddle, feed, play. It wanders, naps on furniture, gets hungry and grows up — but never dies.
// Both phones compute the same behaviour from the shared pet record + time, so the pet stays in sync without constant writes.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;

export const PET_TYPES = {
  cat: { n: 'Cat', e: '🐱', love: 'purrs', sound: 'Purrr… 💕' },
  dog: { n: 'Dog', e: '🐶', love: 'wags', sound: 'Woof! 💕' },
  bunny: { n: 'Bunny', e: '🐰', love: 'binkies', sound: '*happy hop* 💕' },
  hamster: { n: 'Hamster', e: '🐹', love: 'squeaks', sound: 'Squeak! 💕' },
};
const PATTERNS = [['plain', 'Plain'], ['spots', 'Spots'], ['stripes', 'Stripes'], ['patch', 'Patch']];
const ACCS = [['none', 'None'], ['collar', '🔴 Collar'], ['bow', '🎀 Bow'], ['bandana', '🔷 Bandana']];
const FUR = ['#f4a261', '#ffd6a5', '#ffffff', '#b0b0b8', '#6d6875', '#2b2d42', '#8d5a3b', '#c8875a', '#ffb703', '#ff99c8', '#c77dff', '#90dbf4'];
const FUR2 = ['#8d5a3b', '#2b2d42', '#ffffff', '#6d6875', '#f4a261', '#ffb703', '#ff5fa2', '#7b5cff'];
const NAMES = ['Mochi', 'Biscuit', 'Peanut', 'Coco', 'Muffin', 'Pumpkin', 'Oreo', 'Kiri', 'Luna', 'Toffee', 'Nugget', 'Bubbles'];

const HUNGER_MS = 10 * HOUR;        // full → empty
const JOY_MS = 16 * HOUR;           // happy → mopey
const CYCLE = 20 * MIN;             // one nap per cycle
const NAP = { baby: 9 * MIN, young: 7 * MIN, adult: 5 * MIN };
const SLOT = 8000;                  // a new little activity every 8 seconds
const ZONE = 6;                     // slots spent roaming one part of the room
const ACT_MS = { cuddle: 5000, feed: 6000, treat: 3500, play: 8000, call: 20000, sleep: 10 * MIN, bye: 4000, dish: 6500, trick: 3800 };
const ROAM = 30 * MIN;              // it may wander to another room every half hour…
const STAY = 30 * MIN;              // …but stays put for a while after you call it somewhere
// Tricks it learns as it grows up
const TRICKS = [
  ['sit', '🪑', 'Sit', 'baby'], ['spin', '🌀', 'Spin', 'baby'], ['paw', '✋', 'High-five', 'young'],
  ['roll', '🔄', 'Roll over', 'young'], ['dead', '💫', 'Play dead', 'adult'], ['dance', '🎵', 'Dance', 'adult'],
];
const STAGE_N = { baby: 0, young: 1, adult: 2 };
const AGE = { young: 3 * DAY, adult: 10 * DAY };
const SCALE = { baby: .68, young: .84, adult: 1 };
const STAGE_NAME = { baby: 'Baby', young: 'Young', adult: 'Grown up' };
// Where a pet can curl up: height above the item's bottom (room units)
const NAP_ON = { sofa: 1, bed: 1, beanbag: 1, chair: 1, gbench: 1, tv: 29, shelf: 34 };

// Deterministic randomness so both phones agree
function rnd(...parts) {
  let h = 2166136261;
  for (const c of parts.join('|')) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5;
  return ((h >>> 0) % 100000) / 100000;
}

// ── Drawing ─────────────────────────────────────────────────
let uidN = 0;
const EYE = (x, y) => `<ellipse class="pet-eye pet-pt" cx="${x}" cy="${y}" rx="2.6" ry="3.2" fill="#2b1d2b"/><circle class="pet-eye pet-pt" cx="${x + .9}" cy="${y - 1.2}" r=".9" fill="#fff"/>
  <path class="pet-heye" d="M${x - 3} ${y + 1} q3 -4 6 0" stroke="#2b1d2b" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
const LEGS = (xs, y, h, w = 7) => `<g class="pet-legs">${xs.map((x, i) => `<rect class="pet-pt ${i % 2 ? 'pet-lb' : 'pet-la'}" x="${x}" y="${y}" width="${w}" height="${h}" rx="3.5" fill="var(--pc1)"/>`).join('')}</g>`;
function pattern(id, kind) {
  if (kind === 'spots') return `<g clip-path="url(#${id})" fill="var(--pc2)"><circle cx="45" cy="60" r="6"/><circle cx="62" cy="70" r="4.5"/><circle cx="75" cy="58" r="5"/><circle cx="36" cy="72" r="3.5"/></g>`;
  if (kind === 'stripes') return `<g clip-path="url(#${id})" stroke="var(--pc2)" stroke-width="4" stroke-linecap="round" fill="none">${[36, 48, 60, 72].map(x => `<path d="M${x} 44 q-3 10 0 20"/>`).join('')}</g>`;
  if (kind === 'patch') return `<g clip-path="url(#${id})" fill="var(--pc2)"><ellipse cx="44" cy="58" rx="13" ry="10"/></g>`;
  return '';
}
function accessory(kind, x, y, bow = [0, -30]) {
  if (kind === 'collar') return `<path d="M${x - 9} ${y - 3} q9 8 18 0" stroke="#e63946" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${x}" cy="${y + 3}" r="2.6" fill="#ffd60a"/>`;
  if (kind === 'bow') return `<g transform="translate(${x + bow[0]} ${y + bow[1]})"><path d="M0 0 l-8 -5 v10 z M0 0 l8 -5 v10 z" fill="#ff5fa2"/><circle r="2.4" fill="#ff4d6d"/></g>`;
  if (kind === 'bandana') return `<path d="M${x - 10} ${y - 3} q10 6 20 0 l-10 11 z" fill="#4f8cff"/>`;
  return '';
}
const BLUSH = (x, y, rx = 3, ry = 1.8) => `<ellipse class="pet-blush" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff8fab"/>`;
const BODY = {
  cat: (p, a, id) => `
    <path class="pet-tail pet-pt" d="M32 66 C18 62 12 44 20 32 C24 26 30 30 26 36 C20 46 26 56 36 60" fill="var(--pc1)"/>
    ${LEGS([38, 48, 66, 76], 70, 16, 7)}
    <g class="pet-bodyg pet-pt"><clipPath id="${id}"><ellipse cx="57" cy="64" rx="27" ry="15"/></clipPath>
      <ellipse cx="57" cy="64" rx="27" ry="15" fill="var(--pc1)"/>${pattern(id, p)}<ellipse cx="62" cy="72" rx="13" ry="5" fill="#fff" opacity=".3"/></g>
    <g class="pet-head pet-pt">
      <path class="pet-earl pet-pt" d="M76 38 L80 20 L90 34 Z" fill="var(--pc1)"/><path class="pet-ear pet-pt" d="M92 34 L102 20 L104 40 Z" fill="var(--pc1)"/>
      <path d="M79 33 L81 25 L86 32 Z M95 33 L101 25 L101 36 Z" fill="#ffb3c7"/>
      <circle cx="90" cy="46" r="15" fill="var(--pc1)"/>${EYE(85, 44)}${EYE(96, 44)}${BLUSH(82, 51)}${BLUSH(99, 51)}
      <path class="pet-nose pet-pt" d="M89 49 h3 l-1.5 2 z" fill="#ff6b8b"/>
      <path d="M90.5 51 q-2 3 -4 1 M90.5 51 q2 3 4 1" stroke="#2b1d2b" stroke-width="1" fill="none"/>
      <path d="M100 50 h10 M100 52 l9 3 M81 50 h-10 M81 52 l-9 3" stroke="#2b1d2b" stroke-width=".7" opacity=".5"/>
      ${accessory(a, 88, 60)}</g>`,
  dog: (p, a, id) => `
    <path class="pet-tail pet-pt" d="M30 60 C22 56 18 46 22 38 C24 34 28 36 27 40 C25 46 28 52 34 56 Z" fill="var(--pc1)"/>
    ${LEGS([36, 46, 66, 76], 68, 18, 8)}
    <g class="pet-bodyg pet-pt"><clipPath id="${id}"><ellipse cx="57" cy="62" rx="28" ry="16"/></clipPath>
      <ellipse cx="57" cy="62" rx="28" ry="16" fill="var(--pc1)"/>${pattern(id, p)}<ellipse cx="62" cy="71" rx="14" ry="5" fill="#fff" opacity=".3"/></g>
    <g class="pet-head pet-pt">
      <circle cx="88" cy="44" r="16" fill="var(--pc1)"/>
      <ellipse cx="101" cy="50" rx="9" ry="7" fill="var(--pc1)"/><ellipse cx="102" cy="52" rx="7" ry="5" fill="#fff" opacity=".45"/>
      <ellipse class="pet-nose pet-pt" cx="108" cy="47" rx="3.2" ry="2.5" fill="#2b1d2b"/>
      <path d="M104 54 q-3 3 -6 1" stroke="#2b1d2b" stroke-width="1.1" fill="none"/><path class="pet-tongue" d="M100 57 q1 5 4 3" fill="#ff6b8b"/>
      ${EYE(84, 42)}${EYE(95, 41)}${BLUSH(82, 49)}
      <path class="pet-ear pet-pt" d="M76 34 C68 36 66 50 72 56 C76 52 78 44 80 36 Z" fill="var(--pc2)"/>
      ${accessory(a, 86, 60)}</g>`,
  bunny: (p, a, id) => `
    <circle class="pet-tail pet-pt" cx="30" cy="62" r="7" fill="#fff"/>
    <g class="pet-legs"><ellipse class="pet-pt pet-la" cx="44" cy="80" rx="12" ry="5" fill="var(--pc1)"/><rect class="pet-pt pet-lb" x="70" y="72" width="7" height="12" rx="3.5" fill="var(--pc1)"/></g>
    <g class="pet-bodyg pet-pt"><clipPath id="${id}"><ellipse cx="54" cy="64" rx="24" ry="18"/></clipPath>
      <ellipse cx="54" cy="64" rx="24" ry="18" fill="var(--pc1)"/>${pattern(id, p)}<ellipse cx="60" cy="72" rx="12" ry="7" fill="#fff" opacity=".3"/></g>
    <g class="pet-head pet-pt">
      <ellipse class="pet-earl pet-pt" cx="78" cy="22" rx="5" ry="16" fill="var(--pc1)" transform="rotate(-12 78 22)"/>
      <g class="pet-ear pet-pt"><ellipse cx="90" cy="20" rx="5" ry="16" fill="var(--pc1)"/><ellipse cx="90" cy="20" rx="2.4" ry="12" fill="#ffb3c7"/></g>
      <circle cx="84" cy="46" r="14" fill="var(--pc1)"/>${EYE(80, 44)}${EYE(90, 44)}${BLUSH(77, 51)}${BLUSH(94, 51)}
      <path class="pet-nose pet-pt" d="M84 49 h3 l-1.5 2 z" fill="#ff6b8b"/>
      <rect x="84" y="53" width="3.2" height="3" rx=".6" fill="#fff" stroke="#2b1d2b" stroke-width=".5"/>
      ${accessory(a, 84, 58)}</g>`,
  hamster: (p, a, id) => `
    <g class="pet-legs"><ellipse class="pet-pt pet-la" cx="48" cy="82" rx="5" ry="3" fill="#ffb3c7"/><ellipse class="pet-pt pet-lb" cx="70" cy="82" rx="5" ry="3" fill="#ffb3c7"/></g>
    <g class="pet-tail pet-pt"><circle cx="34" cy="70" r="2.5" fill="#ffb3c7"/></g>
    <g class="pet-bodyg pet-pt"><clipPath id="${id}"><ellipse cx="58" cy="64" rx="26" ry="20"/></clipPath>
      <ellipse cx="58" cy="64" rx="26" ry="20" fill="var(--pc1)"/>${pattern(id, p)}<ellipse cx="66" cy="72" rx="15" ry="10" fill="#fff" opacity=".55"/></g>
    <g class="pet-head pet-pt">
      <circle class="pet-earl pet-pt" cx="66" cy="44" r="5" fill="var(--pc1)"/>
      <g class="pet-ear pet-pt"><circle cx="80" cy="44" r="5" fill="var(--pc1)"/><circle cx="80" cy="44" r="2.6" fill="#ffb3c7"/></g>
      ${EYE(70, 54)}${EYE(80, 54)}${BLUSH(67, 61, 4, 2.4)}${BLUSH(84, 61, 4, 2.4)}
      <ellipse class="pet-nose pet-pt" cx="76" cy="59" rx="1.8" ry="1.3" fill="#ff6b8b"/>
      ${accessory(a, 74, 72, [-6, -30])}</g>`,
};
const BOWL = `<g class="pet-bowl"><path d="M100 84 h22 l-3 7 h-16 z" fill="#4f8cff"/><circle cx="106" cy="83" r="2" fill="#8d5a3b"/><circle cx="111" cy="82" r="2" fill="#8d5a3b"/><circle cx="116" cy="83" r="2" fill="#8d5a3b"/></g>`;
export function petSVG(p) {
  const id = 'petclip' + (++uidN);
  return `<svg class="pet-svg" viewBox="0 0 130 92" aria-hidden="true">${(BODY[p.type] || BODY.cat)(p.pat, p.acc, id)}${BOWL}</svg>`;
}
const petVars = p => `--pc1:${p.c1};--pc2:${p.c2}`;

// ── The pet module ──────────────────────────────────────────
export function initPet(ctx) {
  const { $, esc, sfx, store } = ctx;
  let P = null;                     // the shared pet record
  let el = null, bar = null, lastAct = 0, actInit = false, drawnKey = '', started = Date.now();
  let welcome = null;               // local wake-up greeting when you come home to a sleeping pet
  let scaredUntil = 0, draft = null, editing = false;

  const now = () => store.now();
  const seed = () => String(P?.born || 0);
  const full = (t = now()) => clamp(Math.round((P.food ?? 80) - (t - (P.foodAt || t)) / HUNGER_MS * 100), 0, 100);
  const joy = (t = now()) => clamp(Math.round((P.joy ?? 80) - (t - (P.joyAt || t)) / JOY_MS * 100), 0, 100);
  const ageMs = (t = now()) => t - P.born + (P.care || 0) * HOUR;
  const stage = (t = now()) => ageMs(t) >= AGE.adult ? 'adult' : ageMs(t) >= AGE.young ? 'young' : 'baby';
  const name = () => P?.name || 'your pet';
  const act = t => (P?.act && t - P.act.ts < (ACT_MS[P.act.k] || 0) && t >= P.act.ts - 2000) ? P.act : null;
  // Which room it's in: where it was put for a while, then it roams — usually to wherever someone is.
  function room(t = now()) {
    if (!P) return null;
    if (t - (P.rmAt || 0) < STAY || act(t)) return P.rm;
    const block = Math.floor(t / ROAM), s = seed(), rooms = ctx.rooms();
    const home = ['a', 'b'].filter(id => (id === ctx.me() || ctx.isOnline(id)) && rooms.includes(ctx.roomOf(id))).sort();
    if (home.length && rnd(s, 'follow', block) < .7) return ctx.roomOf(home[Math.floor(rnd(s, 'whom', block) * home.length)]);
    if (rnd(s, 'stay', block) < .35) return P.rm;
    return rooms[Math.floor(rnd(s, 'room', block) * rooms.length)];
  }
  const knows = tr => STAGE_N[stage()] >= STAGE_N[tr[3]];

  // Places to curl up in the current room
  function napSpots() {
    const spots = [];
    for (const [id, it] of Object.entries(ctx.items())) {
      if (it.t !== 'furn' || !(it.k in NAP_ON)) continue;
      if (it.k === 'shelf' && P.type === 'hamster') continue;
      const sc = it.s || 1, flip = it.fl ? -1 : 1, z = ctx.itemZ(it) + 2;
      if (it.k === 'tv' || it.k === 'shelf') { spots.push({ id, x: it.x, y: it.y - NAP_ON[it.k] * sc * ctx.UPCT, z }); continue; }
      const face = it.face || 'front';
      if (it.k === 'sofa' && face === 'back') { spots.push({ id, x: it.x + 10 * sc * flip, y: it.y - 18 * sc * ctx.UPCT, z }); continue; }
      const set = ctx.SEATS[it.k]?.[face] || ctx.SEATS[it.k]?.front || [[0, 5]];
      set.forEach(([dx, up]) => spots.push({ id, x: it.x + dx * sc * flip, y: it.y - up * sc * ctx.UPCT, z: ctx.itemZ(it) + 61 }));
    }
    return spots.length ? spots : [{ id: 'floor', x: ctx.roomW() * .3, y: 90, z: 902 }];
  }
  const floorPt = (a, b) => ({ x: 12 + a * (ctx.roomW() - 24), y: 70 + b * 25 });
  function napInfo(t) {
    const st = stage(t), len = NAP[st];
    const cyc = Math.floor(t / CYCLE);
    const startOf = c => c * CYCLE + rnd(seed(), 'nap', c) * (CYCLE - len);
    const s0 = startOf(cyc);
    if (t >= s0 && t < s0 + len) return { asleep: true, since: s0, len, cyc };
    const lastEnd = t < s0 ? startOf(cyc - 1) + len : s0 + len;
    return { asleep: false, awakeFor: t - lastEnd, cyc };
  }
  function energy(t = now()) {
    const a = act(t);
    if (a?.k === 'sleep') return clamp(Math.round(40 + 60 * (t - a.ts) / (4 * MIN)), 40, 100);
    const n = napInfo(t);
    if (n.asleep) return clamp(Math.round(40 + 60 * (t - n.since) / n.len), 40, 100);
    return clamp(Math.round(100 - n.awakeFor / CYCLE * 75), 20, 100);
  }
  const napSpot = key => { const s = napSpots(); return s[Math.floor(rnd(seed(), 'spot', key) * s.length)]; };
  const nearAvatar = (id, side = 1) => {
    const a = ctx.avatarEl(id);
    if (!a || a._x == null) return null;
    return { x: clamp(a._x + side * 10, 8, ctx.roomW() - 8), y: clamp(a._y + .5, 55, 97), z: Math.round(a._y * 10) + 3 };
  };

  // What the pet is doing at time t → { mode, x, y, z?, bubble? }
  function brain(t) {
    const a = act(t);
    if (a) {
      const el0 = t - a.ts;
      if (a.k === 'sleep') { const s = napSpot('forced' + a.ts); return { mode: 'sleep', ...s }; }
      if (a.k === 'play') return el0 < 3600 ? { mode: 'run', x: a.bx, y: a.by } : { mode: 'happy', x: a.x, y: a.y };
      if (a.k === 'feed' || a.k === 'treat') return { mode: 'eat', x: a.x, y: a.y, z: a.z };
      if (a.k === 'dish') return { mode: el0 < 1500 ? 'happy' : 'dish', x: a.x, y: a.y, z: a.z, left: false };
      if (a.k === 'trick') return { mode: 'trick', trick: a.t, x: a.x, y: a.y, z: a.z };
      if (a.k === 'bye') return { mode: 'happy', x: a.x, y: a.y, z: a.z };
      return { mode: el0 < 5000 ? 'happy' : 'sit', x: a.x, y: a.y, z: a.z };
    }
    if (welcome && Date.now() < welcome.until) return welcome.state();
    const n = napInfo(t);
    if (n.asleep) return { mode: 'sleep', ...napSpot(n.cyc) };
    const slot = Math.floor(t / SLOT), zone = Math.floor(slot / ZONE), s = seed();
    const base = floorPt(rnd(s, 'zx', zone), rnd(s, 'zy', zone));
    const off = { x: clamp(base.x + (rnd(s, 'ox', slot) - .5) * 40, 10, ctx.roomW() - 10), y: clamp(base.y + (rnd(s, 'oy', slot) - .5) * 12, 68, 96) };
    const r = rnd(s, 'r', slot), f = full(t), j = joy(t);
    if (f < 20 && r < .6) return { mode: 'beg', ...base, bubble: '🍖' };
    if (j < 20 && r < .5) return { mode: 'mope', ...base, bubble: '💧' };
    if (r < .2) {   // go say hi to someone who's here
      const here = ['a', 'b', 'v'].filter(id => (id === ctx.me() || ctx.isOnline(id)) && ctx.roomOf(id) === room(t) && ctx.avatarEl(id));
      const who = here[Math.floor(rnd(s, 'who', slot) * here.length)];
      const pos = who && nearAvatar(who, rnd(s, 'side', slot) < .5 ? -1 : 1);
      if (pos) return { mode: 'sit', ...pos };
    }
    if (r < .35) {  // sniff something
      const its = Object.values(ctx.items()).filter(i => i.t === 'furn' || i.t === 'emoji' || i.t === 'food');
      const it = its[Math.floor(rnd(s, 'sniff', slot) * its.length)];
      if (it) return { mode: 'sniff', x: clamp(it.x + (rnd(s, 'sx', slot) < .5 ? -8 : 8), 10, ctx.roomW() - 10), y: clamp(it.y + 3, 68, 97) };
    }
    if (r < .55) return { mode: 'sit', ...off };
    if (r < .7) return { mode: 'groom', ...off };
    if (r < .8) return { mode: 'stretch', ...off };
    return { mode: 'idle', ...off };
  }

  // ── Rendering ─────────────────────────────────────────────
  function ensureEl() {
    const key = P ? [P.type, P.c1, P.c2, P.pat, P.acc].join() : '';
    if (el && drawnKey === key) return el;
    el?.remove();
    el = document.createElement('div');
    el.className = 'pet-sprite';
    el.innerHTML = `<div class="pet-shadow"></div>${petSVG(P)}<div class="pet-bub"></div><div class="pet-name"></div>`;
    $('#avatars').append(el);
    drawnKey = key; el._x = null;
    return el;
  }
  let lastRm = null;
  function drop() { el?.remove(); el = null; drawnKey = ''; hideBar(); }
  function render(reset = false) {
    const t = now(), rm = P && room(t), was = lastRm;
    lastRm = rm;
    if (reset && el?._leaving) drop();
    if (!P) return drop();
    if (rm !== ctx.view()) {
      if (el && !el._leaving && !reset && was === ctx.view() && el._x != null) leave(rm);
      else if (!el?._leaving) drop();
      return;
    }
    if (el?._leaving) drop();
    const entering = !reset && was && was !== rm && !el;
    ensureEl();
    if (reset) el._x = null;
    if (entering) {   // trots in through the door
      const d = ctx.doorSpot(rm);
      el.style.transition = 'none'; el.style.left = ctx.ux(d.x); el.style.top = d.y + '%';
      el._x = d.x; el._y = d.y; void el.offsetWidth;
    }
    const b = brain(t), st = stage(t);
    let mode = b.mode;
    if (Date.now() < scaredUntil && mode !== 'sleep') mode = 'scared';
    el.style.setProperty('--pc1', P.c1); el.style.setProperty('--pc2', P.c2); el.style.setProperty('--ps', SCALE[st]);
    const moved = el._x == null || Math.abs(el._x - b.x) > .4 || Math.abs(el._y - b.y) > .4;
    if (moved) {
      if (el._x == null) { el.style.transition = 'none'; }
      else {
        const dist = Math.hypot(b.x - el._x, (b.y - el._y) / ctx.UPCT);
        const speed = mode === 'run' ? 34 : mode === 'happy' ? 24 : 14;
        const dur = clamp(dist / speed, .35, 8);
        el.style.transition = `left ${dur}s linear, top ${dur}s linear`;
        el.classList.toggle('pet-left', b.x < el._x);
        el._walkUntil = Date.now() + dur * 1000;
      }
      el._x = b.x; el._y = b.y;
      el.style.left = ctx.ux(b.x); el.style.top = b.y + '%';
    }
    const walking = Date.now() < (el._walkUntil || 0) && mode !== 'run';
    if (!walking && b.left != null) el.classList.toggle('pet-left', b.left);
    el.style.zIndex = b.z ?? Math.round(b.y * 10) + 2;
    const cls = ['pet-sprite', 'pet-' + st, 'pet-m-' + (walking ? 'walk' : mode)];
    if (mode === 'trick' && !walking) cls.push('pet-t-' + b.trick);
    if (el.classList.contains('pet-left')) cls.push('pet-left');
    if (walking && mode === 'sleep') cls.push('pet-sleepy');
    if (full(t) < 25) cls.push('pet-hungry');
    if (joy(t) < 25 || full(t) < 10) cls.push('pet-sad');
    el.className = cls.join(' ');
    const bub = $('.pet-bub', el);
    const bubble = mode === 'sleep' && !walking ? '💤' : (!walking && b.bubble) || '';
    if (bub.textContent !== bubble) bub.textContent = bubble;
    $('.pet-name', el).textContent = P.name;
    if (bar && !bar.hidden) placeBar();
  }

  function leave(rm) {
    const d = ctx.doorSpot(ctx.view()), e = el;
    e._leaving = true; hideBar();
    const dur = clamp(Math.hypot(d.x - e._x, (d.y - e._y) / ctx.UPCT) / 16, .6, 7);
    e.classList.toggle('pet-left', d.x < e._x);
    e.className = e.className.replace(/pet-m-\S+/, 'pet-m-walk');
    e.style.transition = `left ${dur}s linear, top ${dur}s linear, opacity .4s ${dur}s`;
    e.style.left = ctx.ux(d.x); e.style.top = d.y + '%'; e.style.opacity = '0';
    setTimeout(() => { if (el === e) drop(); else e.remove(); }, dur * 1000 + 450);
    ctx.toast(`${PET_TYPES[P.type].e} ${esc(name())} trotted off to the ${esc(ctx.roomName(rm).toLowerCase())}`, 2600);
  }

  function onPet(v) {
    const prev = P;
    P = v && v.type ? v : null;
    if (!P) { if (prev) { el?.remove(); el = null; drawnKey = ''; hideBar(); } ctx.refresh?.(); return; }
    if (!prev && Date.now() - started < 15000 && !ctx.isOnline(ctx.other()) && room() === ctx.view() && !act(now())) startWelcome();
    const a = P.act;
    if (!actInit) { actInit = true; lastAct = a?.ts || 0; }
    else if (a && a.ts !== lastAct) { lastAct = a.ts; if (now() - a.ts < 6000) playAct(a); }
    checkGrowth();
    if (Date.now() - started > 5000) remind();
    render();
    if (ctx.overlayMode() === 'petInfo') showInfo();
  }

  // You came home and nobody else was around: the pet was asleep. It wakes up, stretches and runs over.
  function startWelcome() {
    const t0 = Date.now();
    welcome = {
      until: t0 + 7500,
      state() {
        const e = Date.now() - t0, spot = napSpot('home');
        if (e < 2500) return { mode: 'sleep', ...spot };
        if (e < 4200) return { mode: 'wake', ...spot, bubble: '🥱' };
        const pos = nearAvatar(ctx.me(), -1);
        return pos ? { mode: 'happy', ...pos, bubble: '💕' } : { mode: 'happy', ...spot };
      },
    };
  }

  function checkGrowth() {
    const key = `ourroom:petstage:${P.born}`, st = stage(), seen = ctx.lsGet(key);
    if (seen && seen !== st) ctx.toast(`🎉 <b>${esc(name())}</b> grew up! Now: ${STAGE_NAME[st]} ${PET_TYPES[P.type].e}`, 6000);
    if (seen !== st) ctx.lsSet(key, st);
  }

  function hearts(x, y, n = 5, e = ['💕', '❤️', '✨']) {
    for (let i = 0; i < n; i++) {
      const f = ctx.spawnFx(e[i % e.length], x + (Math.random() - .5) * 6, y, 12 * SCALE[stage()], 'float', { '--dx': `calc(${(Math.random() - .5) * 14} * var(--u))` });
      f.style.animationDelay = `${i * .12}s`; f.style.fontSize = 'calc(5 * var(--u))';
    }
  }
  function playAct(a) {
    if (room() !== ctx.view()) return;
    const k = a.k;
    if (k === 'cuddle') { setTimeout(() => hearts(a.x, a.y), 700); setTimeout(() => sfx.pop(), 700); }
    if (k === 'feed' || k === 'treat') { [900, 1600, 2300].forEach(ms => setTimeout(() => sfx.munch(), ms)); if (k === 'treat') setTimeout(() => hearts(a.x, a.y, 3, ['🦴', '💕']), 900); }
    if (k === 'play') throwBall(a);
    if (k === 'call') setTimeout(() => sfx.swish(), 200);
    if (k === 'bye') { hearts(a.x, a.y, 6, ['👋', '💕', '🏡']); sfx.yay(); }
    if (k === 'sleep') sfx.swish();
    if (k === 'dish') {
      [1800, 2500, 3200, 3900].forEach(ms => setTimeout(() => sfx.munch(), ms));
      setTimeout(() => hearts(a.x, a.y, 3, a.bad ? ['🤢', '💨'] : ['😋', '💕']), 2600);
    }
    if (k === 'trick') {
      const fx = { sit: ['👏'], spin: ['🌀', '✨'], paw: ['✋', '💥'], roll: ['✨', '⭐'], dead: ['💫', '😵'], dance: ['🎵', '🎶'] }[a.t] || ['✨'];
      setTimeout(() => { hearts(a.x, a.y, 4, fx); sfx.pop(); }, 900);
      setTimeout(() => sfx.yay(), 2600);
    }
  }
  function throwBall(a) {
    const ball = document.createElement('div');
    ball.className = 'pet-ball'; ball.textContent = '🎾';
    const from = ctx.avatarEl(a.by);
    const fx = from?._x ?? a.x, fy = from?._y ?? a.y;
    ball.style.left = ctx.ux(fx); ball.style.top = `calc(${fy}% - 10 * var(--u))`;
    $('#fx').append(ball);
    sfx.swish();
    requestAnimationFrame(() => requestAnimationFrame(() => { ball.style.left = ctx.ux(a.bx); ball.style.top = a.by + '%'; }));
    setTimeout(() => ball.remove(), 3600);
  }

  // ── Doing things with the pet ─────────────────────────────
  // Where the pet is on screen right now (it may be mid-walk)
  function here() {
    if (!el || el._x == null || el._leaving) return null;
    const cs = getComputedStyle(el), H = el.parentElement?.clientHeight;
    const x = parseFloat(cs.left) / ctx.U(), y = H ? parseFloat(cs.top) / H * 100 : NaN;
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : { x: el._x, y: el._y };
  }
  function doAct(k, extra = {}) {
    if (!P) return;
    const t = now(), cur = here() || brain(t);
    const upd = { care: (P.care || 0) + (k === 'sleep' ? 0 : 1), rm: room(t), rmAt: t };
    const a = { k, by: ctx.me(), ts: t, x: +cur.x.toFixed(1), y: +cur.y.toFixed(1) };
    const mine = ctx.roomOf(ctx.me());
    if (k === 'cuddle' || k === 'call') {
      upd.rm = mine;
      const pos = mine === ctx.view() ? nearAvatar(ctx.me(), -1) : null;
      if (pos) Object.assign(a, pos);
      else if (upd.rm) Object.assign(a, { x: 30, y: 85 });
    }
    if (k === 'cuddle') Object.assign(upd, { joy: Math.min(100, joy(t) + 22), joyAt: t });
    if (k === 'feed') Object.assign(upd, { food: Math.min(100, full(t) + 45), foodAt: t, joy: Math.min(100, joy(t) + 5), joyAt: t });
    if (k === 'treat') Object.assign(upd, { food: Math.min(100, full(t) + 12), foodAt: t, joy: Math.min(100, joy(t) + 12), joyAt: t });
    if (k === 'play') {
      const bx = clamp(a.x + (Math.random() < .5 ? -1 : 1) * (25 + Math.random() * 30), 12, ctx.roomW() - 12);
      Object.assign(a, { bx: +bx.toFixed(1), by: +(72 + Math.random() * 22).toFixed(1) });
      const back = nearAvatar(ctx.me(), 1);
      if (back) { a.x = back.x; a.y = back.y; a.z = back.z; }
      Object.assign(upd, { joy: Math.min(100, joy(t) + 25), joyAt: t });
    }
    if (k === 'trick') {
      a.t = extra.t;
      if (extra.t === 'paw') { const pos = nearAvatar(ctx.me(), -1); if (pos) Object.assign(a, pos); }
      Object.assign(upd, { joy: Math.min(100, joy(t) + 8), joyAt: t });
    }
    if (k === 'dish') {
      Object.assign(a, extra.pos, { v: extra.it.v, bad: extra.it.burnt || null });
      if (room(t) !== ctx.view()) Object.assign(upd, { rm: ctx.view(), rmAt: t });
      const bad = extra.it.burnt;
      Object.assign(upd, { food: Math.min(100, full(t) + (bad ? 20 : 40)), foodAt: t, joy: clamp(joy(t) + (bad ? -5 : 15), 0, 100), joyAt: t });
    }
    if (a.z == null) delete a.z;
    upd.act = a;
    welcome = null;
    store.update('pet', upd);
    hideBar();
    const n = esc(name());
    const trick = TRICKS.find(x => x[0] === extra.t);
    const lines = { trick: `taught ${n} to ${trick?.[2].toLowerCase()} ${trick?.[1]}`, dish: `shared ${esc(extra.it?.n || 'some food')} with ${n} 🍽️`, cuddle: `cuddled ${n} 🤗`, feed: `fed ${n} 🍖`, treat: `gave ${n} a treat 🦴`, play: `played ball with ${n} 🎾`, call: `called ${n} over 📣`, sleep: `tucked ${n} in for a nap 💤` };
    ctx.logAct('pet-' + k, lines[k]);
    if (k === 'cuddle') setTimeout(() => ctx.toast(`${PET_TYPES[P.type].e} ${esc(name())} ${PET_TYPES[P.type].love} — ${PET_TYPES[P.type].sound}`, 2600), 900);
    if (k === 'feed' && full(t) > 90) ctx.toast(`${esc(name())} is already full, but ate a little anyway 😋`, 2600);
  }

  // Little menu that pops up above the pet
  function tap() {
    if (!P) return;
    if (bar && !bar.hidden) return hideBar();
    if (!bar) { bar = document.createElement('div'); bar.className = 'popbar pet-popbar'; $('#world').append(bar); }
    const t = now(), asleep = brain(t).mode === 'sleep';
    bar.innerHTML = `<span class="lbl">${esc(name())}${asleep ? ' 💤' : ''}</span>` +
      [['cuddle', '🤗', 'Cuddle'], ['feed', '🍖', 'Feed'], ['play', '🎾', 'Play'], ['treat', '🦴', 'Treat'], ['tricks', '🎓', 'Tricks'], ['sleep', '💤', 'Nap'], ['info', 'ℹ️', 'Info']]
        .map(([k, e, l]) => `<button data-pet="${k}" aria-label="${l}">${e}</button>`).join('');
    bar.hidden = false;
    placeBar();
    if (asleep) ctx.toast(`${esc(name())} is sleeping… a cuddle will wake them up 🥱`, 2200);
  }
  function trickBar() {
    bar.innerHTML = `<span class="lbl">Tricks</span>` + TRICKS.map(tr => `<button data-pet-trick="${tr[0]}" aria-label="${tr[2]}" class="${knows(tr) ? '' : 'pet-locked'}">${tr[1]}</button>`).join('')
      + `<button data-pet="back" aria-label="Back">↩️</button>`;
    placeBar();
  }
  function doTrick(id) {
    const tr = TRICKS.find(x => x[0] === id); if (!tr || !P) return;
    if (!knows(tr)) return ctx.toast(`🔒 ${esc(name())} learns “${tr[2]}” when ${tr[3] === 'young' ? 'a bit older (young)' : 'grown up'}`, 2600);
    const b = brain(now());
    if (b.mode === 'sleep') ctx.toast(`${esc(name())} wakes up for a trick 🥱`, 1800);
    doAct('trick', { t: id });
    setTimeout(() => ctx.toast(`${tr[1]} ${esc(name())}: ${tr[2]}! Good ${P.type === 'dog' ? 'boy/girl' : 'pet'} 💕`, 2400), 800);
  }
  function placeBar() {
    if (!bar || !el || el._x == null) return;
    const half = bar.offsetWidth / 2 / ctx.U() + 2;
    bar.style.left = ctx.ux(clamp(el._x, half, ctx.roomW() - half));
    bar.style.top = `calc(${el._y}% - ${19 * SCALE[stage()] + 2} * var(--u))`;
  }
  function hideBar() { if (bar) bar.hidden = true; }

  // ── Cards: adopt / info / sell ────────────────────────────
  function openMain() {
    hideBar();
    if (P) return showInfo();
    if (ctx.isVisitor()) return ctx.toast('Only the hosts can adopt a pet 🐾');
    draft = { type: 'cat', c1: FUR[0], c2: FUR2[0], pat: 'spots', acc: 'bow', name: NAMES[Math.floor(Math.random() * NAMES.length)] };
    editing = false;
    showAdopt();
  }
  const chips = (list, cur, attr) => `<div class="chips pet-chips">${list.map(([k, l]) => `<button class="chip ${k === cur ? 'on' : ''}" ${attr}="${k}">${l}</button>`).join('')}</div>`;
  function showAdopt() {
    const d = draft;
    ctx.showCard(`<h2>${editing ? `Change ${esc(P.name)}’s look` : '🐾 Adopt a pet'}</h2>
      <div class="pet-prev pet-adult pet-m-idle" id="pet-prev" style="${petVars(d)}">${petSVG(d)}</div>
      <label class="lbl">Name</label>
      <input class="field" id="pet-name" maxlength="16" value="${esc(d.name)}" placeholder="Name your pet">
      ${editing ? '' : `<label class="lbl">Type</label>${chips(Object.entries(PET_TYPES).map(([k, v]) => [k, `${v.e} ${v.n}`]), d.type, 'data-pet-type')}`}
      <label class="lbl">Colour</label>${ctx.swatches(FUR, d.c1, 'data-pet-c1', { small: true })}
      <label class="lbl">Pattern</label>${chips(PATTERNS, d.pat, 'data-pet-pat')}
      ${d.pat === 'plain' ? '' : `<label class="lbl">Pattern colour</label>${ctx.swatches(FUR2, d.c2, 'data-pet-c2', { small: true })}`}
      <label class="lbl">Accessory</label>${chips(ACCS, d.acc, 'data-pet-acc')}
      <button class="btn wide" style="margin-top:18px" data-pet-save>${editing ? 'Save ✨' : 'Adopt 💕'}</button>
      <button class="btn ghost wide small" style="margin-top:8px" data-${editing ? 'pet="info"' : 'dismiss'}>${editing ? 'Back' : 'Not now'}</button>`, 'petAdopt', 'pet-card');
  }
  function updateDraft(ch) {
    draft.name = $('#pet-name')?.value ?? draft.name;
    Object.assign(draft, ch);
    const y = $('#overlay .card')?.scrollTop || 0;
    showAdopt();
    const c = $('#overlay .card'); if (c) c.scrollTop = y;
  }
  function saveDraft() {
    const nm = ($('#pet-name')?.value || '').trim().slice(0, 16);
    if (!nm) { $('#pet-name')?.focus(); return ctx.toast('Give your pet a name 💕'); }
    const t = now(), look = { type: draft.type, c1: draft.c1, c2: draft.c2, pat: draft.pat, acc: draft.acc, name: nm };
    if (editing && P) {
      store.update('pet', look);
      if (nm !== P.name) ctx.logAct('pet-rename', `renamed the pet to ${nm} 🏷️`);
      return showInfo();
    }
    const mine = ctx.roomOf(ctx.me()), pos = nearAvatar(ctx.me(), 1) || { x: 40, y: 86 };
    store.set('pet', { ...look, born: t, by: ctx.me(), rm: mine, rmAt: t, food: 80, foodAt: t, joy: 90, joyAt: t, care: 0, act: { k: 'call', by: ctx.me(), ts: t, x: pos.x, y: pos.y } });
    ctx.hideOverlay();
    ctx.logAct('pet-adopt', `adopted a ${PET_TYPES[draft.type].n.toLowerCase()} called ${nm}! ${PET_TYPES[draft.type].e}`);
    sfx.yay();
    setTimeout(() => ctx.toast(`${PET_TYPES[draft.type].e} Welcome home, <b>${esc(nm)}</b>! Tap them to cuddle, feed and play.`, 5000), 400);
  }
  const barRow = (e, label, v) => `<div class="pet-stat"><span>${e} ${label}</span><div class="pet-meter"><i style="width:${v}%;background:${v < 25 ? '#ff4d6d' : v < 55 ? '#ffb703' : '#2ecc71'}"></i></div><b>${v}%</b></div>`;
  function ageText() {
    const d = Math.floor((now() - P.born) / DAY), h = Math.floor((now() - P.born) / HOUR);
    return d >= 1 ? `${d} day${d > 1 ? 's' : ''} old` : h >= 1 ? `${h} hour${h > 1 ? 's' : ''} old` : 'just adopted';
  }
  function showInfo() {
    if (!P) return ctx.overlayMode() === 'petInfo' && ctx.hideOverlay();
    const t = now(), b = brain(t), st = stage(t), T = PET_TYPES[P.type];
    const doing = { sleep: 'Napping 💤', eat: 'Eating 😋', happy: 'Happy! 💕', run: 'Chasing the ball 🎾', beg: 'Hungry… 🍖', mope: 'A bit lonely 💧', sniff: 'Sniffing around 👃', groom: 'Grooming ✨', stretch: 'Stretching 🙆', wake: 'Waking up 🥱' }[b.mode] || 'Hanging out';
    const where = ctx.roomName(room(t));
    const next = st === 'adult' ? '' : ` · grows up in ~${Math.max(1, Math.ceil(((st === 'baby' ? AGE.young : AGE.adult) - ageMs(t)) / DAY))} day(s) — care speeds it up`;
    ctx.showCard(`<div class="pet-prev pet-${st} pet-m-${b.mode === 'sleep' ? 'sleep' : 'idle'} ${full(t) < 25 ? 'pet-hungry' : ''}" style="${petVars(P)}">${petSVG(P)}</div>
      <h2>${esc(P.name)}</h2>
      <p class="muted">${T.e} ${T.n} · ${STAGE_NAME[st]} · ${ageText()}${next}</p>
      <p class="muted">📍 ${esc(where)} · ${doing}</p>
      <p class="muted pet-tricks">🎓 ${TRICKS.map(tr => `<span class="${knows(tr) ? '' : 'pet-locked'}">${tr[1]} ${tr[2]}</span>`).join(' ')}</p>
      <div class="pet-stats">${barRow('🍖', 'Food', full(t))}${barRow('💕', 'Happy', joy(t))}${barRow('⚡', 'Energy', energy(t))}</div>
      <div class="pet-acts">
        <button class="btn small" data-pet="cuddle">🤗 Cuddle</button><button class="btn small" data-pet="feed">🍖 Feed</button>
        <button class="btn small" data-pet="play">🎾 Play</button><button class="btn small" data-pet="treat">🦴 Treat</button>
      </div>
      <div class="pet-acts">
        ${room(t) === ctx.view() ? '' : `<button class="btn ghost small" data-pet="find">📍 Go to ${esc(P.name)}</button>`}
        <button class="btn ghost small" data-pet="call">📣 Call here</button>
        <button class="btn ghost small" data-pet="tricks">🎓 Tricks</button>
        <button class="btn ghost small" data-pet="sleep">💤 Nap time</button>
      </div>
      ${ctx.isVisitor() ? '' : `<div class="pet-acts"><button class="btn ghost small" data-pet="edit">✏️ Name & look</button><button class="btn ghost small" data-pet="sell">👋 Rehome</button></div>`}
      <button class="btn ghost wide small" style="margin-top:10px" data-dismiss>Close</button>`, 'petInfo', 'pet-card');
  }
  function showSell() {
    ctx.showCard(`<div class="pet-prev pet-${stage()} pet-m-mope" style="${petVars(P)}">${petSVG(P)}</div>
      <h2>Rehome ${esc(P.name)}?</h2>
      <p class="muted">${esc(P.name)} will go to a loving new home 🏡 and leave your room for good. You can adopt a new pet afterwards.</p>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="btn ghost" data-pet="info">Keep ${esc(P.name)} 💕</button><button class="btn red" data-pet="sellyes">Say goodbye</button></div>`, 'petSell', 'pet-card');
  }
  function sellNow() {
    if (!P) return;
    const nm = P.name, t = now(), cur = here() || { x: 40, y: 86 };
    store.update('pet', { act: { k: 'bye', by: ctx.me(), ts: t, x: cur.x, y: cur.y } });
    ctx.hideOverlay();
    ctx.logAct('pet-bye', `found ${nm} a loving new home 🏡👋`);
    setTimeout(() => store.remove('pet'), 3500);
  }
  function findPet() {
    if (!P) return;
    ctx.hideOverlay();
    if (room() !== ctx.view()) ctx.goRoom(room()).then(() => setTimeout(() => el && ctx.centerOn(el._x, el._y), 400));
    else if (el) ctx.centerOn(el._x, el._y);
  }

  function route(d) {
    if (d.pet) {
      const k = d.pet;
      if (['cuddle', 'feed', 'play', 'treat', 'call', 'sleep'].includes(k)) { if (ctx.overlayMode()?.startsWith('pet')) ctx.hideOverlay(); doAct(k); return true; }
      if (k === 'info') { hideBar(); showInfo(); return true; }
      if (k === 'tricks') {
        if (ctx.overlayMode()?.startsWith('pet')) ctx.hideOverlay();
        if (room() !== ctx.view() || !el) { ctx.toast(`${esc(name())} is in the ${esc(ctx.roomName(room()).toLowerCase())} — go there to do tricks 🎓`); return true; }
        if (!bar || bar.hidden) tap();
        trickBar(); return true;
      }
      if (k === 'back') { hideBar(); tap(); return true; }
      if (k === 'edit') { draft = { type: P.type, c1: P.c1, c2: P.c2, pat: P.pat, acc: P.acc, name: P.name }; editing = true; showAdopt(); return true; }
      if (k === 'sell') { showSell(); return true; }
      if (k === 'sellyes') { sellNow(); return true; }
      if (k === 'find') { findPet(); return true; }
      return true;
    }
    if (d.petTrick) { doTrick(d.petTrick); return true; }
    if (ctx.overlayMode() !== 'petAdopt') return false;
    if (d.petType) { updateDraft({ type: d.petType }); return true; }
    if (d.petC1) { updateDraft({ c1: d.petC1 }); return true; }
    if (d.petC2) { updateDraft({ c2: d.petC2 }); return true; }
    if (d.petPat) { updateDraft({ pat: d.petPat }); return true; }
    if (d.petAcc) { updateDraft({ acc: d.petAcc }); return true; }
    if ('petSave' in d) { saveDraft(); return true; }
    return false;
  }

  // A shared dish from the kitchen: the pet trots over (even onto the table) and eats it
  function feedDish(id) {
    const it = ctx.items()[id]; if (!P || !it) return;
    ctx.hideOverlay();
    const pos = { x: +clamp(it.x - 7, 8, ctx.roomW() - 8).toFixed(1), y: +(+it.y).toFixed(2), z: (it.z ?? ctx.itemZ(it)) + 1 };
    doAct('dish', { it, pos });
    setTimeout(() => store.remove(`spaces/${ctx.view()}/items/${id}`), 5400);
  }

  // Gentle reminders: a badge on the 🐾 button and one toast per hungry/lonely spell
  const reminded = new Set();
  function remind() {
    const badge = $('#badge-pet');
    if (!P || ctx.isVisitor()) { if (badge) badge.hidden = true; return; }
    const f = full(), j = joy();
    if (badge) { badge.hidden = !(f < 25 || j < 25); badge.textContent = f < 25 ? '🍖' : '💕'; }
    const key = f < 25 ? 'food' + P.foodAt : j < 25 ? 'joy' + P.joyAt : null;
    if (!key || reminded.has(key) || ctx.overlayMode()) return;
    reminded.add(key);
    const e = PET_TYPES[P.type].e;
    ctx.toast(f < 25 ? `${e} <b>${esc(name())}</b> is hungry! Tap 🐾 Pet to feed them 🍖` : `${e} <b>${esc(name())}</b> misses you — how about a cuddle? 🤗`, 6000);
    sfx.poke();
  }

  // Out on a walk: if the pet is with you outside, it comes along to the next place
  function follow(from, to) {
    if (!P || room() !== from) return;
    const outdoor = ['yard', 'beach', 'woods'];
    if (!outdoor.includes(from) && !outdoor.includes(to)) return;
    if (!outdoor.includes(from) && !(P.act?.by === ctx.me() && now() - P.act.ts < STAY)) return;   // only takes it out if you called/played with it
    store.update('pet', { rm: to, rmAt: now(), act: null });
    ctx.toast(`${PET_TYPES[P.type].e} ${esc(name())} comes along! 🐾`, 2000);
  }

  function scare() {
    if (!P || room() !== ctx.view()) return;
    scaredUntil = Date.now() + 1600;
    render();
  }

  setInterval(() => { if (!document.hidden) render(); }, 500);
  setInterval(() => { if (P && ctx.overlayMode() === 'petInfo') showInfo(); }, 5000);
  setTimeout(() => { remind(); setInterval(remind, 60000); }, 5000);

  return {
    onPet, render, tap, hideBar, route, openMain, scare, feedDish, follow, name: () => P?.name,
    has: () => !!P, CLOSABLE: ['petAdopt', 'petInfo', 'petSell'],
  };
}
