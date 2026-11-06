// =====================================================
// APEX GYM · CUENTA EN LA NUBE (Supabase)
// La app sigue funcionando SIN cuenta: los datos se guardan en el móvil.
// Si el usuario crea una cuenta, además se guarda una copia en la nube
// para no perder nada al cambiar de móvil.
//
// Cómo funciona:
//  1. Supabase tiene una tabla "copias" con UNA fila por usuario (todos sus datos en JSON).
//  2. Cada vez que la app guarda algo, unos segundos después sube la copia.
//  3. Al abrir la app, mira si la nube tiene algo más nuevo (por ejemplo, de otro móvil).
//
// Hablamos con Supabase con fetch(), sin librerías: así se entiende cada paso.
// =====================================================

// Dirección del proyecto y clave PÚBLICA (se puede ver: la seguridad la ponen las reglas de la base de datos)
const NUBE_URL = "https://bwgukadlvyhogwtszlhl.supabase.co";
const NUBE_CLAVE = "sb_publishable_-rnOK3rj54mx7h4s0-L_yA_rgrhU6SU";
const CLAVE_NUBE = "apex-nube";          // dónde se guarda la sesión en el móvil (NO va en las copias de seguridad)

// Datos de la sesión: { email, id, token, refresco, expira, ultimaSync, pendiente, ultimoError }
let nube = leerNube();
let nubeOcupada = false;                 // evita dos sincronizaciones a la vez
let nubeSilencio = false;                // true mientras guardamos datos que vienen DE la nube (no hay que volver a subirlos)
let tSubida = null;

function leerNube() {
  try { return JSON.parse(localStorage.getItem(CLAVE_NUBE)) || null; } catch (e) { return null; }
}
function guardarNube() {
  try {
    if (nube) localStorage.setItem(CLAVE_NUBE, JSON.stringify(nube));
    else localStorage.removeItem(CLAVE_NUBE);
  } catch (e) { }
}
function conectado() { return !!(nube && nube.token); }

// ---------- Traducir los errores de Supabase a frases claras ----------
function mensajeErrorNube(datos, status) {
  const t = ((datos && (datos.error_code || datos.code || "")) + " " + (datos && (datos.msg || datos.message || datos.error_description || datos.error || ""))).toLowerCase();
  if (status === 0) return "Sin conexión a internet. Tus datos siguen guardados en el móvil.";
  if (t.indexOf("invalid login") >= 0 || t.indexOf("invalid_credentials") >= 0) return "Correo o contraseña incorrectos.";
  if (t.indexOf("already registered") >= 0 || t.indexOf("user_already_exists") >= 0) return "Ya existe una cuenta con ese correo. Pulsa «Iniciar sesión».";
  if (t.indexOf("email_not_confirmed") >= 0 || t.indexOf("not confirmed") >= 0) return "Antes tienes que confirmar tu correo: abre el email que te hemos enviado.";
  if (t.indexOf("weak_password") >= 0 || t.indexOf("password should") >= 0) return "La contraseña es muy débil. Usa al menos 8 caracteres.";
  if (t.indexOf("rate limit") >= 0 || t.indexOf("over_email_send_rate_limit") >= 0 || status === 429) return "Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.";
  if (t.indexOf("invalid") >= 0 && t.indexOf("email") >= 0) return "Ese correo no es válido.";
  if (status === 401 || status === 403) return "Tu sesión ha caducado. Vuelve a iniciar sesión.";
  return "No se ha podido conectar con la nube (" + (status || "?") + "). Inténtalo más tarde.";
}

// ---------- Petición a Supabase ----------
// Devuelve { ok, status, datos }. Nunca lanza errores: si no hay internet, ok = false y status = 0.
// sinSesion = true para entrar, crear cuenta o renovar: ahí no se manda el token (podría estar caducado)
async function pedirNube(ruta, metodo, cuerpo, extras, sinSesion) {
  const cabeceras = { "apikey": NUBE_CLAVE, "Content-Type": "application/json" };
  if (!sinSesion && nube && nube.token) cabeceras["Authorization"] = "Bearer " + nube.token;
  if (extras) for (const k in extras) cabeceras[k] = extras[k];
  let r;
  try {
    r = await fetch(NUBE_URL + ruta, { method: metodo || "GET", headers: cabeceras, body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  } catch (e) {
    return { ok: false, status: 0, datos: null };
  }
  let datos = null;
  try { const texto = await r.text(); datos = texto ? JSON.parse(texto) : null; } catch (e) { }
  return { ok: r.ok, status: r.status, datos: datos };
}

// Guarda la sesión que devuelve Supabase al entrar o crear la cuenta
function guardarSesionNube(d) {
  const antes = nube || {};
  nube = {
    email: d.user ? d.user.email : antes.email,
    id: d.user ? d.user.id : antes.id,
    token: d.access_token,
    refresco: d.refresh_token,
    expira: Date.now() + (d.expires_in || 3600) * 1000,
    ultimaSync: antes.id && d.user && antes.id !== d.user.id ? "" : (antes.ultimaSync || ""),
    pendiente: true,
    ultimoError: ""
  };
  guardarNube();
}

// El "token" dura 1 hora. Antes de usarlo, si está a punto de caducar, se renueva.
async function tokenAlDia() {
  if (!conectado()) return false;
  if (Date.now() < nube.expira - 60000) return true;
  const r = await pedirNube("/auth/v1/token?grant_type=refresh_token", "POST", { refresh_token: nube.refresco }, null, true);
  if (r.ok && r.datos && r.datos.access_token) { guardarSesionNube(r.datos); return true; }
  if (r.status === 400 || r.status === 401) {          // la sesión ya no vale: hay que volver a entrar
    nube.token = ""; nube.ultimoError = "Tu sesión ha caducado. Vuelve a iniciar sesión."; guardarNube();
  }
  return false;
}

// ---------- Cuenta ----------
// El nombre de usuario se guarda en la tabla "perfiles". Es único: la base de datos no deja repetirlo.
const FORMATO_USUARIO = /^[a-z0-9._]{3,20}$/;

async function usuarioLibreNube(nombre) {
  const r = await pedirNube("/rest/v1/rpc/usuario_libre", "POST", { nombre: nombre }, null, true);
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  return { ok: true, libre: r.datos === true };
}

async function crearCuentaNube(email, contrasena, usuario) {
  const r = await pedirNube("/auth/v1/signup?redirect_to=" + encodeURIComponent(URL_APP), "POST",
    { email: email, password: contrasena, data: { usuario: usuario } }, null, true);
  // Si justo otra persona ha cogido el nombre, la base de datos rechaza la cuenta
  if (!r.ok && r.status === 500) return { ok: false, msg: "Ese nombre de usuario ya está cogido. Prueba con otro." };
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  if (r.datos && r.datos.access_token) { guardarSesionNube(r.datos); return { ok: true }; }
  return { ok: true, confirmar: true };                // Supabase pide confirmar el correo antes de entrar
}

async function entrarNube(email, contrasena) {
  const r = await pedirNube("/auth/v1/token?grant_type=password", "POST", { email: email, password: contrasena }, null, true);
  if (!r.ok || !r.datos || !r.datos.access_token) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  guardarSesionNube(r.datos);
  return { ok: true };
}

// Vuelve a mandar el correo para confirmar la cuenta
async function reenviarNube(email) {
  const r = await pedirNube("/auth/v1/resend?redirect_to=" + encodeURIComponent(URL_APP), "POST", { type: "signup", email: email }, null, true);
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

// Lee el nombre de usuario de la cuenta ("" si aún no tiene)
async function leerUsuarioNube() {
  if (!(await tokenAlDia())) return { ok: false };
  const r = await pedirNube("/rest/v1/perfiles?select=nombre_usuario", "GET");
  if (!r.ok) return { ok: false };
  return { ok: true, usuario: (r.datos && r.datos[0] && r.datos[0].nombre_usuario) || "" };
}

// Pone o cambia el nombre de usuario de la cuenta
async function ponerUsuarioNube(nombre) {
  if (!FORMATO_USUARIO.test(nombre)) return { ok: false, msg: "El usuario debe tener de 3 a 20 letras minúsculas, números, puntos o guiones bajos." };
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/perfiles?on_conflict=usuario", "POST", { usuario: nube.id, nombre_usuario: nombre },
    { "Prefer": "resolution=merge-duplicates,return=minimal" });
  if (r.ok) return { ok: true };
  if (r.status === 409 || (r.datos && r.datos.code === "23505")) return { ok: false, msg: "Ese nombre de usuario ya está cogido. Prueba con otro." };
  return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

// ¿Se está usando la app instalada (icono en la pantalla de inicio) o el navegador?
// En el iPhone, cada uno guarda sus datos por separado.
function enAppInstalada() {
  try { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; } catch (e) { return false; }
}

async function olvidoNube(email) {
  const r = await pedirNube("/auth/v1/recover?redirect_to=" + encodeURIComponent(URL_APP), "POST", { email: email }, null, true);
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

async function cambiarContrasenaNube(contrasena) {
  if (!(await tokenAlDia())) return { ok: false, msg: "Tu sesión ha caducado. Vuelve a pedir el correo para cambiar la contraseña." };
  const r = await pedirNube("/auth/v1/user", "PUT", { password: contrasena });
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

// Cerrar sesión en la nube: los datos SIGUEN en este móvil
async function salirNube() {
  if (conectado()) await pedirNube("/auth/v1/logout", "POST");
  clearTimeout(tSubida);
  nube = null; guardarNube();
}

// Borra la cuenta y su copia en la nube (función "borrar_mi_cuenta" de la base de datos)
async function borrarCuentaNube() {
  if (!(await tokenAlDia())) return { ok: false, msg: "Para borrar la cuenta de la nube, vuelve a iniciar sesión." };
  const r = await pedirNube("/rest/v1/rpc/borrar_mi_cuenta", "POST", {});
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  nube = null; guardarNube();
  return { ok: true };
}

// ---------- Copia en la nube ----------
async function leerCopiaNube() {
  const r = await pedirNube("/rest/v1/copias?select=datos,version,actualizado", "GET");
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  return { ok: true, copia: (r.datos && r.datos[0]) || null };
}

async function subirCopiaNube() {
  const ahora = new Date().toISOString();
  const r = await pedirNube("/rest/v1/copias?on_conflict=usuario&select=actualizado", "POST",
    { usuario: nube.id, datos: estado, version: VERSION_DATOS, actualizado: ahora },
    { "Prefer": "resolution=merge-duplicates,return=representation" });
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  nube.ultimaSync = (r.datos && r.datos[0] && r.datos[0].actualizado) || ahora;
  nube.pendiente = false; nube.ultimoError = ""; guardarNube();
  return { ok: true };
}

// ¿Qué hay que hacer? (función sin internet, fácil de probar)
//  "subir": la nube no tiene nada o tiene lo mismo que ya subimos y aquí hay cambios
//  "bajar": la nube tiene algo más nuevo y aquí no hemos cambiado nada
//  "elegir": han cambiado los dos sitios (o es la primera vez en este móvil y hay datos en los dos): pregunta al usuario
//  "nada": todo al día
function decidirSync(hayLocal, copia, meta) {
  if (!copia) return hayLocal ? "subir" : "nada";
  if (!hayLocal) return "bajar";
  if (copia.actualizado === meta.ultimaSync) return meta.pendiente ? "subir" : "nada";
  return meta.pendiente ? "elegir" : "bajar";
}

// Sustituye los datos del móvil por los de la nube (se validan igual que al restaurar una copia)
function usarCopiaNube(copia) {
  const v = validarImport(JSON.stringify({ formato: "apex-gym", version: copia.version || 1, datos: copia.datos }));
  if (!v.ok) return { ok: false, msg: "La copia de la nube no es válida: " + v.msg };
  estado = v.datos;
  recalcularHistorial();
  nubeSilencio = true; guardar(); nubeSilencio = false;
  nube.ultimaSync = copia.actualizado; nube.pendiente = false; nube.ultimoError = ""; guardarNube();
  return { ok: true };
}

// Sincroniza. Devuelve { ok, hecho: "subir"|"bajar"|"elegir"|"nada", msg, copia }
async function sincronizarNube() {
  if (!conectado()) return { ok: false, msg: "No has iniciado sesión." };
  if (nubeOcupada) return { ok: true, hecho: "nada" };
  nubeOcupada = true;
  try {
    if (!(await tokenAlDia())) return { ok: false, msg: nube && nube.ultimoError ? nube.ultimoError : "Sin conexión a internet." };
    const leida = await leerCopiaNube();
    if (!leida.ok) { nube.ultimoError = leida.msg; guardarNube(); return { ok: false, msg: leida.msg }; }
    const hayLocal = !!(estado && estado.perfil && estado.modo !== "demo");
    let que = decidirSync(hayLocal, leida.copia, nube);
    if (que === "bajar" && estado && estado.activa) que = "nada";      // nunca cambiamos los datos en mitad de un entreno
    if (que === "subir") {
      const s = await subirCopiaNube();
      if (!s.ok) { nube.ultimoError = s.msg; guardarNube(); return { ok: false, msg: s.msg }; }
      if (typeof actualizarPerfilPublico === "function") await actualizarPerfilPublico();      // rango y racha para tus amigos
    }
    if (que === "bajar") {
      const u = usarCopiaNube(leida.copia);
      if (!u.ok) return { ok: false, msg: u.msg };
    }
    return { ok: true, hecho: que, copia: leida.copia };
  } finally {
    nubeOcupada = false;
  }
}

// La llama guardar() cada vez que cambian los datos: sube la copia unos segundos después
function nubeCambio() {
  if (nubeSilencio || !conectado() || !estado || estado.modo === "demo") return;
  nube.pendiente = true; guardarNube();
  clearTimeout(tSubida);
  tSubida = setTimeout(function () { if (typeof sincronizarYAvisar === "function") sincronizarYAvisar(false); }, 4000);
}

// Texto corto para Ajustes: "Guardado en la nube hace 5 min"
function textoEstadoNube() {
  if (!nube) return "";
  if (!nube.token) return nube.ultimoError || "Sesión cerrada.";
  if (nube.ultimoError) return "⚠ " + nube.ultimoError;
  if (nube.pendiente) return "Hay cambios pendientes de subir.";
  if (!nube.ultimaSync) return "Aún no se ha subido nada.";
  const min = Math.round((Date.now() - new Date(nube.ultimaSync).getTime()) / 60000);
  if (min < 1) return "✓ Guardado en la nube ahora mismo.";
  if (min < 60) return "✓ Guardado en la nube hace " + min + " min.";
  if (min < 1440) return "✓ Guardado en la nube hace " + Math.round(min / 60) + " h.";
  return "✓ Guardado en la nube el " + new Date(nube.ultimaSync).toLocaleDateString(localeApp()) + ".";
}

// Al volver del correo (confirmar cuenta o cambiar contraseña), Supabase añade a la dirección:
//   #access_token=…&refresh_token=…&expires_in=3600&type=recovery
// Esta función lo lee. Devuelve null si la dirección no trae nada de Supabase.
function leerVueltaCorreo(hash) {
  if (!hash || (hash.indexOf("access_token=") < 0 && hash.indexOf("error") < 0)) return null;
  const p = {};
  for (const trozo of hash.replace(/^#/, "").split("&")) {
    const i = trozo.indexOf("=");
    if (i > 0) p[decodeURIComponent(trozo.slice(0, i))] = decodeURIComponent(trozo.slice(i + 1).replace(/\+/g, " "));
  }
  if (p.error || p.error_description) return { error: p.error_description || p.error };
  if (!p.access_token) return null;
  return { tipo: p.type || "", access_token: p.access_token, refresh_token: p.refresh_token, expires_in: parseInt(p.expires_in) || 3600 };
}

async function datosUsuarioNube() {
  const r = await pedirNube("/auth/v1/user", "GET");
  return r.ok ? r.datos : null;
}

// =====================================================
// PARTE SOCIAL (amigos, actividad, me gusta y denuncias)
// Las reglas de la base de datos deciden quién ve qué:
//  - Solo tus amigos ven tu rango, racha, marcas y publicaciones.
//  - Un perfil "privado" no aparece al buscar ni muestra nada.
// =====================================================

// Lo último que se ha leído de la nube (se vuelve a leer al entrar en Social)
let socialNube = { cargado: false, cargando: false, error: "", amigos: [], recibidas: [], enviadas: [], posts: [] };

// Sube tu rango, racha, entrenos y 3 mejores marcas para que los vean tus amigos
async function actualizarPerfilPublico() {
  if (!conectado() || !estado || estado.modo === "demo" || !(await tokenAlDia())) return { ok: false };
  const t = miTarjeta();
  const pg = puntosGlobal();
  const datos = {
    usuario: nube.id, rango: t.rango, puntos: pg === null ? null : Math.round(pg * 10) / 10,
    racha: t.racha, entrenos: t.entrenos, marcas: t.records,
    // Menores de 16: la parte social está desactivada, así que su perfil es siempre privado
    privacidad: estado.perfil.edad < 16 ? "privado" : (estado.ajustes.privacidad || "amigos"), actualizado: new Date().toISOString()
  };
  const r = await pedirNube("/rest/v1/perfiles?on_conflict=usuario", "POST", datos, { "Prefer": "resolution=merge-duplicates,return=minimal" });
  return { ok: r.ok };
}

// Respuestas de la función "solicitar_amistad" de la base de datos
const RESPUESTAS_AMISTAD = {
  enviada: "✓ Solicitud enviada. Cuando la acepte, aparecerá en tus amigos.",
  aceptada: "✓ Ya sois amigos: esa persona ya te había enviado una solicitud.",
  ya_enviada: "Ya le habías enviado una solicitud. Falta que la acepte.",
  no_existe: "No hay ningún usuario con ese nombre (o tiene el perfil privado).",
  eres_tu: "Ese es tu propio usuario.",
  limite: "Has llegado al máximo de 200 amigos.",
  sin_sesion: "Vuelve a iniciar sesión en la nube."
};

async function solicitarAmistadNube(nombre) {
  nombre = String(nombre || "").trim().toLowerCase().replace(/^@/, "");
  if (!FORMATO_USUARIO.test(nombre)) return { ok: false, msg: "Escribe su nombre de usuario (3 a 20 letras minúsculas, números, puntos o guiones bajos)." };
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/rpc/solicitar_amistad", "POST", { nombre: nombre });
  if (!r.ok) return { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
  const ok = r.datos === "enviada" || r.datos === "aceptada";
  return { ok: ok, msg: RESPUESTAS_AMISTAD[r.datos] || "No se ha podido enviar la solicitud." };
}

async function aceptarAmistadNube(otro) {
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/amistades?de=eq." + encodeURIComponent(otro) + "&a=eq." + nube.id, "PATCH", { aceptada: true }, { "Prefer": "return=minimal" });
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

// Sirve para rechazar una solicitud, cancelar la tuya o quitar a un amigo
async function borrarAmistadNube(otro) {
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const yo = nube.id, o = encodeURIComponent(otro);
  const r = await pedirNube("/rest/v1/amistades?or=(and(de.eq." + yo + ",a.eq." + o + "),and(de.eq." + o + ",a.eq." + yo + "))", "DELETE", null, { "Prefer": "return=minimal" });
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

async function publicarNube(tipo, texto) {
  if (!conectado() || !(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/publicaciones", "POST", { tipo: tipo, texto: String(texto).slice(0, 280) }, { "Prefer": "return=minimal" });
  if (!r.ok && (r.status === 401 || r.status === 403)) return { ok: false, msg: "Has llegado al límite de 20 publicaciones al día." };
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

async function borrarPublicacionNube(id) {
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/publicaciones?id=eq." + encodeURIComponent(id), "DELETE", null, { "Prefer": "return=minimal" });
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

async function meGustaNube(id, poner) {
  if (!(await tokenAlDia())) return { ok: false };
  const r = poner
    ? await pedirNube("/rest/v1/me_gusta", "POST", { publicacion: id }, { "Prefer": "return=minimal" })
    : await pedirNube("/rest/v1/me_gusta?publicacion=eq." + encodeURIComponent(id) + "&usuario=eq." + nube.id, "DELETE", null, { "Prefer": "return=minimal" });
  return { ok: r.ok };
}

async function denunciarNube(id, motivo) {
  if (!(await tokenAlDia())) return { ok: false, msg: "Vuelve a iniciar sesión en la nube." };
  const r = await pedirNube("/rest/v1/denuncias", "POST", { publicacion: id, motivo: String(motivo).slice(0, 300) }, { "Prefer": "return=minimal" });
  return r.ok ? { ok: true } : { ok: false, msg: mensajeErrorNube(r.datos, r.status) };
}

// Lee amistades, perfiles de amigos y publicaciones, y lo deja en socialNube
async function cargarSocialNube() {
  if (!conectado() || socialNube.cargando) return;
  socialNube.cargando = true;
  try {
    if (!(await tokenAlDia())) { socialNube.error = "Vuelve a iniciar sesión en la nube."; return; }
    const yo = nube.id;
    const am = await pedirNube("/rest/v1/amistades?select=de,a,aceptada,creado", "GET");
    if (!am.ok) { socialNube.error = mensajeErrorNube(am.datos, am.status); return; }
    const otros = [];
    for (const x of am.datos) otros.push(x.de === yo ? x.a : x.de);
    let perfiles = [];
    if (otros.length) {
      const pr = await pedirNube("/rest/v1/perfiles?select=usuario,nombre_usuario,rango,puntos,racha,entrenos,marcas,actualizado&usuario=in.(" + otros.join(",") + ")", "GET");
      if (pr.ok) perfiles = pr.datos;
    }
    const perfilDe = function (id) { return perfiles.find(function (p) { return p.usuario === id; }) || null; };
    socialNube.amigos = []; socialNube.recibidas = []; socialNube.enviadas = [];
    for (const x of am.datos) {
      const otro = x.de === yo ? x.a : x.de;
      const p = perfilDe(otro);
      const item = { id: otro, usuario: p ? p.nombre_usuario : null, perfil: p };
      if (x.aceptada) socialNube.amigos.push(item);
      else if (x.a === yo) socialNube.recibidas.push(item);
      else socialNube.enviadas.push(item);
    }
    const po = await pedirNube("/rest/v1/publicaciones?select=id,autor,tipo,texto,creado,me_gusta(usuario)&order=creado.desc&limit=50", "GET");
    socialNube.posts = po.ok ? po.datos.map(function (x) {
      const p = x.autor === yo ? null : perfilDe(x.autor);
      return { id: x.id, mio: x.autor === yo, autor: x.autor === yo ? (estado ? estado.perfil.usuario : "") : (p ? p.nombre_usuario : "?"),
        tipo: x.tipo, texto: x.texto, fecha: String(x.creado).slice(0, 10), likes: (x.me_gusta || []).map(function (l) { return l.usuario; }) };
    }) : [];
    socialNube.error = ""; socialNube.cargado = true;
  } finally {
    socialNube.cargando = false;
  }
}

// Ranking: tú y tus amigos ordenados por rango y puntos
function rankingAmigos() {
  const lista = socialNube.amigos.filter(function (a) { return a.perfil; }).map(function (a) {
    return { usuario: a.usuario, rango: a.perfil.rango, puntos: a.perfil.puntos || 0, racha: a.perfil.racha || 0, entrenos: a.perfil.entrenos || 0, marcas: a.perfil.marcas || [], id: a.id, yo: false };
  });
  if (estado && estado.perfil) {
    const t = miTarjeta(); const pg = puntosGlobal();
    lista.push({ usuario: estado.perfil.usuario, rango: t.rango, puntos: pg || 0, racha: t.racha, entrenos: t.entrenos, marcas: t.records, id: "yo", yo: true });
  }
  lista.sort(function (a, b) { return ((b.rango === null ? -1 : b.rango) - (a.rango === null ? -1 : a.rango)) || (b.puntos - a.puntos); });
  return lista;
}

// =====================================================
// AVISOS PUSH: recordatorios que llegan aunque la app esté cerrada
// La app calcula los avisos de los próximos 21 días y los guarda en Supabase.
// Una tarea de Supabase los envía a su hora. No hace falta tener cuenta:
// cada móvil se identifica con un código aleatorio que se guarda en el propio móvil.
// =====================================================
const PUSH_FUNCION = NUBE_URL + "/functions/v1/enviar-avisos";
// Clave pública "anon" de Supabase (como la publicable): solo sirve para llamar a la función de avisos
const NUBE_ANON_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Z3VrYWRsdnlob2d3dHN6bGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTkzOTcsImV4cCI6MjEwOTI5NTM5N30.d01Bb5U-P9twSVV3aPYNjmZcjRpGDMAlR-OuMaa1fsk";
const CLAVE_PUSH_ID = "apex-push-id";
const CLAVE_PUSH_OK = "apex-push-ok";
let pushOcupado = false;

// ¿Este navegador puede recibir avisos push?
function pushDisponible() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined";
}
// Código aleatorio de este móvil (se crea una vez)
function idDispositivoPush() {
  try {
    let id = localStorage.getItem(CLAVE_PUSH_ID);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
      localStorage.setItem(CLAVE_PUSH_ID, id);
    }
    return id;
  } catch (e) { return ""; }
}
// ¿Hay algún tipo de recordatorio activado en Ajustes?
function avisosActivados() {
  const n = estado.ajustes.notif || {};
  return n.recordatorios !== false || n.racha !== false || n.retos !== false;
}
// Los avisos push están funcionando si se guardaron bien hace 3 días o menos
function pushActivo() {
  try {
    const f = localStorage.getItem(CLAVE_PUSH_OK);
    return !!f && diasEntre(f, hoy()) <= 3;
  } catch (e) { return false; }
}
function marcarPush(fecha) { try { localStorage.setItem(CLAVE_PUSH_OK, fecha); } catch (e) { } }
// La clave pública viene en "base64 de URL" y el navegador la quiere en bytes
function base64aBytes(texto) {
  const relleno = "=".repeat((4 - texto.length % 4) % 4);
  const normal = (texto + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(normal);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
// Apunta el móvil a los avisos push y sube los avisos de los próximos 21 días
async function sincronizarAvisosPush() {
  if (!pushDisponible() || !estado || !estado.perfil || estado.modo === "demo") return false;
  if (Notification.permission !== "granted") return false;
  const disp = idDispositivoPush();
  if (!disp || pushOcupado) return false;
  pushOcupado = true;
  try {
    if (!avisosActivados()) {                       // todo desactivado: se borra del servidor
      await pedirNube("/rest/v1/rpc/borrar_avisos", "POST", { disp: disp }, null, true);
      marcarPush("");
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const r = await pedirNube("/rest/v1/rpc/clave_publica_push", "POST", {}, null, true);
      if (!r.ok || !r.datos) return false;
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64aBytes(r.datos) });
    }
    const lista = planAvisos(new Date(), 21).map(function (a) {
      return { cuando: a.cuando, titulo: tr(a.titulo), texto: tr(a.texto) };   // se guardan ya traducidos
    });
    const g = await pedirNube("/rest/v1/rpc/guardar_avisos", "POST", { disp: disp, sub: sub.toJSON(), lista: lista }, null, true);
    if (g.ok) marcarPush(hoy());
    return g.ok;
  } catch (e) {
    return false;
  } finally {
    pushOcupado = false;
  }
}
// Borra este móvil del servidor de avisos (al borrar todos los datos)
async function borrarAvisosPush() {
  const disp = idDispositivoPush();
  if (disp) await pedirNube("/rest/v1/rpc/borrar_avisos", "POST", { disp: disp }, null, true);
  marcarPush("");
}
// Envía un aviso de prueba por push: así se comprueba que llegan con la app cerrada
async function probarAvisoPush(titulo, texto) {
  const ok = await sincronizarAvisosPush();
  if (!ok) return false;
  try {
    const r = await fetch(PUSH_FUNCION, {
      method: "POST",
      headers: { "Authorization": "Bearer " + NUBE_ANON_JWT, "Content-Type": "application/json" },
      body: JSON.stringify({ probar: idDispositivoPush(), titulo: tr(titulo), texto: tr(texto) })
    });
    const d = await r.json();
    return !!d.ok;
  } catch (e) { return false; }
}
