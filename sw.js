// =====================================================
// APEX GYM · SERVICE WORKER
// Es un pequeño programa que el navegador ejecuta aparte de la página.
// Guarda una copia de la app en el móvil (la "caché") para que funcione SIN internet.
// Si cambias algún archivo, sube el número de VERSION para que los móviles descarguen la nueva.
// =====================================================

const VERSION = "apex-gym-2.7.3";

// Archivos que se guardan nada más instalar la app
const ARCHIVOS = [
  "./", "./index.html", "./manifest.json", "./privacidad.html",
  "./datos.js", "./logica.js", "./academia.js", "./mascota.js", "./sonidos.js", "./app.js", "./pruebas.js", "./eventos.js",
  "./iconos/icono-192.png", "./iconos/icono-512.png",
  "./fuentes/manrope.woff", "./fuentes/chakra-petch-medium.woff", "./fuentes/chakra-petch-semibold.woff", "./fuentes/chakra-petch-bold.woff"
];

// 1. Instalar: descarga los archivos básicos SIEMPRE del servidor ("reload"),
//    nunca de la memoria del navegador, para no guardar una versión vieja.
self.addEventListener("install", function (evento) {
  evento.waitUntil(caches.open(VERSION).then(function (cache) {
    return cache.addAll(ARCHIVOS.map(function (url) { return new Request(url, { cache: "reload" }); }));
  }));
  self.skipWaiting();
});

// 2. Activar: borra las copias de versiones antiguas y toma el control enseguida
self.addEventListener("activate", function (evento) {
  evento.waitUntil(caches.keys().then(function (nombres) {
    return Promise.all(nombres.filter(function (n) { return n !== VERSION; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

// 3. Cada vez que la app pide un archivo:
//    - Fotos e iconos (no cambian): primero la copia guardada, así cargan al instante.
//    - Todo lo demás (código y página): primero internet, para tener siempre la última versión.
//      Si no hay internet, se usa la copia guardada.
self.addEventListener("fetch", function (evento) {
  if (evento.request.method !== "GET") return;
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) return;
  const esImagen = /\.(jpg|png|woff)$/.test(url.pathname);   // fotos, iconos y letras
  if (esImagen) {
    evento.respondWith(caches.match(evento.request).then(function (guardado) {
      return guardado || fetch(evento.request).then(function (r) { guardarCopia(evento.request, r); return r; });
    }));
    return;
  }
  evento.respondWith(fetch(evento.request, { cache: "no-cache" }).then(function (r) {
    guardarCopia(evento.request, r);
    return r;
  }).catch(function () {
    return caches.match(evento.request, { ignoreSearch: true }).then(function (g) { return g || caches.match("./index.html"); });
  }));
});

function guardarCopia(peticion, respuesta) {
  if (!respuesta || !respuesta.ok) return;
  const copia = respuesta.clone();
  caches.open(VERSION).then(function (cache) { cache.put(peticion, copia); });
}

// 4. Al tocar un aviso, abre la app (o la trae al frente si ya estaba abierta)
self.addEventListener("notificationclick", function (evento) {
  evento.notification.close();
  evento.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (ventanas) {
    for (const v of ventanas) if ("focus" in v) return v.focus();
    return self.clients.openWindow("./index.html");
  }));
});
