// 🏖️ Beach fun: message in a bottle, volleyball, surfing, kites and the ice-cream cart.

const BOTTLE_TRIP = 12 * 3600000;       // a bottle drifts for 12 hours before it washes up
const KITES = ['#ff4d6d', '#ffd60a', '#4f8cff', '#2ecc71', '#c77dff', '#ff9f1c'];
const FLAVOURS = [['🍦', 'Vanilla cone'], ['🍨', 'Sundae'], ['🍧', 'Shaved ice'], ['🍫', 'Chocolate'], ['🍓', 'Strawberry'], ['🥭', 'Mango']];

export function initBeach(ctx) {
  const { $, esc, sfx, store } = ctx;
  let bottles = {}, ball = null, rally = 0;
  const here = () => ctx.view() === 'beach';
  const now = () => store.now();

  // ── 💌 Message in a bottle ────────────────────────────────
  function onBottles(v) { bottles = v || {}; render(); }
  const arrivedForMe = () => Object.entries(bottles).filter(([, b]) => b.by !== ctx.me() && !b.found && now() - b.ts >= BOTTLE_TRIP);
  function render() {
    const box = document.querySelector('.bh-bottles'); if (!box) return;
    box.innerHTML = arrivedForMe().slice(0, 3).map(([k], i) => `<button class="bh-bottle" data-bottle-open="${k}" style="left:calc(${40 + i * 30} * var(--u))">🍾</button>`).join('');
  }
  function writeBottle() {
    ctx.showCard(`<div class="big">💌</div><h2>Message in a bottle</h2>
      <p class="muted">Throw it into the sea — it washes up on this beach for ${esc(ctx.called(ctx.other()))} in about 12 hours 🌊</p>
      <textarea class="field" id="bh-text" maxlength="240" placeholder="Dear…"></textarea>
      <button class="btn wide" style="margin-top:12px" data-bottle-throw>🌊 Throw it into the sea</button>
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Not now</button>`, 'bottle');
    setTimeout(() => $('#bh-text')?.focus(), 60);
  }
  function throwBottle() {
    const text = ($('#bh-text')?.value || '').trim().slice(0, 240);
    if (!text) return $('#bh-text')?.focus();
    store.push('bottles', { by: ctx.me(), text, ts: now() });
    ctx.hideOverlay(); sfx.swish();
    const fx = ctx.spawnFx('🍾', ctx.myPos().x, ctx.myPos().y, 12, 'bh-fly');
    fx.style.setProperty('--dx', `calc(${(100 - ctx.myPos().x) * .6} * var(--u))`);
    ctx.logAct('bottle', 'threw a message in a bottle into the sea 🍾🌊');
    ctx.toast('🌊 Off it goes! It’ll wash up in about 12 hours', 3000);
  }
  function openBottle(k) {
    const b = bottles[k]; if (!b) return;
    store.update(`bottles/${k}`, { found: now() });
    store.push('log', { by: ctx.me(), text: 'found your message in a bottle 💌', ts: now() });
    sfx.ding();
    ctx.showCard(`<div class="big">🍾</div><h2>A message washed up!</h2>
      <div class="bh-letter"><p>${esc(b.text)}</p><small>— ${esc(ctx.called(b.by))}, ${esc(ctx.ago(b.ts))}</small></div>
      <button class="btn wide" style="margin-top:12px" data-bottle-reply>💌 Write one back</button>
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Keep it in my heart 💕</button>`, 'bottle');
  }

  // ── 🏐 Volleyball: tap the ball to send it flying to the other person ──
  function onBall(v) {
    const prev = ball; ball = v || null;
    const el = document.querySelector('.bh-ball'); if (!el || !ball) return;
    const fly = prev && ball.ts !== prev.ts && now() - ball.ts < 5000;
    el.style.transition = fly ? 'left 1.3s ease-out, top 1.3s cubic-bezier(.2,-0.9,.6,1)' : 'none';
    el.style.left = `calc(${ball.x} * var(--u))`; el.style.top = ball.y + '%';
    if (fly) { sfx.pop(); el.classList.remove('spin'); void el.offsetWidth; el.classList.add('spin'); }
  }
  function hitBall() {
    const b = ball || { x: 34, y: 90 };
    const partner = ctx.partnerPos();
    const t = partner ? { x: partner.x + (Math.random() - .5) * 8, y: Math.min(96, partner.y + 2) } : { x: 20 + Math.random() * 160, y: 72 + Math.random() * 22 };
    const quick = ball && ball.by !== ctx.me() && now() - ball.ts < 7000;
    rally = quick ? (ball.rally || 0) + 1 : 0;
    store.set('beachball', { x: +t.x.toFixed(1), y: +t.y.toFixed(1), by: ctx.me(), ts: now(), rally });
    if (rally >= 3 && rally % 3 === 0) ctx.toast(`🏐 Rally of ${rally}! Keep it going!`, 1800);
    if (rally === 10) ctx.logAct('rally', 'hit a 10-shot volleyball rally 🏐🔥');
  }

  // ── 🏄 Surfing & 🪁 kites (shown on your character for both of you) ──
  function surf() {
    if (ctx.me() === 'v') return;
    ctx.moveMe({ x: 40 + Math.random() * 60, y: 58, seat: null, surf: now(), pier: null, kite: null });
    sfx.swish();
    ctx.toast('🏄 Cowabunga! Tap “Done” at the top when you’re finished', 2500);
    ctx.logAct('surf', 'went surfing 🏄🌊');
  }
  function kiteMenu() {
    const cur = ctx.myAvatar()?.kite;
    ctx.showCard(`<div class="big">🪁</div><h2>Fly a kite</h2><p class="muted">Pick a colour — it flies above you while you’re on the beach</p>
      <div class="swatches" style="justify-content:center">${KITES.map(c => `<button class="sw" style="background:${c}" data-kite="${c}" aria-label="${c}"></button>`).join('')}</div>
      ${cur ? '<button class="btn ghost wide small" style="margin-top:12px" data-kite="off">🪢 Done — reel it in</button>' : ''}
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Close</button>`, 'kite');
  }
  // ── 🍦 Ice-cream cart ──
  function iceMenu() {
    ctx.showCard(`<div class="big">🍦</div><h2>Ice cream!</h2><p class="muted">What flavour?</p>
      <div class="fest-grid">${FLAVOURS.map(([e, n], i) => `<button data-ice="${i}"><span>${e}</span><small>${n}</small></button>`).join('')}</div>
      <label class="bh-for"><input type="checkbox" id="ice-for"> 💝 It’s for ${esc(ctx.called(ctx.other()))}</label>
      <button class="btn ghost wide small" style="margin-top:8px" data-dismiss>Close</button>`, 'ice');
  }
  function ice(i) {
    const [e, n] = FLAVOURS[i], forThem = $('#ice-for')?.checked;
    ctx.hideOverlay();
    if (forThem) {
      const p = ctx.partnerPos() || ctx.myPos();
      ctx.placeFood({ t: 'food', v: e, n, q: 3, for: ctx.other(), from: ctx.me(), by: 'fridge', shop: 'the ice-cream cart', s: .8, x: +(p.x + 6).toFixed(1), y: +Math.min(96, p.y + 1).toFixed(1) });
      ctx.logAct('ice', `bought you a ${n.toLowerCase()} ${e}`);
    } else ctx.eat(e);
    sfx.pop();
  }

  function sceneHTML() {
    return `<div class="bh-bottles"></div><button class="bh-ball" data-ball aria-label="Volleyball">🏐</button>`;
  }
  function entered() { render(); onBall(ball); }

  function route(d) {
    if ('bottleWrite' in d || 'bottleReply' in d) { writeBottle(); return true; }
    if ('bottleThrow' in d) { throwBottle(); return true; }
    if (d.bottleOpen) { openBottle(d.bottleOpen); return true; }
    if ('ball' in d) { hitBall(); return true; }
    if ('surf' in d) { surf(); return true; }
    if ('kiteMenu' in d) { kiteMenu(); return true; }
    if (d.kite) { ctx.hideOverlay(); ctx.moveMe({ kite: d.kite === 'off' ? null : d.kite, seat: null, surf: null }); if (d.kite !== 'off') { sfx.swish(); ctx.logAct('kite', 'is flying a kite at the beach 🪁'); ctx.toast('🪁 Up it goes! Tap “Done” at the top to reel it in', 2500); } return true; }
    if ('iceMenu' in d) { iceMenu(); return true; }
    if (d.ice) { ice(+d.ice); return true; }
    return false;
  }
  setInterval(() => { if (here()) render(); }, 60000);
  // ── 🏰 Sandcastles: knock them down or decorate them with a shell ──
  function castleCard(id, it) {
    ctx.showCard(`<div class="big">🏰${esc(it.deco || '')}</div><h2>A sandcastle</h2><p class="muted">Built by ${esc(ctx.called(it.by))} · the tide takes it after a day</p>
      <div class="stack"><button class="btn wide" data-castle-shell="${id}">🐚 Decorate it with a shell</button>
      <button class="btn ghost wide" data-castle-kick="${id}">👣 Knock it down</button><button class="btn ghost wide small" data-dismiss>Leave it</button></div>`, 'castle');
  }
  // ── 🫙 Shell jar & crafts ──
  const shellsLeft = () => { const b = ctx.beachData(); return Object.values(b.count || {}).reduce((a, n) => a + n, 0) - (b.spent || 0); };
  async function spend(n) {
    const total = Object.values(ctx.beachData().count || {}).reduce((a, x) => a + x, 0);
    return store.transact('beach/spent', cur => ((cur || 0) + n <= total ? (cur || 0) + n : undefined));
  }
  const CRAFTS = [['chime', '🎐', 'Shell wind chime', 5, 'Tinkles when you tap it'], ['frame', '🖼️', 'Shell photo frame', 10, 'A new frame for your photos'], ['necklace', '📿', `Shell necklace for your partner`, 20, 'They’ll wear it 💕']];
  function jarCard() {
    const n = shellsLeft();
    ctx.showCard(`<div class="big">🫙</div><h2>Our shell jar</h2><p class="muted"><b>${n}</b> ${n === 1 ? 'shell' : 'shells'} from the beach (new ones wash up every 4 hours 🌊)</p>
      <div class="stack">${CRAFTS.map(([k, e, name, cost, sub]) => `<button class="btn ${n >= cost ? '' : 'ghost'} wide" style="flex-direction:column;gap:0" data-craft="${k}" ${n >= cost ? '' : 'disabled'}><span>${e} ${name} · ${cost} 🐚</span><small style="font-weight:400">${sub}</small></button>`).join('')}
      <button class="btn ghost wide small" data-dismiss>Close</button></div>`, 'jar');
  }
  async function craft(k) {
    const c = CRAFTS.find(x => x[0] === k); if (!c) return;
    if (!(await spend(c[3]))) return ctx.toast('Not enough shells yet 🐚');
    ctx.hideOverlay(); sfx.yay();
    if (k === 'chime') { ctx.addFurn('shellchime'); ctx.logAct('craft', 'made a seashell wind chime 🎐'); }
    if (k === 'frame') { store.set('beach/frame', true); ctx.toast('🖼️ New “Seashell” frame unlocked — pick it when you hang a photo!', 4000); ctx.logAct('craft', 'made a seashell photo frame 🐚🖼️'); }
    if (k === 'necklace') { store.update(`profiles/${ctx.other()}`, { neck: { by: ctx.me(), ts: now() } }); ctx.logAct('craft', 'made you a seashell necklace 📿💕'); ctx.toast(`📿 ${esc(ctx.called(ctx.other()))} is wearing your necklace!`, 3500); }
  }

  function route2(d) {
    if (d.castleKick) { ctx.hideOverlay(); ctx.removeItem(d.castleKick); sfx.bonk(); ctx.fxAt(d.castleKick, '💥'); return true; }
    if (d.castleShell) {
      ctx.hideOverlay();
      spend(1).then(ok => {
        if (!ok) return ctx.toast('🐚 No shells in the jar — pick some up on the beach first!');
        const it = ctx.item(d.castleShell); if (it) ctx.updateItem(d.castleShell, { deco: ((it.deco || '') + '🐚').slice(-6) });
        sfx.pop();
      });
      return true;
    }
    if ('jar' in d) { jarCard(); return true; }
    if (d.craft) { craft(d.craft); return true; }
    return false;
  }

  return { onBottles, onBall, sceneHTML, entered, route: d => route(d) || route2(d), iceMenu, kiteMenu, surf, writeBottle, castleCard, jarCard, CLOSABLE: ['bottle', 'kite', 'ice', 'castle', 'jar'] };
}
