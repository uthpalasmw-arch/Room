# Our Room — notes for Claude

A free, private online "home" for a long-distance couple (Android + iPhone), with rooms,
chat, voice calls, cooking, TV, garden and games. Live at https://uthpalasmw-arch.github.io/Room/

## How it's built
- Plain HTML/CSS/JS ES modules, **no build step**. GitHub Pages serves the repo root (branch `main`).
- Firebase Realtime Database (free Spark plan, project `home-8204a`) + anonymous auth, config in `config.js`.
  Rules are in `database.rules.json` (paste into Firebase console → Realtime Database → Rules when they change).
- Voice calls: WebRTC mesh (`call.js`), signaling through the database.

| File | What it does |
|---|---|
| `app.js` | Main app: rooms, avatars, camera (pan/zoom), decorating, drawing, chat, chat bubble, notes, mood, garden, power-ups/kick/bonk, visitors, call UI |
| `store.js` | Tiny realtime store. `createStore(roomId, { base })` → Firebase, or local demo mode (`?demo=1`) |
| `kitchen.js` | 40 recipes, cooking mini-games, cook together (`/cook`), fridge (`/fridge`), food items |
| `tv.js` | YouTube together inside the TV (`/tv`), big screen, seek bar, mute everywhere |
| `games.js` | Chess (perft-verified engine, `/chess`) and Doodle Duel (`/doodle`, `/doodleInk`) |
| `call.js` | Group voice calls (`/call`, `/callsig`) |
| `pet.js` | Pet (`/pet`): adopt/rehome, looks, needs, growing up, naps on furniture; behaviour is computed from time + the shared record so phones stay in sync |
| `sfx.js` | Synthesized sound effects |
| `dev-server.js` | `node dev-server.js` → http://localhost:5500 for local testing |

Data lives under `rooms/{roomId}/…`; visitor doors under `guests/{code}`. Players are `a`, `b` (the couple) and `v` (one visitor).
Room coordinates: x in "room units" (100 = one screen width, living room is 200 wide), y in % of room height; CSS uses `var(--u)`.

## Working rules (important)
- **Test with `?demo=1`** (e.g. `http://localhost:5500/?room=anytestroom00001&me=a&demo=1`) so the real database isn't touched.
  Open a second tab with `&me=b` to be the partner.
- **Every release: bump the version** — replace `?v=N` with `?v=N+1` in `index.html` and all `*.js` imports, and bump
  `const VERSION` in `app.js`. Phones cache files; this forces them to update.
- Avoid generic CSS class names — clashes (`.stars`, `.note`, `.pan`, `.cup`) have broken the UI before.
- In node patch scripts, `String.replace` turns `$$` into `$`; use `split/join` instead.
- The owner likes to see a **plan before any new build** and to approve it. Ship features in small, tested rounds,
  commit with a clear message, and push to `main` to publish.
