// =====================================================
// APEX GYM · IDIOMAS (español, inglés y francés)
// La app está escrita en español. Este archivo cambia los textos de la pantalla
// al idioma elegido usando la lista de idiomas.js.
//
// Cómo funciona:
//  1. Cada vez que la app pinta algo, un "observador" (MutationObserver) lo ve.
//  2. Busca cada texto en la lista de traducciones y lo cambia.
//  3. Los números se tratan aparte: "Serie 3" se busca como "Serie {n}" y luego se vuelve a poner el 3.
// =====================================================

const IDIOMAS = { es: "Español", en: "English", fr: "Français" };
const LOCALES_APP = { es: "es-ES", en: "en-GB", fr: "fr-FR" };
const CLAVE_IDIOMA = "apex-idioma";

// Idioma elegido. Si nunca se ha elegido, se usa el del móvil (español para catalán, gallego y euskera).
function elegirIdioma() {
  try {
    const guardado = localStorage.getItem(CLAVE_IDIOMA);
    if (guardado && IDIOMAS[guardado]) return guardado;
  } catch (e) { }
  const movil = ((typeof navigator !== "undefined" && navigator.language) || "es").slice(0, 2).toLowerCase();
  if (movil === "fr") return "fr";
  if (["es", "ca", "gl", "eu"].includes(movil)) return "es";
  return "en";
}
var IDIOMA_ACTUAL = elegirIdioma();

function cambiarIdioma(nuevo) {
  if (!IDIOMAS[nuevo]) return;
  try { localStorage.setItem(CLAVE_IDIOMA, nuevo); } catch (e) { }
  location.reload();            // se vuelve a pintar todo ya en el idioma nuevo
}

// Textos que tienen un trozo variable ({x}): nombres de ejercicios, de personas…
// El trozo variable se traduce también si está en la lista.
const PATRONES = [
  ["Hola, {x}", "Hi, {x}", "Salut, {x}"],
  ["Animación del movimiento: {x}", "Movement animation: {x}", "Animation du mouvement : {x}"],
  ["Animación del patrón: {x}", "Pattern animation: {x}", "Animation du schéma : {x}"],
  ["Academia · {x}", "Academy · {x}", "Académie · {x}"],
  ["Nuevo récord en {x}", "New record in {x}", "Nouveau record en {x}"],
  ["Series de {x}", "{x} sets", "Séries de {x}"],
  ["Siguiente paso · {x}", "Next step · {x}", "Étape suivante · {x}"],
  ["Próximo ascenso · {x}", "Next promotion · {x}", "Prochaine montée · {x}"],
  ["Rango {x}", "{x} rank", "Rang {x}"],
  ["Ha subido a {x} en {x}", "Moved up to {x} in {x}", "Est passé {x} en {x}"],
  ["Datos de @{x}", "Data from @{x}", "Données de @{x}"],
  ["Entreno en curso · {x}", "Workout in progress · {x}", "Séance en cours · {x}"],
  ["Para tener más datos en este grupo puedes añadir: {x}", "To get more data in this group you can add: {x}", "Pour avoir plus de données dans ce groupe, tu peux ajouter : {x}"],
  ["Para subir, mejora tus músculos más flojos: {x}", "To move up, improve your weakest muscles: {x}", "Pour monter, améliore tes muscles les plus faibles : {x}"],
  ["Cambiar por {x}", "Swap for {x}", "Remplacer par {x}"],
  ["✓ Cambiado por {x}", "✓ Swapped for {x}", "✓ Remplacé par {x}"],
  ["Quitado: {x}", "Removed: {x}", "Retiré : {x}"],
  ["Tu rutina actual «{x}» se sustituirá.", "Your current routine “{x}” will be replaced.", "Ton programme actuel « {x} » sera remplacé."],
  ["El usuario «{x}» ya está cogido. Prueba con otro.", "The username “{x}” is already taken. Try another one.", "Le nom d’utilisateur « {x} » est déjà pris. Essaie un autre."]
];

let traductorDicc = null;        // diccionario: clave en español → texto traducido
let traductorPatrones = [];
const traductorCache = new Map();

function prepararTraductor() {
  if (traductorDicc || IDIOMA_ACTUAL === "es" || typeof TRADUCCIONES === "undefined") return;
  const i = IDIOMA_ACTUAL === "en" ? 0 : 1;
  traductorDicc = {};
  for (const clave in TRADUCCIONES) traductorDicc[clave] = TRADUCCIONES[clave][i];
  const col = IDIOMA_ACTUAL === "en" ? 1 : 2;
  traductorPatrones = PATRONES.map(function (p) {
    // "Hola, {x}" → /^Hola, (.+?)$/  (los caracteres especiales se escapan)
    const partes = p[0].split("{x}").map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    return { re: new RegExp("^" + partes.join("(.+?)") + "$"), destino: p[col] };
  });
}

// Traduce un texto. Si no lo encuentra, lo devuelve tal cual.
function tr(texto) {
  if (IDIOMA_ACTUAL === "es" || !texto) return texto;
  prepararTraductor();
  if (!traductorDicc) return texto;
  if (traductorCache.has(texto)) return traductorCache.get(texto);
  const r = traducirSinCache(texto);
  if (traductorCache.size > 5000) traductorCache.clear();
  traductorCache.set(texto, r);
  return r;
}

function traducirSinCache(texto) {
  // Se respetan los espacios del principio y del final
  const ini = texto.match(/^\s*/)[0], fin = texto.match(/\s*$/)[0];
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio || !/[a-záéíóúñ]/i.test(limpio)) return texto;
  // Varias líneas: cada una por separado
  if (limpio.indexOf("\n") >= 0) return texto.split("\n").map(tr).join("\n");
  const t = traducirFrase(limpio);
  return t === null ? texto : ini + t + fin;
}

// Devuelve la traducción o null si no la conoce
function traducirFrase(frase) {
  // 1. Tal cual, cambiando los números por {n}
  const numeros = [];
  const clave = frase.replace(/\d+(?:[.,]\d+)?/g, function (n) { numeros.push(n); return "{n}"; });
  const encontrado = traductorDicc[clave];
  if (encontrado !== undefined) {
    let k = 0;
    return encontrado.replace(/\{n\}/g, function () { return numeros[k++] || ""; });
  }
  // 2. Con un trozo variable
  for (const p of traductorPatrones) {
    const m = frase.match(p.re);
    if (!m) continue;
    let k = 1;
    return p.destino.replace(/\{x\}/g, function () { const trozo = m[k++] || ""; const t = traducirFrase(trozo); return t === null ? trozo : t; });
  }
  // 3. Partes separadas por " · " o por ", " (listas): cada parte por su cuenta
  // Con " · " basta con que se conozca alguna parte; con ", " y " / " tienen que conocerse todas
  for (const sep of [" · ", ", ", " / "]) {
    if (frase.indexOf(sep) < 0) continue;
    const partes = frase.split(sep);
    let conocidas = 0;
    const trad = partes.map(function (p) { const t = traducirFrase(p); if (t !== null) conocidas++; return t === null ? p : t; });
    if (sep === " · " ? conocidas > 0 : conocidas === partes.length) return trad.join(sep);
  }
  return null;
}

// ---------- Traducir la pantalla ----------
const ATRIBUTOS_TRADUCIBLES = ["placeholder", "aria-label", "title"];

// No se traducen: código, estilos, lo que escribe el usuario y lo marcado con data-no-traducir
function saltarElemento(el) {
  return !el || el.closest("script, style, [data-no-traducir], [contenteditable]");
}

// Recordamos lo que ya hemos traducido nosotros, para no volver a traducirlo (evita bucles)
const traducidoPorMi = new WeakMap();

function traducirNodoTexto(n) {
  if (traducidoPorMi.get(n) === n.nodeValue) return;
  if (saltarElemento(n.parentElement) || n.parentElement.closest("textarea")) return;
  const nuevo = tr(n.nodeValue);
  if (nuevo !== n.nodeValue) { n.nodeValue = nuevo; traducidoPorMi.set(n, nuevo); }
}

function traducirAtributos(el) {
  if (saltarElemento(el)) return;
  let hechos = traducidoPorMi.get(el);
  for (const a of ATRIBUTOS_TRADUCIBLES) {
    const v = el.getAttribute(a);
    if (!v || (hechos && hechos[a] === v)) continue;
    const nuevo = tr(v);
    if (nuevo !== v) {
      el.setAttribute(a, nuevo);
      if (!hechos) { hechos = {}; traducidoPorMi.set(el, hechos); }
      hechos[a] = nuevo;
    }
  }
}

function traducirArbol(raiz) {
  if (raiz.nodeType === 3) { traducirNodoTexto(raiz); return; }
  if (raiz.nodeType !== 1) return;
  traducirAtributos(raiz);
  const recorrido = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = recorrido.nextNode())) {
    if (n.nodeType === 3) traducirNodoTexto(n); else traducirAtributos(n);
  }
}

function iniciarTraductor() {
  document.documentElement.lang = IDIOMA_ACTUAL;
  if (IDIOMA_ACTUAL === "es") return;
  prepararTraductor();
  document.title = tr(document.title);
  traducirArbol(document.body);
  new MutationObserver(function (cambios) {
    for (const c of cambios) {
      if (c.type === "childList") { for (const n of c.addedNodes) traducirArbol(n); }
      else if (c.type === "characterData") traducirNodoTexto(c.target);
      else if (c.type === "attributes") traducirAtributos(c.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS_TRADUCIBLES });
}
