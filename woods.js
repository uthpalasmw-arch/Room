// 🌲 Things to do in the woods: forage, toast marshmallows, feed the animals, carve your initials,
// wish on shooting stars, picnic, hide a gift for your partner, and fish in the stream.

const FORAGE = [['🫐', 'Wild blueberries'], ['🍓', 'Wild strawberries'], ['🍄', 'Forest mushrooms'], ['🫐', 'Wild blueberries'], ['🍄', 'Forest mushrooms'], ['🌰', 'Chestnuts'], ['🍓', 'Wild strawberries']];
const TREATS = { deer: ['🍎', 'an apple'], rabbit: ['🥕', 'a carrot'], squirrel: ['🥜', 'some nuts'], fox: ['🍖', 'a little snack'], hedgehog: ['🍓', 'a berry'], bird: ['🌾', 'some seeds'], owl: ['🐭', 'a… mouse-shaped cookie'] };
const GIFTS = ['🎁', '💐', '🍫', '🧸', '💍', '🌹', '💌', '🍪'];
const SNACKS = [['🥪', 'a sandwich'], ['🍎', 'an apple'], ['🧃', 'a juice box'], ['🍰', 'a slice of cake'], ['🍇', 'some grapes'], ['🥐', 'a croissant']];

function rnd(seed) { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }
const dayKey = () => new Date().toISOString().slice(0, 10);

export function initWoods(ctx) {
  const { $, esc, sfx, store } = ctx;
  let W = {};           // shared woods state: forage, fed, carving, gift
  let mallow = null;    // marshmallow toasting session
  const here = () => ctx.view() === 'woods';
  const now = () => store.now();

  function onData(v) { W = v || {}; render(); }

  // ── Scene bits ────────────────────────────────────────────
  function sceneHTML() {
    return `<div class="wd-forage"></div>
      <button class="wd-oak" data-carve aria-label="The old oak"><i class="wd-trunk"><span class="wd-carving"></span></i><b>🌳</b></button>
      <button class="bh-spot" data-fish="start-stream" data-fx="72" style="left:calc(72 * var(--u));top:61%"><b>🎣</b><span>Fish</span></button>
      <button class="bh-spot" data-gift-hide style="left:calc(30 * var(--u));top:70%"><b>🎁</b><span>Hide a gift</span></button>
      <div class="wd-gift"></div><button class="wd-shoot" data-wish hidden>🌠</button>`;
  }
  function render() {
    if (!here()) { hint(''); return; }
    // berries & mushrooms (new every day, either of you can pick them)
    const box = document.querySelector('.wd-forage');
    if (box) {
      const day = dayKey(), taken = W.forage?.[day] || {};
      box.innerHTML = FORAGE.map(([e], i) => taken[i] ? '' : `<button class="wd-pick" data-forage="${i}" style="left:calc(${(14 + rnd(day + 'fx' + i) * 172).toFixed(1)} * var(--u));top:${(72 + rnd(day + 'fy' + i) * 24).toFixed(1)}%">${e}</button>`).join('');
    }
    const c = document.querySelector('.wd-carving');
    if (c) c.textContent = W.carving?.text || '';
    renderGift();
  }

  // ── 🍓 Foraging ───────────────────────────────────────────
  async function pick(i) {
    const day = dayKey();
    const ok = await store.transact(`woods/forage/${day}/${i}`, cur => cur ? undefined : ctx.me());
    if (!ok) return;
    const [e, n] = FORAGE[i];
    store.push('catch', { e, n, cm: 0, where: 'woods', by: ctx.me(), ts: now() });
    sfx.pop();
    ctx.toast(`${e} Picked ${n.toLowerCase()} — they’re in the fridge for cooking 🧺`, 2600);
  }

  // ── 🍡 Marshmallows at the campfire ───────────────────────
  function campfireMenu(lit) {
    if (!lit) return false;
    ctx.showCard(`<div class="big">🔥</div><h2>Campfire</h2>
      <div class="stack"><button class="btn wide" data-mallow>🍡 Toast a marshmallow</button>
      <button class="btn ghost wide" data-fire-out>💨 Put the fire out</button><button class="btn ghost wide small" data-dismiss>Close</button></div>`, 'campfire');
    return true;
  }
  function startMallow() {
    mallow = { heat: 0, holding: false, done: false };
    ctx.showCard(`<div class="wd-mallow-card"><h2>🍡 Toast it!</h2><p class="muted">Hold over the fire — let go when it’s golden</p>
      <div class="wd-fire"><div class="wd-stick"><i class="wd-mallow" id="wd-mallow"></i></div><div class="wd-flames"><i></i><i></i><i></i></div></div>
      <div class="wd-meter"><i id="wd-heat"></i><b class="z1"></b><b class="z2"></b></div>
      <button class="btn wide wd-hold" id="wd-hold">🔥 Hold to toast</button></div>`, 'mallow');
    const btn = $('#wd-hold');
    let raf = 0, last = 0;
    const step = t => {
      if (!mallow || mallow.done) return;
      if (mallow.holding) mallow.heat = Math.min(1.2, mallow.heat + (t - last) / 3200);
      last = t;
      const h = mallow.heat, el = $('#wd-mallow'), bar = $('#wd-heat');
      if (el) el.style.background = h < .45 ? `hsl(40, ${30 + h * 60}%, ${96 - h * 20}%)` : h < .8 ? `hsl(36, 85%, ${78 - (h - .45) * 60}%)` : `hsl(20, 60%, ${Math.max(8, 55 - (h - .8) * 120)}%)`;
      if (bar) bar.style.width = Math.min(100, h / 1.2 * 100) + '%';
      if (h >= 1.2) return finishMallow();
      raf = requestAnimationFrame(step);
    };
    const down = e => { e.preventDefault(); if (!mallow || mallow.done) return; mallow.holding = true; btn.classList.add('on'); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step); };
    const up = () => { if (!mallow || !mallow.holding || mallow.done) return; mallow.holding = false; btn.classList.remove('on'); if (mallow.heat > .05) finishMallow(); };
    btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointerleave', up); btn.addEventListener('pointercancel', up);
  }
  function finishMallow() {
    if (!mallow || mallow.done) return;
    mallow.done = true;
    const h = mallow.heat;
    const res = h < .45 ? ['Barely warm', '🤍', 'Hmm, a bit gooey inside… 😅'] : h < .8 ? ['Perfectly golden', '🌟', 'Chef’s kiss — perfect! 🤤'] : h < 1.05 ? ['Extra toasty', '🤎', 'Crispy and caramel-y 😋'] : ['Burnt to a crisp', '🖤', 'Oops, it caught fire! 🔥😂'];
    sfx[h >= 1.05 ? 'whiff' : 'yay']();
    ctx.logAct('mallow', `toasted a marshmallow — ${res[0].toLowerCase()} ${res[1]}`);
    ctx.showCard(`<div class="big">🍡</div><h2>${res[0]} ${res[1]}</h2><p class="muted">${res[2]}</p>
      <div class="stack"><button class="btn wide" data-mallow-eat>😋 Eat it</button>
      ${ctx.partnerHere() ? `<button class="btn ghost wide" data-mallow-give>💝 Give it to ${esc(ctx.called(ctx.other()))}</button>` : ''}
      <button class="btn ghost wide" data-mallow>🔁 Toast another</button></div>`, 'mallow');
  }

  // ── 🥕 Feeding the animals: they come close and follow you for a bit ──
  function animalCard(id) {
    const kind = id.replace(/\d/, ''), [e, what] = TREATS[kind] || ['🍃', 'a leaf'];
    const emoji = document.querySelector(`[data-animal="${id}"]`)?.textContent || '🐾';
    ctx.showCard(`<div class="big">${emoji}</div><h2>${{ deer: 'A deer', rabbit: 'A rabbit', squirrel: 'A squirrel', fox: 'A fox', hedgehog: 'A hedgehog', bird: 'A little bird', owl: 'An owl' }[kind] || 'An animal'}!</h2>
      <p class="muted">It’s watching you carefully…</p>
      <div class="stack"><button class="btn wide" data-feed-animal="${id}">${e} Offer ${what}</button><button class="btn ghost wide small" data-dismiss>Leave it be</button></div>`, 'animal');
  }
  function feed(id) {
    ctx.hideOverlay();
    const kind = id.replace(/\d/, ''), [e] = TREATS[kind] || ['🍃'];
    store.update('woods/fed', { [id]: { by: ctx.me(), ts: now() } });
    const me = ctx.myPos();
    ctx.spawnFx(e, me.x + 5, me.y, 14, 'float');
    setTimeout(() => ctx.spawnFx('💕', me.x + 8, me.y, 18, 'float'), 1600);
    sfx.pop();
    ctx.logAct('feed-' + kind, `fed a ${kind} in the woods ${e}`);
    ctx.toast('It trusts you now — it’ll follow you for a little while 🐾', 2600);
  }
  // Used by the animal schedule: a fed animal trots after whoever fed it (for 45 s)
  function follower(id) {
    const f = W.fed?.[id];
    if (!f || now() - f.ts > 45000) return null;
    return ctx.posOf(f.by);
  }

  // ── ❤️ Carving your initials into the old oak ──
  function carveCard() {
    const init = id => (ctx.called(id) || '?').trim()[0]?.toUpperCase() || '?';
    const suggestion = `${init(ctx.me())} ❤ ${init(ctx.other())}`;
    if (W.carving) return ctx.showCard(`<div class="big">🌳</div><h2>The old oak</h2><div class="wd-carved">${esc(W.carving.text)}</div>
      <p class="muted">Carved by ${esc(ctx.called(W.carving.by))} · ${esc(ctx.ago(W.carving.ts))} · it’s here forever 💕</p><button class="btn ghost wide" data-dismiss>Aww</button>`, 'carve');
    ctx.showCard(`<div class="big">🌳🔪</div><h2>Carve your initials</h2><p class="muted">Into the old oak — forever and ever</p>
      <input class="field" id="wd-carve" maxlength="14" value="${esc(suggestion)}">
      <button class="btn wide" style="margin-top:12px" data-carve-do>❤️ Carve it</button><button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Not yet</button>`, 'carve');
  }
  function carve() {
    const text = ($('#wd-carve')?.value || '').trim().slice(0, 14); if (!text) return;
    store.transact('woods/carving', cur => cur ? undefined : { text, by: ctx.me(), ts: now() });
    ctx.hideOverlay(); sfx.chop?.();
    ctx.logAct('carve', `carved “${text}” into the old oak in the woods 🌳❤️`);
  }

  // ── 🎁 Hide a gift: your partner gets warmer/colder hints until they find it ──
  function hideCard() {
    if (W.gift && W.gift.by === ctx.me()) return ctx.toast(`🎁 Your gift is still hidden — waiting for ${esc(ctx.called(ctx.other()))} to find it`, 2600);
    ctx.showCard(`<div class="big">🎁</div><h2>Hide a gift</h2><p class="muted">It’s hidden right where you’re standing. ${esc(ctx.called(ctx.other()))} gets warmer/colder hints 🔥❄️</p>
      <div class="fest-grid">${GIFTS.map(g => `<button data-gift-pick="${g}"><span>${g}</span></button>`).join('')}</div>
      <input class="field" id="wd-gift-note" maxlength="80" placeholder="A little note (optional)" style="margin-top:10px">`, 'gift');
  }
  function hide(e) {
    const p = ctx.myPos(), note = ($('#wd-gift-note')?.value || '').trim().slice(0, 80);
    store.set('woods/gift', { by: ctx.me(), e, note, x: +p.x.toFixed(1), y: +p.y.toFixed(1), ts: now() });
    ctx.hideOverlay(); sfx.swish();
    ctx.logAct('gift', 'hid a surprise for you somewhere in the woods 🎁🌲');
    ctx.toast('🤫 Hidden! Now walk away so it’s not too easy…', 2600);
  }
  let lastHint = '';
  function renderGift() {
    const g = W.gift, box = document.querySelector('.wd-gift');
    if (!box) return;
    if (!g || g.by === ctx.me() || !here()) { box.innerHTML = ''; hint(''); return; }
    const p = ctx.myPos(), d = Math.hypot(p.x - g.x, (p.y - g.y) * 1.3);
    if (d < 11) box.innerHTML = `<button class="wd-found" data-gift-open style="left:calc(${g.x} * var(--u));top:${g.y}%">${esc(g.e)}</button>`;
    else box.innerHTML = '';
    hint(d < 11 ? '🎉 Found it! Tap it' : d < 25 ? '🔥 Hot! Really close…' : d < 50 ? '🌤️ Warmer…' : d < 90 ? '❄️ Cold…' : '🧊 Freezing!');
  }
  function hint(text) {
    let chip = $('#gift-hint');
    if (!text) { if (chip) chip.hidden = true; return; }
    if (!chip) { chip = document.createElement('div'); chip.id = 'gift-hint'; $('#stage').append(chip); }
    chip.hidden = false;
    const full = `🎁 A gift from ${ctx.called(W.gift.by)} · ${text}`;
    if (full !== lastHint) { chip.textContent = full; lastHint = full; }
  }
  function openGift() {
    const g = W.gift; if (!g) return;
    store.remove('woods/gift');
    store.push('log', { by: ctx.me(), text: `found the ${g.e} you hid in the woods! 🎉`, ts: now() });
    sfx.yay();
    ctx.showCard(`<div class="big bounce">${esc(g.e)}</div><h2>You found it! 🎉</h2>${g.note ? `<div class="bh-letter"><p>${esc(g.note)}</p><small>— ${esc(ctx.called(g.by))}</small></div>` : `<p class="muted">A surprise from ${esc(ctx.called(g.by))} 💕</p>`}
      <button class="btn wide" style="margin-top:12px" data-dismiss>💕</button>`, 'gift');
  }

  // ── 🌠 Shooting stars at night (same moments on both phones) ──
  function stars() {
    const b = document.querySelector('.wd-shoot'); if (!b) return;
    const night = document.querySelector('#stage').classList.contains('sky-night');
    const t = Math.floor(Date.now() / 1000), win = Math.floor(t / 40);
    const on = night && rnd('star' + win) < .45 && t % 40 < 6;
    if (on && b.hidden) { b.style.left = `calc(${(30 + rnd('sx' + win) * 140).toFixed(0)} * var(--u))`; b.style.top = (6 + rnd('sy' + win) * 18).toFixed(0) + '%'; }
    b.hidden = !on;
  }
  function wish() {
    const b = document.querySelector('.wd-shoot'); if (b) b.hidden = true;
    sfx.ding();
    ctx.toast('🌠 You made a wish… it’s a secret ✨', 2600);
    ctx.logAct('wish', 'made a wish on a shooting star 🌠');
  }

  // ── 🧺 Picnic basket ──
  function picnic() {
    const [e, what] = SNACKS[Math.floor(Math.random() * SNACKS.length)];
    ctx.eat(e); ctx.toast(`🧺 You found ${what} in the picnic basket!`, 2000);
  }

  function route(d) {
    if (d.forage) { pick(+d.forage); return true; }
    if ('mallow' in d) { startMallow(); return true; }
    if ('mallowEat' in d) { ctx.hideOverlay(); ctx.eat('🍡'); return true; }
    if ('mallowGive' in d) { ctx.hideOverlay(); const p = ctx.posOf(ctx.other()); if (p) ctx.spawnFx('🍡', p.x, p.y, 20, 'eat-dish'); store.push('log', { by: ctx.me(), text: 'toasted you a marshmallow at the campfire 🍡💕', ts: now() }); return true; }
    if ('fireOut' in d) { ctx.hideOverlay(); ctx.fireOut(); return true; }
    if (d.feedAnimal) { feed(d.feedAnimal); return true; }
    if ('carve' in d) { carveCard(); return true; }
    if ('carveDo' in d) { carve(); return true; }
    if ('giftHide' in d) { hideCard(); return true; }
    if (d.giftPick) { hide(d.giftPick); return true; }
    if ('giftOpen' in d) { openGift(); return true; }
    if ('wish' in d) { wish(); return true; }
    return false;
  }
  setInterval(() => { if (here() && !document.hidden) { stars(); renderGift(); } }, 1000);
  return { onData, sceneHTML, render, route, campfireMenu, animalCard, follower, picnic, closed: () => { mallow = null; }, CLOSABLE: ['campfire', 'animal', 'carve', 'gift', 'mallow'] };
}
