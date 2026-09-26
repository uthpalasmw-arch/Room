// ─────────────────────────────────────────────────────────────
//  Our Room — settings
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  // Paste your Firebase web app config here (see README.md, step 2).
  // While this is null the room runs in DEMO MODE: it only works on
  // this one device (handy for testing in two browser tabs).
  firebase: {
    apiKey: 'AIzaSyAL7QX6eVw0pduQlZAuoNnEULJ6H-q1bdM',
    authDomain: 'home-8204a.firebaseapp.com',
    databaseURL: 'https://home-8204a-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId: 'home-8204a',
    storageBucket: 'home-8204a.firebasestorage.app',
    messagingSenderId: '998881098083',
    appId: '1:998881098083:web:c2379c9b476d1130223b56',
  },

  // Optional relay servers for voice calls. Only needed if calls
  // fail to connect on some mobile networks (see README.md → "Calls").
  turn: [],
};
