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
async function crearCuentaNube(email, contrasena) {
  const r = await pedirNube("/auth/v1/signup?redirect_to=" + encodeURIComponent(URL_APP), "POST", { email: email, password: contrasena }, null, true);
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
  return "✓ Guardado en la nube el " + new Date(nube.ultimaSync).toLocaleDateString("es-ES") + ".";
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
