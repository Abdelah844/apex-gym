// =====================================================
// FOTOS DE PROGRESO
// Se guardan SOLO en este móvil (IndexedDB, una base de datos del navegador).
// No se suben a la nube ni van en la copia de seguridad: son privadas.
// =====================================================

const FOTOS_BD = "apix-fotos";        // nombre de la base de datos
const FOTOS_ALMACEN = "fotos";        // "tabla" donde van las fotos
let urlsFotos = [];                   // direcciones temporales de las miniaturas (se liberan al repintar)
let borrarFotoId = null;              // foto que espera la segunda pulsación para borrarse

// Abre (o crea la primera vez) la base de datos de fotos
function abrirFotosBD() {
  return new Promise(function (ok, mal) {
    if (!window.indexedDB) { mal(new Error("sin IndexedDB")); return; }
    const pet = indexedDB.open(FOTOS_BD, 1);
    pet.onupgradeneeded = function () {
      pet.result.createObjectStore(FOTOS_ALMACEN, { keyPath: "id", autoIncrement: true });
    };
    pet.onsuccess = function () { ok(pet.result); };
    pet.onerror = function () { mal(pet.error); };
  });
}

// Hace una operación en el almacén de fotos y devuelve el resultado
async function operacionFotos(modo, accion) {
  const bd = await abrirFotosBD();
  return new Promise(function (ok, mal) {
    const tx = bd.transaction(FOTOS_ALMACEN, modo);
    const pet = accion(tx.objectStore(FOTOS_ALMACEN));
    tx.oncomplete = function () { ok(pet ? pet.result : undefined); bd.close(); };
    tx.onerror = function () { mal(tx.error); bd.close(); };
  });
}

function listarFotos() {
  return operacionFotos("readonly", function (al) { return al.getAll(); }).then(function (lista) {
    return (lista || []).sort(function (a, b) { return a.fecha < b.fecha ? -1 : (a.fecha > b.fecha ? 1 : a.id - b.id); });
  });
}
function guardarFotoBD(blob) { return operacionFotos("readwrite", function (al) { return al.add({ fecha: hoy(), blob: blob }); }); }
function borrarFotoBD(id) { return operacionFotos("readwrite", function (al) { return al.delete(id); }); }

// Reduce la foto (lado largo de 1080 px, JPEG) para que no ocupe tanto en el móvil
async function reducirFoto(archivo) {
  const bmp = await createImageBitmap(archivo);
  const escala = Math.min(1, 1080 / Math.max(bmp.width, bmp.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bmp.width * escala);
  lienzo.height = Math.round(bmp.height * escala);
  lienzo.getContext("2d").drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
  return new Promise(function (ok) { lienzo.toBlob(ok, "image/jpeg", 0.82); });
}

// Tarjeta de la pestaña Cuerpo (las fotos se cargan después, porque leerlas tarda un poco)
function htmlFotosProgreso() {
  return '<div class="card stack"><h3>Fotos de progreso</h3>' +
    '<p class="muted small">Hazte una foto al mes, con la misma luz y en la misma postura, y compara cómo cambias. Solo se guardan en este móvil: no se suben a la nube ni van en la copia de seguridad.</p>' +
    '<label class="btn">📷 Añadir foto<input type="file" accept="image/*" data-foto-nueva hidden></label>' +
    '<div id="zonaFotos"><p class="muted small">Cargando fotos…</p></div></div>';
}

// Rellena la zona de fotos: comparador antes/después y miniaturas
async function pintarFotos() {
  const zona = $("zonaFotos");
  if (!zona) return;
  let fotos;
  try { fotos = await listarFotos(); }
  catch (e) { zona.innerHTML = '<p class="muted small">Este navegador no deja guardar fotos.</p>'; return; }
  for (const u of urlsFotos) URL.revokeObjectURL(u);
  urlsFotos = fotos.map(function (f) { return URL.createObjectURL(f.blob); });
  if (!fotos.length) { zona.innerHTML = '<p class="muted small">Aún no tienes fotos.</p>'; return; }

  let h = "";
  // Comparador: la primera foto (antes) y la última (después). Deslizas para ver una u otra.
  if (fotos.length >= 2) {
    const primera = fotos[0], ultima = fotos[fotos.length - 1];
    h += '<div class="comparador" id="comparador">' +
      '<img src="' + urlsFotos[urlsFotos.length - 1] + '" alt="Después">' +
      '<div class="comparador-antes" id="comparadorAntes"><img src="' + urlsFotos[0] + '" alt="Antes"></div>' +
      '<div class="comparador-linea" id="comparadorLinea"></div>' +
      '<span class="comparador-etiqueta izq">' + fechaBonita(primera.fecha) + '</span>' +
      '<span class="comparador-etiqueta der">' + fechaBonita(ultima.fecha) + '</span></div>' +
      '<input type="range" min="0" max="100" value="50" data-comparar aria-label="Antes y después">' +
      '<p class="muted small" style="text-align:center">Desliza: izquierda, antes · derecha, después</p>';
  }
  // Miniaturas con su fecha y un botón para borrar
  h += '<div class="fotos-lista">' + fotos.map(function (f, i) {
    const pidiendo = borrarFotoId === f.id;
    return '<figure><img src="' + urlsFotos[i] + '" alt="' + fechaBonita(f.fecha) + '"><figcaption>' + fechaBonita(f.fecha) + '</figcaption>' +
      '<button class="foto-borrar' + (pidiendo ? " pidiendo" : "") + '" data-act="borrar-foto" data-a="' + f.id + '">' + (pidiendo ? "¿Borrar?" : "✕") + '</button></figure>';
  }).join("") + '</div>';
  zona.innerHTML = h;
  // Ajusta el comparador a la mitad al empezar
  moverComparador(50);
}

// Mueve la línea del comparador (0 = todo "después", 100 = todo "antes")
function moverComparador(valor) {
  const antes = $("comparadorAntes"), linea = $("comparadorLinea");
  if (!antes || !linea) return;
  antes.style.clipPath = "inset(0 " + (100 - valor) + "% 0 0)";
  linea.style.left = valor + "%";
}

// Se ha elegido una foto nueva en el móvil
async function anadirFotoProgreso(archivo) {
  if (!archivo) return;
  toast("Guardando la foto…");
  try {
    const reducida = await reducirFoto(archivo);
    await guardarFotoBD(reducida);
    // Pide al navegador que no borre las fotos aunque el móvil vaya justo de espacio
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { });
    toast("✓ Foto guardada", "ok");
  } catch (e) {
    toast("No se ha podido guardar la foto", "error");
  }
  pintarFotos();
}

// Primera pulsación: pregunta. Segunda pulsación: borra.
async function pedirBorrarFoto(id) {
  id = parseInt(id);
  if (borrarFotoId !== id) { borrarFotoId = id; pintarFotos(); return; }
  borrarFotoId = null;
  try { await borrarFotoBD(id); toast("Foto borrada", "ok"); } catch (e) { toast("No se ha podido borrar", "error"); }
  pintarFotos();
}
