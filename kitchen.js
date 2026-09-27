// 🍳 Kitchen: recipes, cooking mini-games, cooking together, serving & eating food.
// app.js hands us a small context object (ctx) with everything we need from the room.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const CATS = [['drinks', '☕ Drinks'], ['breakfast', '🥞 Breakfast'], ['meals', '🍝 Meals'], ['lanka', '🇱🇰 Sri Lankan'], ['desserts', '🎂 Desserts'], ['snacks', '🍿 Snacks']];
// Which recipe tab each appliance opens
export const APPLIANCE_CAT = { fridge: 'all', kettle: 'drinks', coffee: 'drinks', blender: 'drinks', toaster: 'breakfast', stove: 'meals', microwave: 'snacks', sink: 'all', counter: 'all', wcabinet: 'all' };

const INGREDIENTS = ['🥚', '🥛', '🧈', '🧀', '🍅', '🧅', '🧄', '🥕', '🥔', '🍚', '🍞', '🥬', '🌶️', '🍋', '🍓', '🍌', '🍫', '🍯', '🍃', '💧', '🧂', '🍗', '🐟', '🍤', '🥥', '🌽', '🍄', '🌾', '🍬', '🍎', '🥒', '🥑', '🍇', '🧊', '☕', '🥜', '🍍', '🥩', '🟤', '🟠', '🫓', '🍦'];

// Step builders: [type, what to do, options]
const G = (...need) => ['gather', 'Grab the ingredients', { need }];
const TAP = (label, icon, n = 6, bits) => ['tap', label, { icon, n, bits }];
const CIR = (label, icon, turns = 2) => ['circle', label, { icon, turns }];
const HOLD = (label, icon, color, target = [0.62, 0.84]) => ['hold', label, { icon, color, target }];
const HEAT = (label, icon, food, speed = 1) => ['heat', label, { icon, food, speed }];
const FLIP = (label, icon) => ['flip', label, { icon }];
const BEAT = (label, icon, n = 8) => ['rhythm', label, { icon, n }];
const SWIPE = (label, icon, n = 6, axis = 'x') => ['swipe', label, { icon, n, axis }];
const PICK = (label, options) => ['choose', label, { options }];

export const RECIPES = [
  // ☕ Drinks
  { id: 'tea', n: 'Plain Tea', e: '🍵', cat: 'drinks', hot: true, steps: [G('💧', '🍃'), HEAT('Boil the water — take it off when it whistles!', '🫖', '💧', 1.2), HOLD('Pour the tea', '🫖', '#b5651d'), CIR('Stir it', '🍵', 1.5)] },
  { id: 'kiriti', n: 'Milk Tea (Kiri Té)', e: '🍵', cat: 'drinks', hot: true, steps: [G('💧', '🍃', '🥛', '🍬'), HEAT('Boil the water', '🫖', '💧', 1.2), HOLD('Pour the tea', '🫖', '#b5651d', [0.4, 0.58]), HOLD('Add the milk', '🥛', '#d9a066'), SWIPE('Pull the tea up and down for froth!', '🍵', 6, 'y')] },
  { id: 'coffee', n: 'Coffee', e: '☕', cat: 'drinks', hot: true, steps: [G('☕', '💧'), HEAT('Brew it', '☕', '💧', 1.1), HOLD('Pour the coffee', '☕', '#4b2e1e'), PICK('How do you like it?', [['🥛', 'milk'], ['🍬', 'sugar'], ['🍫', 'mocha'], ['⬛', 'black']])] },
  { id: 'hotchoc', n: 'Hot Chocolate', e: '☕', cat: 'drinks', hot: true, steps: [G('🥛', '🍫', '🍬'), HEAT('Warm the milk', '🥛', '🥛'), CIR('Stir in the chocolate', '🍫', 2), PICK('Topping!', [['☁️', 'whipped cream'], ['🍡', 'marshmallows'], ['🍫', 'choc sprinkles']])] },
  { id: 'smoothie', n: 'Smoothie', e: '🥤', cat: 'drinks', steps: [G('🍓', '🍌', '🥛'), TAP('Chop the fruit', '🍌', 6, '🍌'), HOLD('Blend it! Stop in the green', '🥤', '#ff7eb3'), PICK('Add a little extra', [['🍯', 'honey'], ['🧊', 'ice'], ['🍓', 'strawberries']])] },
  { id: 'lemonade', n: 'Lemonade', e: '🍹', cat: 'drinks', steps: [G('🍋', '💧', '🍬', '🧊'), TAP('Squeeze the lemons!', '🍋', 8, '💦'), CIR('Stir', '🍹', 1.5)] },
  { id: 'shake', n: 'Milkshake', e: '🥤', cat: 'drinks', steps: [G('🥛', '🍦'), HOLD('Blend it!', '🥤', '#f7c6d9'), PICK('Flavour', [['🍫', 'chocolate'], ['🍓', 'strawberry'], ['🍌', 'banana'], ['🍦', 'vanilla']])] },
  { id: 'boba', n: 'Bubble Tea', e: '🧋', cat: 'drinks', steps: [G('🍃', '🥛', '🟤', '🍬'), HEAT('Cook the pearls', '🍲', '🟤'), HOLD('Pour the milk tea', '🧋', '#d9a066'), SWIPE('Shake shake shake!', '🧋', 8, 'y')] },
  // 🥞 Breakfast
  { id: 'pancakes', n: 'Pancakes', e: '🥞', cat: 'breakfast', hot: true, steps: [G('🌾', '🥚', '🥛', '🧈'), CIR('Whisk the batter', '🥣', 3), HOLD('Pour into the pan', '🥣', '#f3d9a4', [0.45, 0.7]), FLIP('Flip when the bubbles pop!', '🥞'), PICK('Topping', [['🍯', 'honey'], ['🍓', 'strawberries'], ['🍫', 'chocolate'], ['🧈', 'butter']])] },
  { id: 'omelette', n: 'Omelette', e: '🍳', cat: 'breakfast', hot: true, steps: [G('🥚', '🧅', '🍅', '🧂'), TAP('Crack the eggs', '🥚', 3, '🥚'), TAP('Chop the onion', '🧅', 6, '🧅'), CIR('Whisk it', '🥣', 2), HEAT('Fry it', '🍳', '🥚'), FLIP('Flip it!', '🍳')] },
  { id: 'toast', n: 'Toast', e: '🍞', cat: 'breakfast', hot: true, steps: [G('🍞', '🧈'), HEAT('Toast it — pop it up when golden!', '🍞', '🍞', 1.3), PICK('Spread', [['🧈', 'butter'], ['🍯', 'honey'], ['🍓', 'jam'], ['🍫', 'chocolate']])] },
  { id: 'cereal', n: 'Cereal', e: '🥣', cat: 'breakfast', steps: [G('🌾', '🥛'), HOLD('Pour the milk', '🥛', '#fffaf0'), PICK('Add fruit', [['🍓', 'strawberries'], ['🍌', 'banana'], ['🍇', 'grapes']])] },
  { id: 'waffles', n: 'Waffles', e: '🧇', cat: 'breakfast', hot: true, steps: [G('🌾', '🥚', '🥛'), CIR('Mix the batter', '🥣', 2), HOLD('Fill the waffle iron', '🥣', '#f3d9a4'), HEAT('Cook it', '🧇', '🧇'), PICK('Topping', [['🍯', 'syrup'], ['🍓', 'berries'], ['🍦', 'ice cream']])] },
  // 🍝 Meals
  { id: 'noodles', n: 'Noodles', e: '🍜', cat: 'meals', hot: true, steps: [G('🌾', '🥚', '🥬', '🌶️'), HEAT('Boil the noodles', '🍲', '🍜'), TAP('Chop the veggies', '🥬', 6, '🥬'), CIR('Stir fry!', '🍜', 2), PICK('Add', [['🌶️', 'extra spice'], ['🥚', 'egg'], ['🍤', 'prawns']])] },
  { id: 'pizza', n: 'Pizza', e: '🍕', cat: 'meals', hot: true, steps: [G('🌾', '💧', '🍅', '🧀'), SWIPE('Knead the dough', '🫓', 6), CIR('Spread the sauce', '🍅', 2), PICK('Toppings', [['🍄', 'mushrooms'], ['🍗', 'chicken'], ['🌶️', 'chilli'], ['🍍', 'pineapple']]), HEAT('Bake it', '♨️', '🍕', 0.9)] },
  { id: 'burger', n: 'Burger', e: '🍔', cat: 'meals', hot: true, steps: [G('🥩', '🍞', '🧀', '🥬', '🍅'), SWIPE('Shape the patty', '🥩', 4), HEAT('Grill it', '🔥', '🥩'), FLIP('Flip the patty!', '🥩'), TAP('Stack it up', '🍔', 5, '🥬')] },
  { id: 'pasta', n: 'Spaghetti', e: '🍝', cat: 'meals', hot: true, steps: [G('🌾', '🍅', '🧄', '🧀'), HEAT('Boil the pasta', '🍲', '🍝'), TAP('Chop the garlic', '🧄', 5, '🧄'), CIR('Stir the sauce', '🍅', 2)] },
  { id: 'sandwich', n: 'Sandwich', e: '🥪', cat: 'meals', steps: [G('🍞', '🧀', '🥬', '🍅'), TAP('Slice the tomato', '🍅', 5, '🍅'), PICK('Filling', [['🥚', 'egg'], ['🍗', 'chicken'], ['🥒', 'cucumber'], ['🥑', 'avocado']]), TAP('Stack it', '🥪', 4, '🍞')] },
  { id: 'soup', n: 'Veggie Soup', e: '🍲', cat: 'meals', hot: true, steps: [G('🥕', '🥔', '🧅', '💧'), TAP('Chop the carrots', '🥕', 8, '🥕'), HEAT('Simmer the soup', '🍲', '🥕', 0.9), CIR('Stir', '🍲', 2)] },
  { id: 'sushi', n: 'Sushi', e: '🍣', cat: 'meals', steps: [G('🍚', '🐟', '🥒'), TAP('Slice the fish', '🐟', 5, '🐟'), SWIPE('Roll it up', '🍙', 4)] },
  { id: 'tacos', n: 'Tacos', e: '🌮', cat: 'meals', hot: true, steps: [G('🌽', '🍗', '🧀', '🍅'), TAP('Chop the tomato', '🍅', 5, '🍅'), HEAT('Cook the chicken', '🍳', '🍗'), TAP('Fill the tacos', '🌮', 3, '🧀')] },
  { id: 'chicken', n: 'Fried Chicken', e: '🍗', cat: 'meals', hot: true, steps: [G('🍗', '🌾', '🧂', '🌶️'), SWIPE('Coat it in flour', '🍗', 4), HEAT('Deep fry — careful!', '🍳', '🍗', 1.1)] },
  // 🇱🇰 Sri Lankan
  { id: 'ricecurry', n: 'Rice & Curry', e: '🍛', cat: 'lanka', hot: true, steps: [G('🍚', '💧', '🥥', '🌶️', '🧅'), HEAT('Cook the rice', '🍚', '🍚', 0.9), TAP('Chop the onions', '🧅', 6, '🧅'), CIR('Stir the curry', '🍛', 3), PICK('Which curry?', [['🍗', 'chicken curry'], ['🐟', 'fish curry'], ['🥔', 'potato curry'], ['🍆', 'brinjal moju']])] },
  { id: 'kottu', n: 'Kottu Roti', e: '🥘', cat: 'lanka', hot: true, steps: [G('🫓', '🥚', '🥕', '🥬', '🍗', '🌶️'), TAP('Chop the veggies', '🥕', 6, '🥕'), HEAT('Heat the griddle', '🔥', '🫓', 1.2), BEAT('Kottu chop! Tap to the beat 🎶', '🔪', 8)] },
  { id: 'hopper', n: 'Egg Hopper (Appa)', e: '🍳', cat: 'lanka', hot: true, steps: [G('🍚', '🥥', '🥚'), HOLD('Pour the batter', '🥣', '#fff3dc', [0.4, 0.62]), CIR('Swirl the pan!', '🥘', 1.5), TAP('Crack an egg in', '🥚', 2, '🥚'), HEAT('Cook it', '🥘', '🍳')] },
  { id: 'idiyappam', n: 'String Hoppers', e: '🍝', cat: 'lanka', hot: true, steps: [G('🍚', '💧', '🧂'), SWIPE('Press the dough through', '🍥', 5, 'y'), HEAT('Steam them', '♨️', '🍝')] },
  { id: 'polsambol', n: 'Pol Sambol', e: '🥥', cat: 'lanka', steps: [G('🥥', '🌶️', '🧅', '🍋', '🧂'), TAP('Scrape the coconut', '🥥', 8, '🥥'), TAP('Chop the onion', '🧅', 4, '🧅'), SWIPE('Mix it by hand', '🥥', 6)] },
  { id: 'kiribath', n: 'Kiribath (Milk Rice)', e: '🍚', cat: 'lanka', hot: true, steps: [G('🍚', '🥥', '🧂'), HEAT('Cook the rice', '🍚', '🍚'), HOLD('Pour the coconut milk', '🥥', '#fffdf4'), SWIPE('Flatten & cut into diamonds', '🍚', 4)] },
  { id: 'dhal', n: 'Dhal Curry (Parippu)', e: '🍲', cat: 'lanka', hot: true, steps: [G('🟠', '🥥', '🧅', '🌶️'), HEAT('Boil the dhal', '🍲', '🟠'), CIR('Stir in the coconut milk', '🍲', 2)] },
  { id: 'watalappam', n: 'Watalappam', e: '🍮', cat: 'lanka', steps: [G('🥥', '🥚', '🍯', '🥜'), CIR('Whisk it all', '🥣', 3), HOLD('Pour into cups', '🍮', '#a0522d'), HEAT('Steam it', '♨️', '🍮', 0.9)] },
  // 🎂 Desserts
  { id: 'cake', n: 'Cake', e: '🎂', cat: 'desserts', steps: [G('🌾', '🥚', '🥛', '🍬', '🧈'), CIR('Mix the batter', '🥣', 3), HOLD('Pour into the tin', '🥣', '#f3d9a4'), HEAT('Bake it', '♨️', '🍰', 0.85), PICK('Decorate!', [['🍓', 'strawberries'], ['🍫', 'chocolate'], ['🌈', 'sprinkles'], ['🕯️', 'candles']])] },
  { id: 'cookies', n: 'Cookies', e: '🍪', cat: 'desserts', steps: [G('🌾', '🧈', '🍬', '🍫'), CIR('Mix the dough', '🥣', 2), TAP('Shape the cookies', '🍪', 6, '🍪'), HEAT('Bake them', '♨️', '🍪')] },
  { id: 'cupcakes', n: 'Cupcakes', e: '🧁', cat: 'desserts', steps: [G('🌾', '🥚', '🍬'), CIR('Mix', '🥣', 2), HOLD('Fill the cups', '🧁', '#f3d9a4'), HEAT('Bake', '♨️', '🧁'), PICK('Frosting', [['🍓', 'pink'], ['🍫', 'chocolate'], ['🍋', 'lemon'], ['🌈', 'rainbow']])] },
  { id: 'icecream', n: 'Ice Cream', e: '🍦', cat: 'desserts', steps: [G('🥛', '🍬', '🧊'), CIR('Churn it!', '🍦', 3), PICK('Flavour', [['🍓', 'strawberry'], ['🍫', 'chocolate'], ['🥭', 'mango'], ['🍦', 'vanilla']])] },
  { id: 'pudding', n: 'Pudding', e: '🍮', cat: 'desserts', steps: [G('🥚', '🥛', '🍬'), CIR('Whisk', '🥣', 2), HOLD('Pour into moulds', '🍮', '#f5d58a'), HEAT('Steam it', '♨️', '🍮')] },
  { id: 'donut', n: 'Donuts', e: '🍩', cat: 'desserts', hot: true, steps: [G('🌾', '🍬', '🥛'), SWIPE('Knead the dough', '🫓', 5), TAP('Cut the rings', '🍩', 4, '⭕'), HEAT('Fry them', '🍳', '🍩'), PICK('Glaze', [['🍫', 'chocolate'], ['🍓', 'pink'], ['🌈', 'sprinkles']])] },
  // 🍿 Snacks
  { id: 'popcorn', n: 'Popcorn', e: '🍿', cat: 'snacks', hot: true, steps: [G('🌽', '🧈', '🧂'), HEAT('Pop it — stop before it burns!', '📻', '🌽', 1.1), SWIPE('Shake the bag!', '🍿', 6, 'y')] },
  { id: 'fries', n: 'French Fries', e: '🍟', cat: 'snacks', hot: true, steps: [G('🥔', '🧂'), TAP('Cut the potatoes', '🥔', 8, '🍟'), HEAT('Fry them', '🍳', '🍟')] },
  { id: 'fruitsalad', n: 'Fruit Salad', e: '🥗', cat: 'snacks', steps: [G('🍓', '🍌', '🍎', '🍇'), TAP('Chop the fruit', '🍎', 8, '🍓'), CIR('Toss it', '🥗', 1.5)] },
  { id: 'nachos', n: 'Nachos', e: '🧀', cat: 'snacks', hot: true, steps: [G('🌽', '🧀', '🌶️', '🥑'), TAP('Mash the avocado', '🥑', 6, '🥑'), HEAT('Melt the cheese', '♨️', '🧀')] },
];
const R = Object.fromEntries(RECIPES.map(r => [r.id, r]));
const VERB = { gather: '🧺', tap: '🔪', circle: '🥄', hold: '🫗', heat: '🔥', flip: '🍳', rhythm: '🎶', swipe: '👐', choose: '✨' };

export function initKitchen(ctx) {
  const { $, esc, sfx } = ctx;
  let solo = null, cleanup = null, shownKey = '', lastSession = null;
  const seenGifts = new Set();
  const me = () => ctx.me(), other = () => ctx.other();

  // ── Recipe book ────────────────────────────────────────────
  let bookCat = 'drinks';
  function openBook(cat) {
    if (cat && cat !== 'all') bookCat = cat;
    const list = RECIPES.filter(r => r.cat === bookCat);
    ctx.showCard(`<div class="cook-head"><span class="dish">📖</span><div><b>What shall we make?</b><small>${RECIPES.length} recipes · tap one to start</small></div><button class="x" data-dismiss aria-label="Close">✕</button></div>
      <div class="chips book-tabs">${CATS.map(([k, l]) => `<button class="chip ${k === bookCat ? 'on' : ''}" data-book-cat="${k}">${l}</button>`).join('')}</div>
      <div class="recipe-grid">${list.map(r => `<button data-recipe="${r.id}"><span>${r.e}</span>${esc(r.n)}<small>${r.steps.length} steps</small></button>`).join('')}</div>`, 'book', 'cook');
  }
  function openRecipe(id) {
    const r = R[id]; if (!r) return;
    const canTogether = ctx.together() && ctx.roomOf(other()) === 'kitchen' && ctx.view() === 'kitchen';
    ctx.showCard(`<div class="cook-head"><span class="dish">${r.e}</span><div><b>${esc(r.n)}</b><small>${r.steps.length} steps</small></div><button class="x" data-book-back aria-label="Back">←</button></div>
      <ol class="step-list">${r.steps.map(([t, label]) => `<li>${VERB[t]} ${esc(label)}</li>`).join('')}</ol>
      <div class="stack">
        <button class="btn wide" data-cook-solo="${id}">👩‍🍳 Cook it</button>
        ${canTogether ? `<button class="btn ghost wide" data-cook-together="${id}">👫 Cook together with ${esc(ctx.called(other()))}</button>`
          : `<p class="hint">👫 Cook together: both of you need to be in the kitchen.</p>`}
      </div>`, 'book', 'cook');
  }

  // ── Mini-games ─────────────────────────────────────────────
  function burst(area, emoji, x, y) {
    const r = area.getBoundingClientRect();
    for (let i = 0; i < 4; i++) {
      const b = document.createElement('span');
      b.className = 'bit'; b.textContent = emoji;
      b.style.left = (x - r.left) + 'px'; b.style.top = (y - r.top) + 'px';
      b.style.setProperty('--dx', rand(-80, 80) + 'px'); b.style.setProperty('--dy', rand(-90, -20) + 'px');
      area.append(b); setTimeout(() => b.remove(), 700);
    }
  }
  function say(area, text, cls = '') {
    const s = document.createElement('div');
    s.className = 'cook-say ' + cls; s.textContent = text;
    area.append(s);
    setTimeout(() => s.remove(), 1400);
  }

  const GAMES = {
    gather(area, { need }, done) {
      const pool = shuffle([...need, ...shuffle(INGREDIENTS.filter(x => !need.includes(x))).slice(0, Math.max(4, 12 - need.length))]);
      area.innerHTML = `<div class="basket">🧺 ${need.map(n => `<span class="want" data-n="${n}">${n}</span>`).join('')}</div>
        <div class="ing-grid">${pool.map(i => `<button data-ing="${i}">${i}</button>`).join('')}</div>`;
      let wrong = 0; const got = new Set();
      area.onclick = e => {
        const b = e.target.closest('[data-ing]'); if (!b || b.disabled) return;
        const i = b.dataset.ing;
        if (need.includes(i)) {
          if (got.has(i)) return;
          got.add(i); b.disabled = true; b.classList.add('ok');
          area.querySelector(`.want[data-n="${i}"]`)?.classList.add('got'); sfx.pop();
          if (got.size === need.length) { area.onclick = null; setTimeout(() => done(clamp(1 - wrong * 0.15, 0.4, 1)), 400); }
        } else { wrong++; b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); sfx.whiff(); }
      };
      return () => { area.onclick = null; };
    },
    tap(area, { icon, n, bits }, done) {
      area.innerHTML = `<div class="big-emoji tapme">${icon}</div><div class="count">0 / ${n}</div><div class="hint2">Tap tap tap!</div>`;
      let c = 0; const t0 = Date.now(), big = area.querySelector('.tapme');
      area.onpointerdown = e => {
        c++; big.classList.remove('hit'); void big.offsetWidth; big.classList.add('hit');
        sfx.chop(); burst(area, bits || icon, e.clientX, e.clientY);
        area.querySelector('.count').textContent = `${c} / ${n}`;
        big.style.scale = String(1 - c / n * 0.35);
        if (c >= n) { area.onpointerdown = null; const t = (Date.now() - t0) / 1000; setTimeout(() => done(clamp(1.15 - t / (n * 0.55), 0.55, 1)), 350); }
      };
      return () => { area.onpointerdown = null; };
    },
    circle(area, { icon, turns }, done) {
      area.innerHTML = `<div class="bowl"><div class="mix">${icon}</div></div><div class="spoon">🥄</div><div class="count">Draw circles around the bowl! 🔄</div>`;
      const bowl = area.querySelector('.bowl'), mix = area.querySelector('.mix'), spoon = area.querySelector('.spoon');
      const need = turns * 2 * Math.PI, t0 = Date.now();
      let last = null, total = 0, fin = false;
      area.onpointerdown = e => { try { area.setPointerCapture(e.pointerId); } catch {} last = null; };
      area.onpointermove = e => {
        if (fin || (e.pointerType === 'mouse' && !e.buttons)) return;
        const r = bowl.getBoundingClientRect(), ar = area.getBoundingClientRect();
        const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
        if (last != null) { let d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; total += Math.abs(d); }
        last = a;
        spoon.style.left = (e.clientX - ar.left) + 'px'; spoon.style.top = (e.clientY - ar.top) + 'px';
        bowl.style.setProperty('--p', Math.min(1, total / need));
        mix.style.rotate = total + 'rad';
        if (Math.random() < 0.08) sfx.swish();
        if (total >= need) { fin = true; say(area, 'Smooth! ✨'); const t = (Date.now() - t0) / 1000; setTimeout(() => done(clamp(1.2 - t / (turns * 3), 0.6, 1)), 500); }
      };
      area.onpointerup = () => { last = null; };
      return () => { area.onpointerdown = area.onpointermove = area.onpointerup = null; };
    },
    hold(area, { icon, color, target }, done) {
      area.innerHTML = `<div class="pourer">${icon}</div><div class="cup"><div class="band" style="bottom:${target[0] * 100}%;height:${(target[1] - target[0]) * 100}%"></div><div class="fill" style="background:${color}"></div></div>
        <button class="btn hold-btn">Hold to pour 🫗</button><div class="count">Fill up to the green line</div>`;
      const fill = area.querySelector('.fill'), btn = area.querySelector('.hold-btn');
      // Level is worked out from how long you've held (so it never depends on animation frames).
      let base = 0, since = 0, holding = false, fin = false, raf;
      const level = () => base + (holding ? (performance.now() - since) / 1000 * 0.36 : 0);
      let lvl = 0;
      const finish = () => {
        lvl = level();
        if (fin || lvl < 0.03) return; fin = true; holding = false; area.classList.remove('pouring');
        fill.style.height = Math.min(lvl, 1.05) * 100 + '%';
        const mid = (target[0] + target[1]) / 2, half = (target[1] - target[0]) / 2;
        let s, msg;
        if (lvl > 1.02) { s = 0.3; msg = 'Overflow! 💦'; }
        else if (lvl >= target[0] && lvl <= target[1]) { s = 1 - Math.abs(lvl - mid) / half * 0.25; msg = 'Perfect! ⭐'; }
        else if (lvl < target[0]) { s = clamp(0.4 + lvl / target[0] * 0.3, 0.4, 0.7); msg = 'A bit too little!'; }
        else { s = clamp(0.7 - (lvl - target[1]) * 2, 0.35, 0.7); msg = 'A bit too much!'; }
        say(area, msg); setTimeout(() => done(s), 700);
      };
      const tick = () => {
        if (holding) { const l = level(); fill.style.height = Math.min(l, 1.05) * 100 + '%'; if (l > 1.05) finish(); }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      btn.onpointerdown = e => { if (fin) return; e.preventDefault(); since = performance.now(); holding = true; area.classList.add('pouring'); sfx.pour(); };
      btn.onpointerup = btn.onpointerleave = btn.onpointercancel = () => { if (holding) finish(); };
      return () => cancelAnimationFrame(raf);
    },
    heat(area, { icon, food, speed }, done) {
      area.innerHTML = `<div class="heat-scene"><div class="heat-tool">${icon}</div><div class="heat-food">${food || ''}</div><div class="flames">🔥🔥🔥</div><div class="smoke">💨</div></div>
        <div class="heatbar"><i style="flex:50" class="z-raw"></i><i style="flex:18" class="z-good"></i><i style="flex:16" class="z-perfect"></i><i style="flex:9" class="z-good"></i><i style="flex:7" class="z-burnt"></i><b class="marker"></b></div>
        <div class="heat-labels"><span>raw</span><span>⭐ perfect</span><span>🔥</span></div>
        <button class="btn take-btn">Take it off! ✋</button>`;
      const marker = area.querySelector('.marker'), foodEl = area.querySelector('.heat-food'), scene = area.querySelector('.heat-scene');
      const dur = 6000 / (speed || 1), t0 = performance.now();
      let raf, fin = false, lastSizzle = 0;
      const finish = p => {
        if (fin) return; fin = true; cancelAnimationFrame(raf);
        let s, msg, burnt = false;
        if (p >= 0.93) { s = 0.1; burnt = true; msg = 'BURNT! 🔥🖤'; sfx.whiff(); }
        else if (p >= 0.68 && p < 0.84) { s = 1; msg = 'Perfect! ⭐⭐⭐'; sfx.ding(); }
        else if (p >= 0.5) { s = 0.75; msg = 'Nice!'; sfx.pop(); }
        else { s = 0.35; msg = 'Still a bit raw… 😬'; }
        say(area, msg, burnt ? 'bad' : ''); setTimeout(() => done(s, burnt ? { burnt: true } : null), 800);
      };
      const tick = t => {
        const p = (t - t0) / dur;
        marker.style.left = Math.min(p, 1) * 100 + '%';
        foodEl.style.filter = `brightness(${clamp(1.15 - Math.max(0, p - 0.6) * 1.6, 0.25, 1.15)})`;
        scene.classList.toggle('smoking', p > 0.9);
        if (t - lastSizzle > 700) { lastSizzle = t; sfx.sizzle(); }
        if (p >= 1) return finish(1);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const auto = setTimeout(() => finish(1), dur + 50);
      area.querySelector('.take-btn').onclick = () => finish((performance.now() - t0) / dur);
      return () => { cancelAnimationFrame(raf); clearTimeout(auto); };
    },
    flip(area, { icon }, done) {
      area.innerHTML = `<div class="pan"><div class="pan-food">${icon}</div><div class="bubbles"></div></div><div class="count">Wait for the bubbles…</div><button class="btn flip-btn">Flip! 🍳</button>`;
      const pan = area.querySelector('.pan'), foodEl = area.querySelector('.pan-food'), cnt = area.querySelector('.count');
      const t0 = Date.now(), ready = t0 + rand(1800, 3800), win = 1000;
      let fin = false;
      const iv = setInterval(() => {
        const now = Date.now();
        pan.classList.toggle('bubbly', now > ready - 900);
        if (now >= ready && now < ready + win) { pan.classList.add('now'); cnt.textContent = 'NOW! 👉'; }
        else pan.classList.remove('now');
        if (now > ready + 2400) finish();
      }, 60);
      const finish = () => {
        if (fin) return; fin = true; clearInterval(iv);
        const now = Date.now();
        foodEl.classList.add('flipping'); sfx.swish();
        let s, msg;
        if (now < ready) { s = 0.45; msg = 'Too early — a bit raw!'; }
        else if (now <= ready + win) { s = 1; msg = 'Perfect flip! ⭐'; }
        else { s = 0.5; msg = 'A little dark on one side!'; }
        say(area, msg); setTimeout(() => done(s), 900);
      };
      area.querySelector('.flip-btn').onclick = finish;
      return () => clearInterval(iv);
    },
    rhythm(area, { icon, n }, done) {
      area.innerHTML = `<div class="beat-ring"><div class="big-emoji">${icon}</div></div><div class="count">Listen… 3, 2, 1</div><button class="btn big-tap">CHOP! 🔪</button>`;
      const ring = area.querySelector('.beat-ring'), cnt = area.querySelector('.count');
      const gap = 520, start = performance.now() + 1600;
      const beats = Array.from({ length: n }, (_, i) => start + i * gap), hit = new Set();
      const timers = [];
      [-3, -2, -1].forEach(k => timers.push(setTimeout(() => { sfx.tick(); cnt.textContent = `${-k}…`; }, 1600 + k * gap)));
      beats.forEach((b, i) => timers.push(setTimeout(() => {
        ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse'); sfx.clack();
        cnt.textContent = `Beat ${i + 1} / ${n}`;
      }, b - performance.now())));
      timers.push(setTimeout(() => { const s = hit.size / n; say(area, s > 0.8 ? 'Kottu master! 🔥' : s > 0.5 ? 'Nice rhythm!' : 'Chop chop… 😅'); setTimeout(() => done(clamp(s, 0.3, 1)), 800); }, beats[n - 1] - performance.now() + 450));
      area.querySelector('.big-tap').onpointerdown = e => {
        e.preventDefault();
        const t = performance.now();
        const i = beats.findIndex((b, k) => !hit.has(k) && Math.abs(b - t) < 180);
        burst(area, i >= 0 ? '✨' : '💨', e.clientX, e.clientY);
        if (i >= 0) { hit.add(i); sfx.chop(); }
      };
      return () => timers.forEach(clearTimeout);
    },
    swipe(area, { icon, n, axis }, done) {
      area.innerHTML = `<div class="big-emoji swipeme">${icon}</div><div class="count">0 / ${n}</div><div class="hint2">${axis === 'y' ? 'Swipe up and down! ↕️' : 'Swipe left and right! ↔️'}</div>`;
      const el = area.querySelector('.swipeme'), cnt = area.querySelector('.count');
      let c = 0, anchor = null, dir = 0, down = false, fin = false; const t0 = Date.now();
      area.onpointerdown = e => { down = true; try { area.setPointerCapture(e.pointerId); } catch {} anchor = axis === 'y' ? e.clientY : e.clientX; dir = 0; };
      area.onpointermove = e => {
        if (!down || fin) return;
        const v = axis === 'y' ? e.clientY : e.clientX, d = v - anchor;
        el.style.translate = axis === 'y' ? `0 ${clamp(d, -70, 70)}px` : `${clamp(d, -90, 90)}px 0`;
        const nd = Math.sign(d);
        if (Math.abs(d) > 40 && nd !== dir) {
          dir = nd; anchor = v; c++; cnt.textContent = `${c} / ${n}`; sfx.swish();
          el.classList.remove('squish'); void el.offsetWidth; el.classList.add('squish');
          if (c >= n) { fin = true; el.style.translate = ''; const t = (Date.now() - t0) / 1000; say(area, 'Done! 👐'); setTimeout(() => done(clamp(1.2 - t / (n * 0.7), 0.6, 1)), 600); }
        }
      };
      area.onpointerup = area.onpointercancel = () => { down = false; el.style.translate = ''; };
      return () => { area.onpointerdown = area.onpointermove = area.onpointerup = null; };
    },
    choose(area, { options }, done) {
      area.innerHTML = `<div class="choose-grid">${options.map(([e, l], i) => `<button data-opt="${i}"><span>${e}</span>${esc(l)}</button>`).join('')}</div>`;
      area.onclick = e => {
        const b = e.target.closest('[data-opt]'); if (!b) return;
        area.onclick = null; sfx.pop();
        const [em, label] = options[+b.dataset.opt];
        b.classList.add('ok'); setTimeout(() => done(1, { add: [em, label] }), 400);
      };
      return () => { area.onclick = null; };
    },
  };

  // ── Cooking screen (solo or together) ──────────────────────
  function cookScreen(r, step, { myTurn, cookName, together }) {
    const [type, label, opts] = r.steps[step];
    ctx.showCard(`<div class="cook-head"><span class="dish">${r.e}</span><div><b>${esc(r.n)}</b><small>Step ${step + 1} of ${r.steps.length}${together ? ' · 👫 together' : ''}</small></div><button class="x" data-cook-quit aria-label="Stop cooking">✕</button></div>
      <div class="cook-task">${VERB[type]} ${esc(label)}</div>
      <div class="cook-area ${myTurn ? '' : 'watching'}" id="cook-area"></div>
      <div class="steps">${r.steps.map((_, i) => `<i class="${i < step ? 'done' : i === step ? 'cur' : ''}"></i>`).join('')}</div>`, 'cook', 'cook');
    const area = $('#cook-area');
    cleanup?.(); cleanup = null;
    if (myTurn) return area;
    area.innerHTML = `<div class="big-emoji watch">${opts?.icon || r.e}</div><div class="count">${esc(cookName)}’s turn — ${esc(label.toLowerCase())}…</div><div class="hint2">Cheer them on! 📣</div>`;
    return null;
  }

  function startSolo(id) {
    const r = R[id]; if (!r) return;
    solo = { r, step: 0, scores: [], extras: [], burnt: false };
    runSolo();
  }
  function runSolo() {
    const s = solo;
    if (s.step >= s.r.steps.length) return finish({ r: s.r, scores: s.scores, extras: s.extras, burnt: s.burnt, together: false });
    const area = cookScreen(s.r, s.step, { myTurn: true });
    cleanup = GAMES[s.r.steps[s.step][0]](area, s.r.steps[s.step][2], (score, extra) => {
      cleanup?.(); cleanup = null;
      s.scores.push(score); s.extras.push(extra || null);
      if (extra?.burnt) s.burnt = true;
      s.step++;
      runSolo();
    });
  }

  // Cooking together: a shared session at /cook, players take turns doing the steps.
  function inviteTogether(id) {
    ctx.store.set('cook', { id: ctx.store.now().toString(36), r: id, players: [me(), other()], step: 0, state: 'invite', by: me(), ts: ctx.store.now() });
    ctx.showCard(`<div class="big bounce">👫</div><h2>Waiting for ${esc(ctx.called(other()))}…</h2><p class="muted">Asking them to cook ${esc(R[id].n)} with you ${R[id].e}</p>
      <button class="btn ghost" data-cook-quit>Cancel</button>`, 'cook-wait');
  }
  function onSession(v) {
    const was = lastSession; lastSession = v;
    if (!v || !v.players?.includes(me())) return;
    if (ctx.store.now() - v.ts > 45 * 60000) return;
    const r = R[v.r]; if (!r) return;
    const key = `${v.id}:${v.state}:${v.step}`;
    if (key === shownKey) return;
    shownKey = key;
    if (v.state === 'invite') {
      if (v.by === me()) return;
      sfx.ding(); navigator.vibrate?.([100, 60, 100]);
      return ctx.showCard(`<div class="big bounce">${r.e}</div><h2>${esc(ctx.called(v.by))} wants to cook with you!</h2>
        <p class="muted">👫 Let’s make <b>${esc(r.n)}</b> together — you take turns doing the steps.</p>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn ghost" data-cook-decline>Not now</button><button class="btn" data-cook-accept>Let’s cook! 👩‍🍳</button></div>`, 'cook-invite');
    }
    if (v.state === 'cancel') {
      cleanup?.(); cleanup = null;
      if (['cook', 'cook-wait', 'cook-invite'].includes(ctx.overlayMode())) ctx.hideOverlay();
      if (was?.state && was.state !== 'cancel' && v.quitBy !== me()) ctx.toast(`${esc(ctx.called(v.quitBy || other()))} stopped cooking 🍳`);
      return;
    }
    if (v.state === 'on') {
      if (v.step >= r.steps.length) {
        if (v.by === me()) ctx.store.update('cook', { state: 'done' });
        return;
      }
      const turn = v.players[v.step % 2];
      const myTurn = turn === me();
      const area = cookScreen(r, v.step, { myTurn, cookName: ctx.called(turn), together: true });
      if (myTurn) {
        const step = v.step;
        cleanup = GAMES[r.steps[step][0]](area, r.steps[step][2], (score, extra) => {
          cleanup?.(); cleanup = null;
          ctx.store.update('cook', { [`sc/${step}`]: score, [`ex/${step}`]: extra || null, step: step + 1, ...(extra?.burnt ? { burnt: true } : {}) });
        });
      }
      return;
    }
    if (v.state === 'done') {
      cleanup?.(); cleanup = null;
      const n = r.steps.length;
      const scores = Array.from({ length: n }, (_, i) => v.sc?.[i] ?? 0.7);
      const extras = Array.from({ length: n }, (_, i) => v.ex?.[i] ?? null);
      finish({ r, scores, extras, burnt: !!v.burnt, together: true, starter: v.by === me() });
    }
  }
  function quit() {
    cleanup?.(); cleanup = null;
    if (solo) { solo = null; ctx.hideOverlay(); return; }
    const v = lastSession;
    if (v && v.players?.includes(me()) && ['invite', 'on'].includes(v.state)) ctx.store.update('cook', { state: 'cancel', quitBy: me() });
    ctx.hideOverlay();
  }

  // ── Result, serving & eating ───────────────────────────────
  let result = null;
  function finish({ r, scores, extras, burnt, together, starter }) {
    solo = null;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stars = burnt ? 0 : avg >= 0.85 ? 3 : avg >= 0.6 ? 2 : 1;
    const add = extras.find(x => x?.add)?.add;
    const name = `${burnt ? 'Burnt ' : ''}${r.n}${add ? ` with ${add[1]}` : ''}`;
    result = { r, name, stars, burnt, top: add?.[0] || '', together };
    sfx[burnt ? 'whiff' : 'yay']();
    const starTxt = burnt ? '🖤 Oops!' : '⭐'.repeat(stars);
    if (together) {
      if (starter) serveTogether();
      return ctx.showCard(`<div class="result-dish ${burnt ? 'burnt' : ''}">${r.e}<span>${result.top}</span></div><h2>${esc(name)}</h2><div class="stars">${starTxt}</div>
        <p class="muted">👫 You made it together! ${burnt ? 'It’s… crispy. Very crispy. 😂' : 'Two portions are on the kitchen table 🍽️'}</p>
        <button class="btn wide" data-dismiss>Yum! 💕</button>`, 'result', 'cook');
    }
    const canGive = ctx.joined(other());
    ctx.showCard(`<div class="result-dish ${burnt ? 'burnt' : ''}">${r.e}<span>${result.top}</span></div><h2>${esc(name)}</h2><div class="stars">${starTxt}</div>
      <p class="muted">${burnt ? 'Well… it’s edible? Maybe? 😂' : stars === 3 ? 'Chef’s kiss! 👨‍🍳💋' : 'Looks tasty!'}</p>
      <div class="stack">
        ${canGive ? `<button class="btn wide" data-serve="give">💝 Give it to ${esc(ctx.called(other()))}</button>` : ''}
        <button class="btn ghost wide" data-serve="table">🍽️ Put it on the table</button>
        <button class="btn ghost wide" data-serve="eat">😋 Eat it myself</button>
      </div>`, 'result', 'cook');
  }
  const foodData = (res, forId, by) => ({ t: 'food', v: res.r.e, top: res.top, n: res.name, q: res.stars, burnt: res.burnt || null, hot: res.r.hot || null, for: forId || null, by, s: 0.9 });

  // Find a table (or counter) in a room to put food on; otherwise next to someone.
  async function spotIn(rm, nearId) {
    const items = rm === ctx.view() ? ctx.items() : (await ctx.store.once(`spaces/${rm}/items`)) || {};
    const H = { dtable: 14, table: 12, counter: 20, sink: 20 };
    const tables = Object.values(items).filter(i => i.t === 'furn' && H[i.k]).sort((a, b) => (a.k === 'dtable' ? -1 : 0) - (b.k === 'dtable' ? -1 : 0));
    const t = tables[0];
    if (t) {
      const s = t.s || 1, half = (t.k === 'dtable' ? 12 : 7) * s;
      return { x: +(t.x + rand(-half, half)).toFixed(1), y: +(t.y - H[t.k] * s * ctx.UPCT + 0.4).toFixed(2), z: (t.z ?? Math.round(t.y * 10)) + 5 };
    }
    const a = ctx.avatar(nearId) || { x: 50, y: 80 };
    return { x: +clamp(a.x + rand(-9, 9), 8, 150).toFixed(1), y: +clamp(a.y + 1, 60, 97).toFixed(1) };
  }
  async function serve(how) {
    const res = result; if (!res) return;
    result = null;
    if (how === 'eat') { ctx.hideOverlay(); return eatAnim(me(), res.r.e, res.burnt); }
    const forId = how === 'give' ? other() : null;
    const rm = how === 'give' && ctx.isOnline(other()) ? ctx.roomOf(other()) : ctx.view();
    const spot = await spotIn(rm, forId || me());
    ctx.store.push(`spaces/${rm}/items`, { ...foodData(res, forId, me()), ...spot, ts: ctx.store.now() });
    ctx.hideOverlay();
    if (forId) {
      ctx.store.push('log', { by: me(), text: `made you ${res.name} ${res.r.e}${res.burnt ? ' (it’s burnt 😂)' : ' ' + '⭐'.repeat(res.stars)}`, ts: ctx.store.now() });
      ctx.toast(`💝 ${esc(res.name)} is waiting for ${esc(ctx.called(other()))}${rm !== ctx.view() ? ` in the ${esc(ctx.roomName(rm).toLowerCase())}` : ''}!`);
    } else ctx.toast(`🍽️ ${esc(res.name)} is on the table`);
    ctx.sfx.pop();
  }
  async function serveTogether() {
    const res = result; if (!res) return;
    const spots = [await spotIn('kitchen', me()), await spotIn('kitchen', other())];
    const now = ctx.store.now();
    [me(), other()].forEach((id, i) => ctx.store.push('spaces/kitchen/items', { ...foodData(res, id, 'both'), ...spots[i], ts: now }));
    ctx.store.push('log', { by: me(), text: `cooked ${res.name} ${res.r.e} with you 👫`, ts: now });
  }

  function eatAnim(who, emoji, burnt) {
    const el = ctx.avatarEl(who); if (!el) return;
    ctx.spawnFx(emoji, el._x, el._y, 20, 'eat-dish');
    setTimeout(() => ctx.spawnFx(burnt ? '🤢' : '😋', el._x + 6, el._y, 18, 'float'), 900);
    [300, 700, 1100].forEach((t, i) => setTimeout(() => { sfx.munch(); ctx.spawnFx(i === 2 ? (burnt ? '💨' : '❤️') : 'nom', el._x + (i - 1) * 6, el._y, 24, 'nom'); }, t));
  }

  function openFood(id) {
    const it = ctx.items()[id]; if (!it) return;
    const maker = it.by === 'both' ? 'you two 👫' : it.by === me() ? 'you' : ctx.called(it.by);
    const stale = ctx.store.now() - it.ts > 86400000;
    const forTxt = it.for === me() ? ' — for you 💝' : it.for ? ` — for ${esc(ctx.called(it.for))}` : '';
    ctx.showCard(`<div class="result-dish ${it.burnt ? 'burnt' : ''}">${esc(it.v)}<span>${esc(it.top || '')}</span></div><h2>${esc(it.n)}</h2>
      <div class="stars">${it.burnt ? '🖤' : '⭐'.repeat(it.q || 1)}</div>
      <p class="muted">Made by ${esc(maker)}${forTxt} · ${ctx.ago(it.ts)}${stale ? ' · 🪰 hmm, it’s getting old…' : ''}</p>
      <div class="stack">
        <button class="btn wide" data-food-eat="${id}">😋 ${it.hot && !stale ? 'Eat it while it’s warm!' : 'Eat it'}</button>
        ${it.for !== other() && ctx.joined(other()) ? `<button class="btn ghost wide" data-food-give="${id}">💝 Give it to ${esc(ctx.called(other()))}</button>` : ''}
        <button class="btn ghost wide" data-food-bin="${id}">🗑️ Throw it away</button>
      </div>`, 'food');
  }
  function eat(id) {
    const it = ctx.items()[id]; if (!it) return ctx.hideOverlay();
    ctx.store.remove(`spaces/${ctx.view()}/items/${id}`);
    ctx.hideOverlay();
    eatAnim(me(), it.v, it.burnt);
    if (it.by && it.by !== me() && it.by !== 'both') {
      const txt = it.burnt ? `ate the burnt ${it.n.replace(/^Burnt /, '')} you made 🤢😂` : `ate the ${it.n} you made ${it.v} — yum! 😋`;
      ctx.store.push('log', { by: me(), text: txt, ts: ctx.store.now() });
    }
  }
  async function give(id) {
    const it = ctx.items()[id]; if (!it) return;
    const rm = ctx.isOnline(other()) ? ctx.roomOf(other()) : ctx.view();
    ctx.hideOverlay();
    if (rm === ctx.view()) {
      const spot = ctx.isOnline(other()) ? await spotIn(rm, other()) : {};
      ctx.store.update(`spaces/${rm}/items/${id}`, { for: other(), ...spot });
    } else {
      const spot = await spotIn(rm, other());
      ctx.store.remove(`spaces/${ctx.view()}/items/${id}`);
      ctx.store.push(`spaces/${rm}/items`, { ...it, for: other(), ...spot, ts: ctx.store.now() });
    }
    ctx.store.push('log', { by: me(), text: `gave you ${it.n} ${it.v} 💝`, ts: ctx.store.now() });
    ctx.toast(`💝 Sent to ${esc(ctx.called(other()))}!`);
  }
  function bin(id) { ctx.store.remove(`spaces/${ctx.view()}/items/${id}`); ctx.hideOverlay(); ctx.sfx.pop(); }

  // Food looks: a dish on a little plate, steam while warm, flies when it's a day old.
  function renderFood(el, it) {
    if (!el._food) {
      el.innerHTML = `<span class="dish"></span><span class="top"></span><span class="for"></span>`;
      el._food = true;
    }
    el.querySelector('.dish').textContent = it.v;
    el.querySelector('.top').textContent = it.top || '';
    const f = el.querySelector('.for');
    f.textContent = it.for ? `for ${ctx.called(it.for)}` : '';
    f.hidden = !it.for;
    const age = ctx.store.now() - (it.ts || 0);
    el.classList.toggle('hot', !!it.hot && age < 20 * 60000);
    el.classList.toggle('burnt', !!it.burnt);
    el.classList.toggle('stale', age > 86400000);
    // A present just arrived for me → little popup
    if (it.for === me() && it.by !== me() && age < 90000 && !seenGifts.has(el.dataset.id) && !ctx.overlayMode()) {
      seenGifts.add(el.dataset.id);
      const who = it.by === 'both' ? null : ctx.called(it.by);
      if (who) {
        sfx.ding(); navigator.vibrate?.([80, 50, 80]);
        ctx.showCard(`<div class="result-dish ${it.burnt ? 'burnt' : ''}">${esc(it.v)}<span>${esc(it.top || '')}</span></div>
          <h2>${esc(who)} made you ${esc(it.n)}!</h2><div class="stars">${it.burnt ? '🖤 (it’s burnt 😂)' : '⭐'.repeat(it.q || 1)}</div>
          <div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost" data-dismiss>Later</button><button class="btn" data-food-eat="${el.dataset.id}">😋 Eat it now</button></div>`, 'food');
      }
    }
    seenGifts.add(el.dataset.id);
  }

  function route(d) {
    if (d.bookCat) { bookCat = d.bookCat; openBook(); return true; }
    if (d.recipe) { openRecipe(d.recipe); return true; }
    if ('bookBack' in d) { openBook(); return true; }
    if (d.cookSolo) { startSolo(d.cookSolo); return true; }
    if (d.cookTogether) { inviteTogether(d.cookTogether); return true; }
    if ('cookAccept' in d) { ctx.store.update('cook', { state: 'on' }); return true; }
    if ('cookDecline' in d) { ctx.store.update('cook', { state: 'cancel', quitBy: me() }); ctx.hideOverlay(); return true; }
    if ('cookQuit' in d) { quit(); return true; }
    if (d.serve) { serve(d.serve); return true; }
    if (d.foodEat) { eat(d.foodEat); return true; }
    if (d.foodGive) { give(d.foodGive); return true; }
    if (d.foodBin) { bin(d.foodBin); return true; }
    return false;
  }

  return { openBook, onSession, renderFood, openFood, route, busy: () => !!solo || (lastSession?.state === 'on' && lastSession.players?.includes(me())) };
}
