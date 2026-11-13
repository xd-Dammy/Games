const CACHE_NAME = 'xd-arcade-v13';
const CORE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/game-shared.css',
  './css/boardkit.css',
  './js/app.js',
  './js/pause.js',
  './js/howto.js',
  './js/boardtheme.js',
  './manifest.json',
  './games/tictactoe/index.html',
  './games/tictactoe/style.css',
  './games/tictactoe/game.js',
  './games/snake/index.html',
  './games/snake/style.css',
  './games/snake/game.js',
  './games/sudoku/index.html',
  './games/sudoku/style.css',
  './games/sudoku/game.js',
  './games/2048/index.html',
  './games/2048/style.css',
  './games/2048/game.js',
  './games/memory/index.html',
  './games/memory/style.css',
  './games/memory/game.js',
  './games/minesweeper/index.html',
  './games/minesweeper/style.css',
  './games/minesweeper/game.js',
  './games/wordguess/index.html',
  './games/wordguess/style.css',
  './games/wordguess/game.js',
  './games/sliding/index.html',
  './games/sliding/style.css',
  './games/sliding/game.js',
  './games/lightsout/index.html',
  './games/lightsout/style.css',
  './games/lightsout/game.js',
  './games/simon/index.html',
  './games/simon/style.css',
  './games/simon/game.js',
  './games/connect4/index.html',
  './games/connect4/style.css',
  './games/connect4/game.js',
  './games/whack/index.html',
  './games/whack/style.css',
  './games/whack/game.js',
  './games/hangman/index.html',
  './games/hangman/style.css',
  './games/hangman/game.js',
  './games/mathrush/index.html',
  './games/mathrush/style.css',
  './games/mathrush/game.js',
  './games/flap/index.html',
  './games/flap/style.css',
  './games/flap/game.js',
  './games/breakout/index.html',
  './games/breakout/style.css',
  './games/breakout/game.js',
  './games/blocks/index.html',
  './games/blocks/style.css',
  './games/blocks/game.js',
  './games/rps/index.html',
  './games/rps/style.css',
  './games/rps/game.js',
  './games/reflex/index.html',
  './games/reflex/style.css',
  './games/reflex/game.js',
  './games/pong/index.html',
  './games/pong/style.css',
  './games/pong/game.js',
  './games/riddles/index.html',
  './games/riddles/style.css',
  './games/riddles/game.js',
  './games/checkers/index.html',
  './games/checkers/style.css',
  './games/checkers/game.js',
  './games/chess/index.html',
  './games/chess/style.css',
  './games/chess/game.js',
  './scores/index.html',
  './scores/style.css',
  './scores/game.js',
  './games/lagosrush/index.html',
  './games/lagosrush/style.css',
  './games/lagosrush/engine.js',
  './games/lagosrush/art.js',
  './games/lagosrush/story.js',
  './games/lagosrush/game.js',
  './assets/lagosrush-preview.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Cache each asset individually so one missing/failed file
      // doesn't abort caching for every other game.
      Promise.all(
        CORE_ASSETS.map((asset) =>
          cache.add(new Request(asset, { cache: 'reload' })).catch((err) => {
            console.warn('Failed to cache', asset, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Network-first: when online you always get the newest files (all from the same deploy),
// and the cache is only used offline. Every good response refreshes the cache.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
