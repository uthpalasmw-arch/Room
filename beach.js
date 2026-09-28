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
    ctx.moveMe({ x: 50 + Math.random() * 60, y: 58, seat: null, surf: now(), pier: null });
    sfx.swish();
    ctx.toast('🏄 Cowabunga!', 1500);
    ctx.logAct('surf', 'went surfing 🏄🌊');
  }
  function kiteMenu() {
    const cur = ctx.myAvatar()?.kite;
    ctx.showCard(`<div class="big">🪁</div><h2>Fly a kite</h2><p class="muted">Pick a colour — it flies above you while you’re on the beach</p>
      <div class="swatches" style="justify-content:center">${KITES.map(c => `<button class="sw" style="background:${c}" data-kite="${c}" aria-label="${c}"></button>`).join('')}</div>
      ${cur ? '<button class="btn ghost wide small" style="margin-top:12px" data-kite="off">🪢 Reel it in</button>' : ''}
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
    return `<div class="bh-bottles"></div><button class="bh-ball" data-ball aria-label="Volleyball">🏐</button>
      <button class="bh-spot bh-throw" data-bottle-write style="left:calc(64 * var(--u));top:66%"><b>💌</b><span>Bottle</span></button>
      <button class="bh-spot" data-surf style="left:calc(22 * var(--u));top:64%"><b>🏄</b><span>Surf</span></button>
      <button class="bh-spot" data-kite-menu style="left:calc(108 * var(--u));top:66%"><b>🪁</b><span>Kite</span></button>`;
  }
  function entered() { render(); onBall(ball); }

  function route(d) {
    if ('bottleWrite' in d || 'bottleReply' in d) { writeBottle(); return true; }
    if ('bottleThrow' in d) { throwBottle(); return true; }
    if (d.bottleOpen) { openBottle(d.bottleOpen); return true; }
    if ('ball' in d) { hitBall(); return true; }
    if ('surf' in d) { surf(); return true; }
    if ('kiteMenu' in d) { kiteMenu(); return true; }
    if (d.kite) { ctx.hideOverlay(); ctx.moveMe({ kite: d.kite === 'off' ? null : d.kite }); if (d.kite !== 'off') { sfx.swish(); ctx.logAct('kite', 'is flying a kite at the beach 🪁'); } return true; }
    if ('iceMenu' in d) { iceMenu(); return true; }
    if (d.ice) { ice(+d.ice); return true; }
    return false;
  }
  setInterval(() => { if (here()) render(); }, 60000);
  return { onBottles, onBall, sceneHTML, entered, route, iceMenu, CLOSABLE: ['bottle', 'kite', 'ice'] };
}
