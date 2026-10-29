// Recepção L9 — funciona offline: guarda o app no celular e busca atualizações quando há internet.
const VERSAO = 'recepcao-l9-v9';
const APP = ['./', './index.html', './manifest.webmanifest', './vendor/jspdf.umd.min.js',
  './icons/logo.png', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './fonts/jost-latin-400-normal.woff2', './fonts/jost-latin-500-normal.woff2',
  './fonts/ibm-plex-sans-latin-400-normal.woff2', './fonts/ibm-plex-sans-latin-500-normal.woff2', './fonts/ibm-plex-sans-latin-600-normal.woff2',
  './fonts/ibm-plex-mono-latin-400-normal.woff2', './fonts/ibm-plex-mono-latin-500-normal.woff2'];

// A versão nova fica esperando; o app mostra o aviso "Atualizar" e só troca quando a pessoa toca.
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSAO).then(c => c.addAll(APP))); });
self.addEventListener('message', e => { if (e.data === 'atualizar') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const comTempo = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tempo')), ms))]);
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    // Página: tenta a versão nova (até 3,5 s); sem sinal, abre a guardada.
    e.respondWith(comTempo(fetch(req), 3500).then(res => { const cp = res.clone(); caches.open(VERSAO).then(c => c.put('./index.html', cp)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const rede = fetch(req).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSAO).then(c => c.put(req, cp)); } return res; });
    return hit ? (rede.catch(() => {}), hit) : rede;
  }));
});
