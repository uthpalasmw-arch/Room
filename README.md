# 🏠 Our Room

A cozy little online home for two, with a **living room** and a **bedroom**. Either of you
can come in any time. You can walk around, chat, voice call, react, and bonk each other with a bat 🏏.
You can also add furniture, hang photos from your gallery, draw on the walls, and pin notes.
Everything stays there for the other person to find. Games are coming next.

House rule: drawings and words on the wall are protected from the *other* person for
1 hour after they're made. Stickers, furniture and photos can be moved or removed by
either of you at any time.

Works in Safari (iPhone) and Chrome (Android). Costs nothing.

---

## 1. Test it on your computer (demo mode)

```
node dev-server.js
```

Open http://localhost:5500. In demo mode (the yellow **DEMO** badge) the room lives
only in this browser. To be both players, open a second tab and add `&me=b` to the address.

## 2. Go online: set up Firebase (free, about 5 minutes)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. **Create a project** → name it `our-room` → you can turn off Google Analytics → **Create**.
3. Left menu **Build → Authentication** → **Get started** → **Sign-in method** tab →
   **Anonymous** → turn on **Enable** → **Save**.
4. Left menu **Build → Realtime Database** → **Create database** → choose a location
   (for example `asia-southeast1` Singapore, or whichever is closest to you both) →
   **Start in locked mode** → **Enable**.
5. Still in Realtime Database, open the **Rules** tab. Replace everything with the contents of
   `database.rules.json`, then click **Publish**.
6. Click the ⚙️ gear next to "Project Overview" → **Project settings** → scroll to **Your apps** →
   click the **`</>`** (Web) icon → nickname `our-room` → **Register app**
   (do NOT tick Firebase Hosting).
7. You'll see a `firebaseConfig = { ... }` block. Copy it into `config.js`:

```js
firebase: {
  apiKey: "…",
  authDomain: "…",
  databaseURL: "https://…firebasedatabase.app",
  projectId: "…",
  storageBucket: "…",
  messagingSenderId: "…",
  appId: "…"
},
```

Make sure `databaseURL` is included. If it's missing, copy it from the top of the
Realtime Database page.

> These Firebase keys are meant to be public. They are safe to put on a website.
> Your privacy comes from the secret room code in your invite link, plus the rules
> from step 5.

## 3. Put it online (GitHub Pages, free)

Voice calls and the microphone need **https**, so the room must be hosted.
Upload this folder to a GitHub repository, then turn on **Settings → Pages →
Deploy from branch → main → / (root)**. After a minute your room is at
`https://<your-username>.github.io/our-room/`.

## 4. Start using it

1. Open the site on your phone → **Make our room** → pick your character.
2. Tap your name (top-left) → **Share** the invite link with your partner.
3. Your partner opens the link on the iPhone → picks the other character.
4. On each phone: **Add to Home Screen**. On iPhone that's Safari → Share → *Add to Home Screen*;
   on Android it's Chrome → ⋮ → *Add to Home screen*.

⚠️ On iPhone, open the invite link in **Safari** first, then add it to the home screen from
Safari. That way the home-screen icon remembers the room.

## Calls

Calls go directly phone to phone. If a call keeps saying *"couldn't connect"*, one of your
networks is blocking direct connections. You can fix that with a free relay:

1. Sign up at https://www.metered.ca/tools/openrelay/ (free tier) or Cloudflare Calls TURN (free tier).
2. They give you TURN server details. Add them to `config.js`:

```js
turn: [{ urls: 'turn:…:443?transport=tcp', username: '…', credential: '…' }],
```

## Files

| File | What it is |
|---|---|
| `index.html`, `style.css` | The room's look |
| `app.js` | Everything you can do in the room |
| `call.js` | Voice calls |
| `store.js` | Saving and syncing (Firebase, or demo mode) |
| `sfx.js` | Little sound effects |
| `config.js` | **Your settings: paste Firebase here** |
| `database.rules.json` | Security rules to paste into Firebase |
