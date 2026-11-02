// =====================================================
// APEX GYM · EVENTOS (qué pasa al pulsar o escribir)
// Un solo "escuchador" para toda la página: mira el atributo data-act del botón.
// =====================================================

document.addEventListener("click", function (ev) {
  const b = ev.target.closest("[data-act], [data-tab]");
  if (!b || b.disabled) return;
  if (b.dataset.tab) { cerrarHoja(); irA(b.dataset.tab); return; }

  const act = b.dataset.act;
  const a = b.dataset.a, bb = b.dataset.b, c = b.dataset.c;
  const accion = ACCIONES[act];
  if (accion) accion(a, bb, c, b);
});

// Cerrar la hoja tocando el fondo oscuro
$("hoja").addEventListener("click", function (ev) { if (ev.target.id === "hoja") cerrarHoja(); });

const ACCIONES = {
  "instalar-app": function () {
    if (!avisoInstalar) return;
    avisoInstalar.prompt();
    avisoInstalar.userChoice.then(function () { avisoInstalar = null; hojaAjustes(); });
  },
  // ---------- Bienvenida y registro ----------
  "ir-registro": function () { pintarRegistro(); },
  "volver-bienvenida": function () { pintarBienvenida(); },
  "usar-demo": function () { crearDemo(); guardar(); tab = "inicio"; pintar(); },
  "crear-perfil": function () {
    const p = leerPerfil();
    if (!p) return;
    estado = estadoVacio(p);
    estado.rutina = generarRutina({ objetivo: p.objetivo, nivel: p.experiencia, dias: p.dias, duracion: p.duracion,
      tipo: "auto", equipo: p.equipo, prioridad: "", evitar: p.evitar });
    guardar(); tab = "inicio"; pintar();
  },
  "salir-demo": function () { estado = null; borrarAlmacenamiento(); pintarRegistro(); },
  "reintentar-guardado": function () { if (!guardar()) mensaje("No se ha podido guardar", "El almacenamiento del navegador está lleno o bloqueado. Exporta tus datos desde Ajustes para no perderlos."); },

  // ---------- Hojas ----------
  "cerrar-hoja": function () { cerrarHoja(); confirmar = ""; pintar(); },
  "abrir-ajustes": function () { confirmar = ""; hojaAjustes(); },
  "abrir-generador": function () { confirmar = ""; hojaGenerador(); },
  "abrir-biblioteca": function () { hojaBiblioteca("ver"); },
  "info-ej": function (id) { hojaEjercicio(id); },
  "ver-sesion": function (id) { confirmar = ""; hojaSesion(id); },
  "ver-grupo": function (g) { hojaGrupo(g); },
  "ver-rango-ej": function (id) { hojaRangoEj(id); },
  "como-rangos": function () { hojaComoRangos(); },

  // ---------- Generador y editor de rutina ----------
  "generar": function () {
    const equipo = [];
    for (const x of document.querySelectorAll('input[name="gEquipo"]:checked')) equipo.push(x.value);
    if (equipo.length === 0) { $("gError").textContent = "Marca al menos un tipo de equipamiento."; return; }
    const dias = parseInt($("gDias").value);
    const calendario = [];
    for (const x of document.querySelectorAll('input[name="gDia"]:checked')) calendario.push(parseInt(x.value));
    if (calendario.length !== dias) { $("gError").textContent = "Marca exactamente " + dias + " días en el calendario (has marcado " + calendario.length + ")."; return; }
    propuesta = generarRutina({ objetivo: $("gObjetivo").value, nivel: $("gNivel").value, dias: dias, calendario: calendario,
      duracion: parseInt($("gDuracion").value), tipo: $("gTipo").value, prioridad: $("gPrioridad").value, equipo: equipo, evitar: $("gEvitar").value.trim() });
    confirmar = ""; hojaPropuesta();
  },
  "usar-propuesta": function () {
    if (estado.rutina && !pideConfirmar("usar-propuesta", hojaPropuesta)) return;
    estado.rutina = propuesta; propuesta = null;
    estado.perfil.diasSemana = estado.rutina.calendario.slice();
    guardar(); cerrarHoja(); irA("entrenar");
  },
  "aplicar-sugerencia": function (i) {
    const sug = sugerenciasRutina()[parseInt(i)];
    if (sug && sug.aplicar) { mensajeSugerencia = aplicarSugerencia(sug.aplicar); guardar(); }
    pintar();
  },
  "no-hay": function (id) {
    const i = estado.noDisponibles.indexOf(id);
    if (i >= 0) estado.noDisponibles.splice(i, 1); else estado.noDisponibles.push(id);
    guardar(); hojaEjercicio(id);
  },
  "abrir-gimnasio": function () { hojaMiGimnasio(); },
  "gim-todas": function (v) {
    estado.noDisponibles = v === "1" ? [] : EJERCICIOS.filter(function (e) { return e.equipo === "maquina" || e.equipo === "polea"; }).map(function (e) { return e.id; });
    guardar(); hojaMiGimnasio();
  },
  "pausar-anim": function (x, y, z, boton) {
    animPausada = !animPausada;
    aplicarPausaAnim();
    boton.textContent = animPausada ? "▶ Reproducir" : "❚❚ Pausar";
  },
  "no-puedo": function (id) {
    const i = estado.evitados.indexOf(id);
    if (i >= 0) estado.evitados.splice(i, 1); else estado.evitados.push(id);
    guardar(); hojaEjercicio(id);
  },
  "editar-dia": function (i) { confirmar = ""; hojaEditarDia(parseInt(i)); },
  "anadir-dia": function () {
    estado.rutina.dias.push({ nombre: "Día " + (estado.rutina.dias.length + 1), ejercicios: [] });
    guardar(); hojaEditarDia(estado.rutina.dias.length - 1);
  },
  "dia-mover": function (i, k, dir) {
    const lista = estado.rutina.dias[i].ejercicios;
    k = parseInt(k); const j = k + parseInt(dir);
    const tmp = lista[k]; lista[k] = lista[j]; lista[j] = tmp;
    guardar(); hojaEditarDia(parseInt(i));
  },
  "dia-quitar": function (i, k) { estado.rutina.dias[i].ejercicios.splice(parseInt(k), 1); guardar(); hojaEditarDia(parseInt(i)); },
  "dia-sustituir": function (i, k) { hojaBiblioteca("sust-dia:" + i + ":" + k, estado.rutina.dias[i].ejercicios[k].id); },
  "dia-anadir": function (i) { hojaBiblioteca("dia:" + i); },
  "dia-duplicar": function (i) {
    const copia = JSON.parse(JSON.stringify(estado.rutina.dias[i]));
    copia.nombre += " (copia)";
    estado.rutina.dias.splice(parseInt(i) + 1, 0, copia);
    guardar(); hojaEditarDia(parseInt(i) + 1);
  },
  "dia-eliminar": function (i) {
    if (!pideConfirmar("dia-eliminar", function () { hojaEditarDia(parseInt(i)); })) return;
    estado.rutina.dias.splice(parseInt(i), 1);
    if (estado.rutina.dias.length === 0) estado.rutina = null;
    guardar(); cerrarHoja(); pintar();
  },

  // ---------- Biblioteca ----------
  "bib-grupo": function (g) { filtroBib.grupo = g; refrescarBib(); },
  "bib-equipo": function (e) { filtroBib.equipo = e; refrescarBib(); },
  "bib-fav": function () { filtroBib.favoritos = !filtroBib.favoritos; refrescarBib(); },
  "fav": function (id) {
    const i = estado.favoritos.indexOf(id);
    if (i >= 0) estado.favoritos.splice(i, 1); else estado.favoritos.push(id);
    guardar(); hojaEjercicio(id);
  },
  "elegir-ej": function (id) {
    const partes = modoBib.split(":");
    if (partes[0] === "sesion") {
      copiaSesion(); estado.activa.ejercicios.push(ejercicioParaSesion(id));
    }
    if (partes[0] === "sust-sesion") {
      copiaSesion();
      const viejo = estado.activa.ejercicios[partes[1]];
      estado.activa.ejercicios[partes[1]] = ejercicioParaSesion(id, viejo.objetivo);
    }
    if (partes[0] === "dia") {
      const e = buscarEj(id);
      const p = parametros(estado.perfil.objetivo, estado.perfil.experiencia, e.compuesto);
      estado.rutina.dias[partes[1]].ejercicios.push({ id: id, series: p.series, repMin: p.repMin, repMax: p.repMax, descanso: p.descanso });
      guardar(); hojaEditarDia(parseInt(partes[1])); return;
    }
    if (partes[0] === "sust-dia") {
      estado.rutina.dias[partes[1]].ejercicios[partes[2]].id = id;
      guardar(); hojaEditarDia(parseInt(partes[1])); return;
    }
    guardar(); cerrarHoja(); pintar();
  },

  // ---------- Sesión ----------
  "empezar-dia": function (i) {
    if (estado.activa) { irA("entrenar"); return; }
    pilaDeshacer = []; crearSesion(parseInt(i)); guardar(); irA("entrenar");
  },
  "empezar-libre": function () { pilaDeshacer = []; crearSesionLibre(); guardar(); irA("entrenar"); hojaBiblioteca("sesion"); },
  "anadir-a-sesion": function () { hojaBiblioteca("sesion"); },
  "marcar": function (ei, si) {
    const e = estado.activa.ejercicios[ei];
    const s = e.series[si];
    sesionRecuperada = false;
    if (!s.hecha) {
      const v = validarSerie(e.id, s.peso, s.reps, e.objetivo);
      if (v.nivel === "error") { s.error = v.msg; pintarSesion(); return; }
    }
    copiaSesion();
    s.hecha = !s.hecha;
    guardar(); pintarSesion();
    if (s.hecha) empezarDescanso(e.objetivo.descanso || estado.ajustes.descanso);
  },
  "copiar-anterior": function (ei, si) {
    const e = estado.activa.ejercicios[ei];
    const ultima = ultimaVez(e.id);
    if (!ultima || !ultima.series[si]) return;
    copiaSesion();
    cambiarSerie(e, parseInt(si), "peso", ultima.series[si].peso);
    cambiarSerie(e, parseInt(si), "reps", ultima.series[si].reps);
    guardar(); pintarSesion();
  },
  "confirmar-serie": function (ei, si) {
    copiaSesion();
    estado.activa.ejercicios[ei].series[si].confirmada = true;
    estado.metricas.avisosConfirmados++;
    guardar(); pintarSesion();
  },
  "confirmar-historial": function (sid, id, i) {
    const ses = estado.sesiones.find(function (x) { return x.id === sid; });
    const e = ses.ejercicios.find(function (x) { return x.id === id; });
    e.series[i].confirmada = true;
    recalcularHistorial();
    guardar(); hojaSesion(sid);
  },
  "serie-mas": function (ei) {
    copiaSesion();
    const series = estado.activa.ejercicios[ei].series;
    const ult = series[series.length - 1];
    series.push({ peso: ult ? ult.peso : 0, reps: ult ? ult.reps : 10, rpe: null, hecha: false });
    guardar(); pintarSesion();
  },
  "serie-menos": function (ei) { copiaSesion(); estado.activa.ejercicios[ei].series.pop(); guardar(); pintarSesion(); },
  "mover-ej": function (ei, dir) {
    copiaSesion();
    const l = estado.activa.ejercicios; const i = parseInt(ei), j = i + parseInt(dir);
    const tmp = l[i]; l[i] = l[j]; l[j] = tmp;
    guardar(); pintarSesion();
  },
  "quitar-ej": function (ei) { copiaSesion(); estado.activa.ejercicios.splice(parseInt(ei), 1); guardar(); pintarSesion(); },
  "sustituir-sesion": function (ei) { hojaBiblioteca("sust-sesion:" + ei, estado.activa.ejercicios[ei].id); },
  "aplicar-peso": function (ei, peso) {
    copiaSesion();
    for (const s of estado.activa.ejercicios[ei].series) if (!s.hecha) s.peso = parseFloat(peso);
    estado.metricas.aceptadas++;
    guardar(); pintarSesion();
  },
  "deshacer": function () {
    if (pilaDeshacer.length === 0) return;
    estado.activa = JSON.parse(pilaDeshacer.pop());
    guardar(); pintarSesion();
  },
  "terminar": function () {
    pararDescanso();
    const r = terminarSesion();
    pilaDeshacer = []; sesionRecuperada = false;
    tab = "inicio"; pintar();
    if (r.vacio) { mensaje("Entreno vacío", "No hay ninguna serie completada, así que no se ha guardado."); return; }
    if (r.duplicado) { abrirHoja(cabeceraHoja("Ya estaba guardado", "") + '<p>Este entreno era idéntico al último que guardaste hoy, así que no se ha duplicado.</p>'); return; }
    if (r.sesion.prs.length || r.ascensos.length) celebrar(r);
    else hojaResumen(r);
  },
  "cancelar-sesion": function () {
    if (!pideConfirmar("cancelar-sesion", pintarSesion)) return;
    estado.activa = null; pilaDeshacer = []; pararDescanso(); guardar(); pintar();
  },
  "ver-resumen": function () { $("celebra").hidden = true; hojaResumen(window._resumen); },
  "compartir-sesion": function (id, x, y, boton) {
    const s = estado.sesiones.find(function (z) { return z.id === id; });
    if (!s.compartida) {
      const r = publicar("entreno", textoSesion(s));
      if (!r.ok) { boton.textContent = r.msg; boton.disabled = true; return; }
      for (const pr of s.prs) publicar("record", "Nuevo récord en " + buscarEj(pr).nombre);
      s.compartida = true; guardar();
    }
    boton.textContent = "Compartido en Social"; boton.disabled = true;
  },
  "borrar-sesion": function (id) {
    if (!pideConfirmar("borrar-sesion", function () { hojaSesion(id); })) return;
    estado.sesiones = estado.sesiones.filter(function (s) { return s.id !== id; });
    recalcularHistorial();
    guardar(); cerrarHoja(); pintar();
  },

  // ---------- Temporizador ----------
  "timer-menos": function () { ajustarDescanso(-15); },
  "timer-mas": function () { ajustarDescanso(15); },
  "timer-saltar": function () { pararDescanso(); },

  // ---------- Progreso ----------
  "periodo": function (d) { periodo = parseInt(d); pintarProgreso(); },
  "metrica": function (m) { metrica = m; pintarProgreso(); },
  "guardar-peso": function () {
    const v = parseFloat($("nuevoPeso").value);
    if (!(v >= 35 && v <= 250)) { $("errPeso").textContent = "Escribe un peso entre 35 y 250 kg."; return; }
    estado.pesoCorporal = estado.pesoCorporal.filter(function (x) { return x.fecha !== hoy(); });
    estado.pesoCorporal.push({ fecha: hoy(), kg: v });
    estado.perfil.peso = v;
    guardar(); pintarProgreso();
  },

  // ---------- Social ----------
  "vista-social": function (v) { vistaSocial = v; confirmar = ""; pintarSocial(); },
  "like": function (id) {
    const p = estado.social.posts.find(function (x) { return x.id === id; });
    const i = p.likes.indexOf(miId());
    if (i >= 0) p.likes.splice(i, 1); else p.likes.push(miId());
    guardar(); pintarSocial();
  },
  "comentar": function (id) {
    const campo = $("com-" + id);
    const r = comentar(id, campo.value);
    if (!r.ok) { campo.value = ""; campo.placeholder = r.msg; campo.focus(); return; }
    guardar(); pintarSocial();
  },
  "borrar-post": function (id) {
    if (!pideConfirmar("borrar-post" + id, pintarSocial)) return;
    estado.social.posts = estado.social.posts.filter(function (x) { return x.id !== id; });
    guardar(); pintarSocial();
  },
  "denunciar": function (id) { hojaDenuncia(id); },
  "enviar-denuncia": function (id) {
    const marcado = document.querySelector('input[name="motivo"]:checked');
    const r = denunciar(id, marcado ? marcado.value : "", $("denDetalle").value);
    if (!r.ok) { $("denError").textContent = r.msg; return; }
    guardar(); cerrarHoja(); pintarSocial();
  },
  "publicar-ultimo": function () {
    const s = estado.sesiones[estado.sesiones.length - 1];
    if (s.compartida) { mensaje("Ya compartido", "Tu último entreno ya está publicado."); return; }
    const r = publicar("entreno", textoSesion(s));
    if (!r.ok) { mensaje("No se puede publicar", r.msg); return; }
    s.compartida = true; guardar(); pintarSocial();
  },
  "anadir-amigo": function (u) {
    if (!estado.social.amigos.includes(u) && usuarioDemo(u)) estado.social.amigos.push(u);
    guardar(); const t = $("buscarUsuario").value; pintarSocial(); $("buscarUsuario").value = t; resultadosUsuarios(t);
  },
  "quitar-amigo": function (u) { estado.social.amigos = estado.social.amigos.filter(function (x) { return x !== u; }); guardar(); pintarSocial(); },
  "bloquear": function (u) {
    estado.social.amigos = estado.social.amigos.filter(function (x) { return x !== u; });
    if (!estado.social.bloqueados.includes(u)) estado.social.bloqueados.push(u);
    guardar(); pintarSocial();
  },
  "desbloquear": function (u) { estado.social.bloqueados = estado.social.bloqueados.filter(function (x) { return x !== u; }); guardar(); pintarSocial(); },
  "nuevo-reto": function () { hojaReto(); },
  "crear-reto": function () {
    const tipo = $("rTipo").value, inicio = $("rInicio").value, fin = $("rFin").value;
    const meta = parseFloat($("rMeta").value);
    let error = "";
    if (!inicio || !fin || fin < inicio) error = "La fecha de fin debe ser posterior a la de inicio.";
    else if (!(meta > 0 && meta <= 1000)) error = "La meta debe ser un número mayor que 0.";
    else if (tipo === "mejora" && !$("rEj").value) error = "Necesitas haber registrado algún ejercicio.";
    if (error) { $("rError").textContent = error; return; }
    estado.social.retos.unshift({ id: "r" + Date.now(), tipo: tipo, meta: meta, inicio: inicio, fin: fin, ejercicio: tipo === "mejora" ? $("rEj").value : null });
    guardar(); cerrarHoja(); vistaSocial = "retos"; pintarSocial();
  },
  "borrar-reto": function (id) { estado.social.retos = estado.social.retos.filter(function (r) { return r.id !== id; }); guardar(); pintarSocial(); },

  // ---------- Ajustes ----------
  "tema": function (t) { estado.ajustes.tema = t; guardar(); aplicarTema(); hojaAjustes(); },
  "guardar-ajustes": function () {
    const p = leerPerfil();
    if (!p) { $("fError").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (p.peso !== estado.perfil.peso) {
      estado.pesoCorporal = estado.pesoCorporal.filter(function (x) { return x.fecha !== hoy(); });
      estado.pesoCorporal.push({ fecha: hoy(), kg: p.peso });
    }
    p.uid = estado.perfil.uid;                       // el identificador nunca cambia
    p.diasSemana = estado.perfil.diasSemana;
    estado.perfil = p;
    const a = estado.ajustes;
    a.descanso = parseInt($("aDescanso").value); a.incremento = parseFloat($("aIncremento").value); a.incrementoMancuernas = parseFloat($("aIncMancuernas").value);
    a.privacidad = $("aPrivacidad").value; a.compartir = $("aCompartir").checked; a.mascota = $("aMascota").checked;
    a.notif = { recordatorios: $("nRec").checked, records: $("nRecords").checked, rangos: $("nRangos").checked, amigos: $("nAmigos").checked, semanal: $("nSemanal").checked };
    guardar(); pintar();
    $("aOk").textContent = "Cambios guardados.";
  },
  "exportar": function () { hojaExportar(); },
  "pruebas": function () { pararDescanso(); hojaPruebas(); },
  "abrir-piloto": function () { hojaPiloto(); },
  "informar-problema": function () {
    const t = $("probTexto").value.trim();
    if (t.length < 5) { $("probError").textContent = "Describe el problema en al menos 5 caracteres."; return; }
    estado.metricas.problemas.push({ fecha: new Date().toISOString(), tipo: $("probTipo").value, texto: t.slice(0, 500), pantalla: tab });
    guardar(); hojaPiloto();
  },
  "abrir-importar": function () { confirmar = ""; hojaImportar(); },
  "importar": function () {
    const r = validarImport($("importTxt").value);
    if (!r.ok) { $("importError").textContent = r.msg; return; }
    if (!pideConfirmar("importar", function () { $("hojaContenido").querySelector('[data-act="importar"]').textContent = "Pulsa otra vez para sustituir tus datos"; })) return;
    estado = r.datos; recalcularHistorial(); guardar(); cerrarHoja(); tab = "inicio"; pintar();
    mensaje("Datos importados", "Se han importado " + estado.sesiones.length + " entrenos.");
  },
  "editar-sesion": function (id) { hojaEditarSesion(id); },
  "guardar-edicion": function (id) {
    const s = estado.sesiones.find(function (x) { return x.id === id; });
    // Primero se valida todo con la MISMA regla que al registrar e importar; si algo es imposible, no se cambia nada
    for (let ei = 0; ei < s.ejercicios.length; ei++) {
      for (let si = 0; si < s.ejercicios[ei].series.length; si++) {
        const p = parseFloat($("ed-p-" + ei + "-" + si).value), r = Number($("ed-r-" + ei + "-" + si).value);
        const hecha = $("ed-h-" + ei + "-" + si).checked;
        const m = validarValores(p, r, hecha);
        if (m) { $("edError").textContent = buscarEj(s.ejercicios[ei].id).nombre + ", serie " + (si + 1) + ": " + m; return; }
      }
    }
    s.ejercicios.forEach(function (e, ei) {
      e.series.forEach(function (x, si) {
        const p = parseFloat($("ed-p-" + ei + "-" + si).value), r = Number($("ed-r-" + ei + "-" + si).value);
        const hecha = $("ed-h-" + ei + "-" + si).checked;
        if (p !== x.peso || r !== x.reps || hecha !== x.hecha) {
          estado.metricas.correcciones++;
          const v = hecha ? validarSerie(e.id, p, r) : { nivel: "ok", msg: "" };
          x.sospechosa = v.nivel === "aviso"; x.aviso = v.msg; x.confirmada = false;
        }
        x.peso = p; x.reps = r; x.hecha = hecha;
      });
    });
    recalcularHistorial(); guardar(); hojaSesion(id);
  },
  "copiar-export": function () {
    const t = $("exportTxt");
    navigator.clipboard.writeText(t.value).then(function () { $("copiaOk").textContent = "Copiado."; })
      .catch(function () { t.select(); $("copiaOk").textContent = "Texto seleccionado: cópialo con Ctrl+C o mantén pulsado."; });
  },
  "cerrar-sesion": function () {
    // Los datos siguen guardados en este dispositivo; al volver se recuperan
    cerrarHoja(); pararDescanso(); $("tabs").hidden = true;
    $("app").innerHTML = '<div class="welcome">' + insignia(8, "logo") + '<h1>Sesión cerrada</h1><p class="muted">Tus datos siguen guardados en este dispositivo.</p><button class="btn" data-act="volver-a-entrar">Volver a entrar</button></div>';
  },
  "volver-a-entrar": function () { pintar(); },
  "borrar-todo": function () {
    if (!pideConfirmar("borrar-todo", hojaAjustes)) return;
    estado = null; borrarAlmacenamiento();
    cerrarHoja(); pararDescanso(); pintar();
  }
};

function refrescarBib() { hojaBiblioteca(modoBib, bibBase); }

// ---------- Cambios en campos de texto y desplegables ----------
document.addEventListener("input", function (ev) {
  const t = ev.target;
  if (t.id === "bibTexto") { filtroBib.texto = t.value; pintarListaBib(); return; }
  if (t.id === "buscarUsuario") { resultadosUsuarios(t.value); return; }
  if (t.dataset.in === "nota") { estado.activa.ejercicios[t.dataset.e].nota = t.value; guardar(); }
  if (t.dataset.in === "nombre-dia") { estado.rutina.dias[t.dataset.e].nombre = t.value.slice(0, 40) || "Día"; guardar(); }
});

document.addEventListener("change", function (ev) {
  const t = ev.target, d = t.dataset;
  if (d.in === "peso" || d.in === "reps" || d.in === "rpe") {
    copiaSesion();
    const e = estado.activa.ejercicios[d.e];
    if (d.in === "rpe") e.series[d.s].rpe = t.value ? parseFloat(t.value) : null;
    else cambiarSerie(e, parseInt(d.s), d.in, d.in === "peso" ? parseFloat(t.value) : parseInt(t.value));
    guardar(); pintarSesion();
  }
  if (d.in === "gim") {
    const id = d.e;
    estado.noDisponibles = estado.noDisponibles.filter(function (x) { return x !== id; });
    if (!t.checked) estado.noDisponibles.push(id);
    guardar();
  }
  if (d.in === "molestias" || d.in === "cambio") {
    copiaSesion();
    estado.activa.ejercicios[d.e][d.in] = t.checked;
    guardar(); pintarSesion();
  }
  if (d.in === "dia-campo") {
    const o = estado.rutina.dias[d.e].ejercicios[d.s];
    let v = parseInt(t.value) || 1;
    if (d.k === "series") v = Math.min(10, Math.max(1, v));
    if (d.k === "repMin" || d.k === "repMax") v = Math.min(50, Math.max(1, v));
    if (d.k === "descanso") v = Math.min(600, Math.max(15, v));
    o[d.k] = v;
    if (o.repMin > o.repMax) { if (d.k === "repMin") o.repMax = o.repMin; else o.repMin = o.repMax; }
    guardar(); hojaEditarDia(parseInt(d.e));
  }
  if (d.cambio === "ej-grafica") { ejGrafica = t.value; pintarProgreso(); }
  if (d.cambio === "grupo-volumen") { grupoVolumen = t.value; pintarProgreso(); }
  if (t.id === "gDias") {
    const cal = calendarioPorDefecto(parseInt(t.value));
    for (const c of document.querySelectorAll('input[name="gDia"]')) c.checked = cal.includes(parseInt(c.value));
  }
  if (d.cambio === "lugar") {
    // Al elegir dónde entrenas, marcamos el equipamiento típico
    const eq = { gimnasio: ["barra", "mancuernas", "maquina", "polea", "corporal"], casa: ["mancuernas", "corporal"], calistenia: ["corporal"] }[t.value];
    for (const c of document.querySelectorAll('input[name="equipo"]')) c.checked = eq.includes(c.value);
  }
});

// Cambia el peso o las reps de una serie, valida el dato y actualiza las series siguientes
// que aún no están hechas y tenían el mismo valor (así no hay que escribirlo en cada serie).
function cambiarSerie(e, si, campo, valor) {
  if (isNaN(valor)) valor = 0;
  const viejo = e.series[si][campo];
  e.series[si][campo] = valor;
  for (let j = si + 1; j < e.series.length; j++) {
    const s = e.series[j];
    if (!s.hecha && s[campo] === viejo) s[campo] = valor;
  }
  for (let j = si; j < e.series.length; j++) {
    const s = e.series[j];
    if (s.hecha && j !== si) continue;
    const v = validarSerie(e.id, s.peso, s.reps, e.objetivo);
    s.error = v.nivel === "error" ? v.msg : "";
    s.sospechosa = v.nivel === "aviso";
    if (v.nivel === "aviso" && !s.sospechosa) estado.metricas.avisos++;
    s.aviso = v.msg;
    s.confirmada = false;
  }
}


// Enter o espacio activan las zonas del mapa corporal (accesibilidad con teclado)
document.addEventListener("keydown", function (ev) {
  const t = ev.target;
  if ((ev.key === "Enter" || ev.key === " ") && t.dataset && t.dataset.act && t.tagName !== "BUTTON" && t.tagName !== "INPUT") {
    ev.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
});

// Enter en las repeticiones marca la serie como hecha
document.addEventListener("keydown", function (ev) {
  const t = ev.target;
  if (ev.key === "Enter" && t.dataset && t.dataset.in === "reps") {
    t.blur();
    const s = estado.activa.ejercicios[t.dataset.e].series[t.dataset.s];
    if (!s.hecha) setTimeout(function () { ACCIONES.marcar(t.dataset.e, t.dataset.s); }, 0);
  }
});

// El cronómetro de la sesión se actualiza cada 20 segundos
setInterval(function () {
  const c = $("cronometro");
  if (c && estado && estado.activa) c.textContent = Math.round((Date.now() - estado.activa.inicio) / 60000);
}, 20000);

// Si el último guardado falló, el navegador avisa antes de cerrar la página
window.addEventListener("beforeunload", function (ev) {
  if (errorGuardado) { ev.preventDefault(); ev.returnValue = ""; }
});

// ---------- App instalable (PWA) ----------
// Chrome avisa con "beforeinstallprompt" cuando la app se puede instalar. Guardamos ese aviso
// para lanzarlo cuando el usuario pulse el botón "Instalar Apex Gym" de Ajustes.
let avisoInstalar = null;
window.addEventListener("beforeinstallprompt", function (ev) {
  ev.preventDefault();
  avisoInstalar = ev;
});
window.addEventListener("appinstalled", function () { avisoInstalar = null; });

// El service worker (sw.js) solo funciona en una web con https o en localhost, y no dentro de un marco (iframe)
function registrarServiceWorker() {
  const seguro = location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!("serviceWorker" in navigator) || !seguro || window.top !== window.self) return;
  navigator.serviceWorker.register("sw.js").catch(function () { /* si falla, la app sigue funcionando con internet */ });
}

// ---------- Arranque ----------
cargar();
if (estado && estado.activa) { sesionRecuperada = true; tab = "entrenar"; }
pintar();
reanudarDescanso();
registrarServiceWorker();
