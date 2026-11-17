// Service Worker - roteiro Monsanto, Idanha-a-Velha e Penha Garcia
// Para forcar a atualizacao nos telemoveis depois de mudar ficheiros, mude o numero da versao abaixo.
const VERSAO = 'v2';
const CACHE = 'euro-tours-monsanto-idanha-penha-garcia-' + VERSAO;
const CORE = [
  './', './index.html', './manifest.json', './pontos-tour.json',
  'images/logo-euro-tours.png',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  'https://unpkg.com/leaflet/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))   // um ficheiro em falta nao bloqueia os outros
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k.startsWith('euro-tours-monsanto-idanha-penha-garcia-') && k !== CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pagina: tenta a rede, se falhar usa a cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Imagens, audio, mapa, leaflet, fontes: cache primeiro, atualiza em segundo plano
  const permitido = url.origin === location.origin ||
    /tile\.openstreetmap\.org$|unpkg\.com$|fonts\.googleapis\.com$|fonts\.gstatic\.com$/.test(url.hostname);
  if (!permitido) return;

  e.respondWith(
    caches.match(req).then(cached => {
      const rede = fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
        return r;
      }).catch(() => cached);
      return cached || rede;
    })
  );
});
