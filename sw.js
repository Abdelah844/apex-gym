// =====================================================
// APEX GYM · SERVICE WORKER
// Es un pequeño programa que el navegador ejecuta aparte de la página.
// Guarda una copia de la app en el móvil (la "caché") para que funcione SIN internet.
// Si cambias algún archivo, sube el número de VERSION para que los móviles descarguen la nueva.
// =====================================================

const VERSION = "apex-gym-2.4.0";

// Archivos que se guardan nada más instalar la app
const ARCHIVOS = [
  "./", "./index.html", "./manifest.json",
  "./datos.js", "./logica.js", "./academia.js", "./mascota.js", "./app.js", "./pruebas.js", "./eventos.js",
  "./iconos/icono-192.png", "./iconos/icono-512.png"
];

// 1. Instalar: guarda los archivos básicos
self.addEventListener("install", function (evento) {
  evento.waitUntil(caches.open(VERSION).then(function (cache) { return cache.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

// 2. Activar: borra las cachés de versiones antiguas
self.addEventListener("activate", function (evento) {
  evento.waitUntil(caches.keys().then(function (nombres) {
    return Promise.all(nombres.filter(function (n) { return n !== VERSION; }).map(function (n) { return caches.delete(n); }));
  }));
  self.clients.claim();
});

// 3. Cada vez que la app pide un archivo:
//    - Si está guardado, lo da al momento (funciona sin internet).
//    - Si no, lo descarga y guarda una copia (así las fotos se guardan cuando las ves).
self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;
  if (new URL(evento.request.url).origin !== self.location.origin) return;   // las fuentes de Google, que las gestione el navegador
  evento.respondWith(caches.match(evento.request, { ignoreSearch: true }).then(function (guardado) {
    if (guardado) return guardado;
    return fetch(evento.request).then(function (respuesta) {
      if (respuesta.ok) {
        const copia = respuesta.clone();
        caches.open(VERSION).then(function (cache) { cache.put(evento.request, copia); });
      }
      return respuesta;
    });
  }));
});
