// A tiny realtime key/value tree with two backends:
//  • Firebase Realtime Database (real, online, both phones)
//  • Local demo (localStorage + BroadcastChannel, same device only)
// Both expose the same API: on / once / set / update / push / remove / now / presence
import { CONFIG } from './config.js?v=12';

const FB = '10.12.2';
const split = p => String(p || '').split('/').filter(Boolean);
const clean = v => (v === undefined ? null : JSON.parse(JSON.stringify(v)));
const CH = '0123456789abcdefghijklmnopqrstuvwxyz';
const pushId = () =>
  Date.now().toString(36).padStart(9, '0') +
  Array.from(crypto.getRandomValues(new Uint8Array(6)), b => CH[b % 36]).join('');

export async function createStore(roomId, { base = 'rooms' } = {}) {
  const demo = new URLSearchParams(location.search).has('demo');   // ?demo=1 → test without touching real data
  if (CONFIG.firebase && CONFIG.firebase.apiKey && !demo) return firebaseStore(roomId, base);
  return localStore(roomId, base);
}

async function firebaseStore(roomId, base) {
  const [{ initializeApp }, { getAuth, signInAnonymously }, D] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${FB}/firebase-database.js`),
  ]);
  const app = initializeApp(CONFIG.firebase);
  await signInAnonymously(getAuth(app));
  const db = D.getDatabase(app);
  const r = p => D.ref(db, `${base}/${roomId}${p ? '/' + p : ''}`);
  const q = (p, opts) => (opts?.last ? D.query(r(p), D.limitToLast(opts.last)) : r(p));
  let offset = 0;
  D.onValue(D.ref(db, '.info/serverTimeOffset'), s => (offset = s.val() || 0));

  return {
    mode: 'firebase',
    on: (p, cb, opts) => D.onValue(q(p, opts), s => cb(s.val())),
    once: async (p, opts) => (await D.get(q(p, opts))).val(),
    set: (p, v) => D.set(r(p), clean(v)),
    update: (p, v) => D.update(r(p), clean(v)),
    push(p, v) { const k = D.push(r(p)); D.set(k, clean(v)); return k.key; },
    newKey: p => D.push(r(p)).key,
    // Atomic read-modify-write: fn returns the new value, or undefined to cancel.
    async transact(p, fn) {
      const res = await D.runTransaction(r(p), cur => { const v = fn(cur); return v === undefined ? undefined : clean(v); });
      return res.committed;
    },
    remove: p => D.remove(r(p)),
    now: () => Date.now() + offset,
    presence(me) {
      const pr = r(`presence/${me}`);
      const on = () => D.update(pr, { online: true, ts: D.serverTimestamp() });
      const off = () => D.update(pr, { online: false, ts: D.serverTimestamp() });
      D.onValue(D.ref(db, '.info/connected'), s => {
        if (!s.val()) return;
        D.onDisconnect(pr).update({ online: false, ts: D.serverTimestamp() });
        if (document.visibilityState === 'visible') on();
      });
      setInterval(() => document.visibilityState === 'visible' && on(), 20000);
      document.addEventListener('visibilitychange', () => (document.visibilityState === 'visible' ? on() : off()));
      addEventListener('pagehide', off);
    },
  };
}

function localStore(roomId, base = 'rooms') {
  const KEY = (base === 'rooms' ? 'ourroom:demo:' : `ourroom:demo:${base}:`) + roomId;
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(KEY) : null;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let tree = load();
  const subs = new Set();
  const get = parts => parts.reduce((o, k) => (o == null ? undefined : o[k]), tree);
  const write = (parts, val) => {
    if (!parts.length) { tree = val || {}; return; }
    let o = tree;
    for (const k of parts.slice(0, -1)) { if (typeof o[k] !== 'object' || o[k] === null) o[k] = {}; o = o[k]; }
    const last = parts[parts.length - 1];
    if (val === null || val === undefined) delete o[last]; else o[last] = val;
  };
  const notify = () => subs.forEach(s => s.fire());
  const commit = () => {
    try { localStorage.setItem(KEY, JSON.stringify(tree)); }
    catch (e) { api.onError?.('Demo mode storage is full — photos take a lot of space here. Online mode has plenty.'); }
    bc?.postMessage(1); notify();
  };
  if (bc) bc.onmessage = () => { tree = load(); notify(); };
  const limit = (v, opts) => {
    if (!opts?.last || !v || typeof v !== 'object') return v;
    return Object.fromEntries(Object.keys(v).sort().slice(-opts.last).map(k => [k, v[k]]));
  };

  const api = {
    mode: 'local',
    on(p, cb, opts) {
      const parts = split(p); let prev;
      const s = { fire() { const v = limit(get(parts), opts); const j = JSON.stringify(v ?? null); if (j === prev) return; prev = j; cb(clean(v ?? null)); } };
      subs.add(s); s.fire();
      return () => subs.delete(s);
    },
    once: async (p, opts) => clean(limit(get(split(p)), opts) ?? null),
    // Re-read before every write so several tabs never overwrite each other's changes.
    set(p, v) { tree = load(); write(split(p), clean(v)); commit(); },
    update(p, obj) { tree = load(); const base = split(p); for (const [k, v] of Object.entries(obj)) write([...base, ...split(k)], clean(v)); commit(); },
    push(p, v) { const k = pushId(); api.set(`${p}/${k}`, v); return k; },
    newKey: () => pushId(),
    async transact(p, fn) {
      tree = load();
      const v = fn(clean(get(split(p)) ?? null));
      if (v === undefined) return false;
      write(split(p), clean(v)); commit();
      return true;
    },
    remove(p) { tree = load(); write(split(p), null); commit(); },
    now: () => Date.now(),
    presence(me) {
      const beat = online => api.update(`presence/${me}`, { online, ts: Date.now() });
      beat(true);
      setInterval(() => document.visibilityState === 'visible' && beat(true), 5000);
      document.addEventListener('visibilitychange', () => beat(document.visibilityState === 'visible'));
      addEventListener('pagehide', () => beat(false));
    },
  };
  return api;
}
