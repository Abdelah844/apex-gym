// =====================================================
// APEX GYM · KILO, LA MASCOTA (personaje propio: una bolita morada)
// - estadoMascota() decide su humor y su mensaje a partir de tus datos reales.
// - kiloSVG() lo dibuja según el humor.
// Los mensajes se eligen según la fecha (no al azar), así se pueden probar.
// =====================================================

const FRASE_DISCIPLINA = "Hay que tener disciplina para conseguir aquello que deseas.";

const MENSAJES_KILO = {
  anima: [
    "Ya sé que hoy da pereza. " + FRASE_DISCIPLINA,
    "Las ganas van y vienen; la disciplina se queda. " + FRASE_DISCIPLINA,
    "No hace falta que sea tu mejor entreno, solo que lo hagas. " + FRASE_DISCIPLINA
  ],
  animaFuerte: [
    "Llevas {dias} días sin entrenar y hoy te toca. " + FRASE_DISCIPLINA,
    "{dias} días parado… ¡Me oxido de verlo! " + FRASE_DISCIPLINA
  ],
  enfadado: [
    "¡¿Cómo que has perdido la racha?! {racha} semanas seguidas… Esta semana la recuperamos, ¿vale?",
    "Grrr… {racha} semanas de racha a la basura. Venga, levanta y empezamos otra hoy."
  ],
  celebra: [
    "¡{peso} en {ejercicio}! Eso antes no lo levantabas. ¡Estoy orgulloso!",
    "¡Nuevo récord en {ejercicio}: {peso}! El trabajo de estas semanas se nota."
  ],
  orgulloso: [
    "Hoy ya has entrenado. Ahora toca comer bien y dormir.",
    "Entreno de hoy completado. Así se construye la constancia."
  ],
  descanso: [
    "Hoy toca descanso. Recuperar también es entrenar.",
    "Día libre. El músculo crece mientras descansas."
  ],
  cuida: [
    "La última vez marcaste molestias. Hoy, con calma: si duele, para y consulta a un profesional.",
  ],
  contento: [
    "¡Hola! Soy Kilo. Cuando quieras, empezamos.",
    "Cada serie cuenta. ¿Entrenamos?"
  ]
};

// Elige un mensaje según el día del año (siempre el mismo durante el día)
function mensajeDelDia(lista, fecha) {
  const d = new Date((fecha || hoy()) + "T12:00:00");
  const inicioAnio = new Date(d.getFullYear() + "-01-01T12:00:00");
  const dia = Math.round((d - inicioAnio) / 86400000);
  return lista[dia % lista.length];
}

function rellenar(texto, datos) {
  return texto.replace(/\{(\w+)\}/g, function (m, k) { return datos[k] !== undefined ? datos[k] : m; });
}

// Racha que tenías justo antes de perderla (0 si no la has perdido esta semana)
function rachaPerdida() {
  const mapa = sesionesPorSemana();
  const min = minimoSemanal();
  const esta = lunesDe(hoy());
  if ((mapa[esta] || 0) >= min) return 0;                 // esta semana ya cumpliste: racha viva
  const pasada = sumarDias(esta, -7);
  if ((mapa[pasada] || 0) >= min) return 0;               // la semana pasada cumpliste: racha viva
  let lunes = sumarDias(esta, -14), n = 0;
  while ((mapa[lunes] || 0) >= min && n < 520) { n++; lunes = sumarDias(lunes, -7); }
  return n;                                               // semanas seguidas que tenías antes de fallar
}

function diasSinEntrenar() {
  const v = sesionesValidas();
  if (v.length === 0) return null;
  return diasEntre(v[v.length - 1].fecha, hoy());
}

// Humor y mensaje de Kilo. Devuelve null si el usuario lo ha desactivado.
// Orden de prioridad: molestias → récord → racha perdida → hoy ya entrenaste → día de entreno → descanso → normal
function estadoMascota() {
  if (estado.ajustes.mascota === false) return null;
  const hoyF = hoy();
  const validas = sesionesValidas();
  const ultima = validas[validas.length - 1];

  // 1. Molestias recientes: nunca presionar
  if (ultima && diasEntre(ultima.fecha, hoyF) <= 3 && ultima.ejercicios.some(function (e) { return e.molestias; })) {
    return { humor: "cuida", mensaje: mensajeDelDia(MENSAJES_KILO.cuida, hoyF) };
  }
  // 2. Récord en los últimos 2 días: felicitar con el ejercicio y el peso
  if (ultima && diasEntre(ultima.fecha, hoyF) <= 2 && ultima.prs.length) {
    const id = ultima.prs[0];
    const e = ultima.ejercicios.find(function (x) { return x.id === id; });
    const ej = buscarEj(id);
    let mejor = null;
    for (const s of e.series) if (serieValida(s) && (!mejor || unaRM(cargaSerie(ej, s.peso, ultima.fecha), s.reps) > unaRM(cargaSerie(ej, mejor.peso, ultima.fecha), mejor.reps))) mejor = s;
    const peso = ej.asistido ? mejor.reps + " reps con " + String(mejor.peso).replace(".", ",") + " kg de ayuda" : String(mejor.peso).replace(".", ",") + " kg × " + mejor.reps;
    return { humor: "celebra", mensaje: rellenar(mensajeDelDia(MENSAJES_KILO.celebra, hoyF), { peso: peso, ejercicio: ej.nombre.toLowerCase() }) };
  }
  // 3. Racha perdida esta semana
  const perdida = rachaPerdida();
  if (perdida >= 1 && !(ultima && ultima.fecha === hoyF)) {
    return { humor: "enfadado", mensaje: rellenar(mensajeDelDia(MENSAJES_KILO.enfadado, hoyF), { racha: perdida }) };
  }
  // 4. Hoy ya has entrenado
  if (ultima && ultima.fecha === hoyF) return { humor: "orgulloso", mensaje: mensajeDelDia(MENSAJES_KILO.orgulloso, hoyF) };
  // 5. Hoy toca entrenar (según tu calendario) y aún no lo has hecho
  const cal = estado.rutina && Array.isArray(estado.rutina.calendario) ? estado.rutina.calendario : (estado.perfil.diasSemana || []);
  const hoyN = (new Date(hoyF + "T12:00:00").getDay() + 6) % 7;
  if (cal.includes(hoyN)) {
    const dias = diasSinEntrenar();
    if (dias !== null && dias >= 3) return { humor: "anima", mensaje: rellenar(mensajeDelDia(MENSAJES_KILO.animaFuerte, hoyF), { dias: dias }) };
    return { humor: "anima", mensaje: mensajeDelDia(MENSAJES_KILO.anima, hoyF) };
  }
  // 6. Día de descanso
  if (cal.length) return { humor: "descanso", mensaje: mensajeDelDia(MENSAJES_KILO.descanso, hoyF) };
  return { humor: "contento", mensaje: mensajeDelDia(MENSAJES_KILO.contento, hoyF) };
}

// ---------- Dibujo de Kilo ----------
// Bolita suave morada con brillo, bracitos y patitas.
// Según el humor cambian los ojos, las cejas, la boca y algún complemento.
function kiloSVG(humor, tam) {
  const h = humor || "contento";
  const enfadado = h === "enfadado";
  const claro = enfadado ? "#FF9A9A" : "#C9B2FF";     // color de arriba
  const medio = enfadado ? "#FF4D4D" : "#8A5CFF";     // color del centro
  const borde = enfadado ? "#C81E2E" : "#5B2BE0";     // color de abajo, brazos y patas
  const tinta = "#1F2B2B";                            // ojos, cejas y boca
  const id = "kg-" + h;                               // id del degradado (uno por humor)

  let s = '<svg class="kilo kilo-' + h + ' ' + (tam || "") + '" viewBox="0 -16 120 136" role="img" aria-label="Kilo, la mascota de Apex Gym">';
  s += '<defs><radialGradient id="' + id + '" cx="40%" cy="30%" r="80%">' +
       '<stop offset="0" stop-color="' + claro + '"/><stop offset=".6" stop-color="' + medio + '"/><stop offset="1" stop-color="' + borde + '"/></radialGradient></defs>';
  // Sombra, patas y brazos
  s += '<ellipse cx="60" cy="110" rx="34" ry="4" fill="#000" opacity=".15"/>' +
       '<ellipse cx="43" cy="104" rx="9" ry="6" fill="' + borde + '"/><ellipse cx="77" cy="104" rx="9" ry="6" fill="' + borde + '"/>' +
       '<ellipse cx="16" cy="80" rx="6" ry="8" fill="' + borde + '"/><ellipse cx="104" cy="80" rx="6" ry="8" fill="' + borde + '"/>';
  // Cuerpo (cúpula redondeada) y brillo
  s += '<path d="M16,82 C14,44 38,22 60,22 C82,22 106,44 104,82 C103,98 86,104 60,104 C34,104 17,98 16,82 Z" fill="url(#' + id + ')"/>' +
       '<ellipse cx="42" cy="36" rx="12" ry="6" fill="#fff" opacity=".75" transform="rotate(-22 42 36)"/>';
  // Fuego encima de la cabeza cuando se enfada (3 llamas: roja, naranja y amarilla)
  if (enfadado) s += '<g class="kilo-fuego">' +
    '<path d="M60,-14 C66,-4 78,0 76,14 C75,22 68,27 60,27 C52,27 45,22 44,14 C43,4 52,2 52,-6 C55,-2 57,0 58,4 C60,-2 58,-8 60,-14 Z" fill="#FF3B1F"/>' +
    '<path d="M60,-2 C64,5 71,8 70,16 C69,22 65,26 60,26 C55,26 51,22 50,16 C50,10 55,8 56,3 C58,6 59,8 60,10 C61,6 60,2 60,-2 Z" fill="#FF8A00"/>' +
    '<path d="M60,9 C63,13 66,16 65,20 C64,24 62,26 60,26 C58,26 56,24 55,20 C55,16 58,14 60,9 Z" fill="#FFD84A"/></g>';
  // Complementos
  if (h === "anima") s += '<path d="M22,46 Q60,34 98,46 L97,54 Q60,42 23,54 Z" fill="#FF8A3D"/><path d="M96,48 l13,-5 l-4,11 z" fill="#FF8A3D"/>';   // cinta de deporte
  if (h === "celebra") s += '<path d="M47,24 L50,12 L56,19 L60,8 L64,19 L70,12 L73,24 Z" fill="#FFD25A" stroke="#C9971A" stroke-width="1.5" stroke-linejoin="round"/>' +
                            '<circle cx="18" cy="34" r="2.5" fill="#FFD25A"/><circle cx="104" cy="30" r="2.5" fill="#FF8FB1"/><circle cx="108" cy="50" r="2" fill="#7FB8FF"/>';   // corona y confeti
  // Ojos
  if (h === "descanso") {
    s += '<path d="M39,64 q7,5 14,0 M67,64 q7,5 14,0" fill="none" stroke="' + tinta + '" stroke-width="3" stroke-linecap="round"/>' +
         '<text x="90" y="30" font-family="sans-serif" font-weight="800" font-size="13" fill="#7A4DFF">z</text><text x="100" y="18" font-family="sans-serif" font-weight="800" font-size="10" fill="#7A4DFF">z</text>';
  } else if (h === "celebra" || h === "orgulloso") {
    s += '<path d="M39,66 q7,-8 14,0 M67,66 q7,-8 14,0" fill="none" stroke="' + tinta + '" stroke-width="3.5" stroke-linecap="round"/>';   // ojos felices ^ ^
  } else {
    const baja = h === "cuida" ? 2 : 0;
    s += '<circle cx="46" cy="' + (63 + baja) + '" r="8" fill="' + tinta + '"/><circle cx="74" cy="' + (63 + baja) + '" r="8" fill="' + tinta + '"/>' +
         '<circle cx="49" cy="' + (60 + baja) + '" r="2.8" fill="#fff"/><circle cx="77" cy="' + (60 + baja) + '" r="2.8" fill="#fff"/>' +
         '<circle cx="43.5" cy="' + (66 + baja) + '" r="1.3" fill="#fff"/><circle cx="71.5" cy="' + (66 + baja) + '" r="1.3" fill="#fff"/>';
  }
  // Cejas
  if (enfadado) s += '<path d="M37,48 L53,54 M83,48 L67,54" stroke="' + tinta + '" stroke-width="3.5" stroke-linecap="round"/>';
  else if (h === "anima") s += '<path d="M39,52 L52,50 M68,50 L81,52" stroke="' + tinta + '" stroke-width="3" stroke-linecap="round"/>';
  else if (h === "cuida") s += '<path d="M40,52 L50,48 M80,52 L70,48" stroke="#3A1A99" stroke-width="3" stroke-linecap="round"/>';
  else if (h !== "descanso") s += '<path d="M41,49 L48,51 M79,49 L72,51" stroke="#3A1A99" stroke-width="3" stroke-linecap="round"/>';
  // Mofletes
  if (!enfadado) s += '<ellipse cx="33" cy="76" rx="8" ry="5" fill="#FF9C9C" opacity=".75"/><ellipse cx="87" cy="76" rx="8" ry="5" fill="#FF9C9C" opacity=".75"/>';
  // Boca
  if (enfadado) s += '<path d="M52,82 Q60,76 68,82" fill="none" stroke="' + tinta + '" stroke-width="3" stroke-linecap="round"/>' +
                     '<path d="M8,40 q4,-7 0,-13 M112,40 q-4,-7 0,-13" fill="none" stroke="#E02B3C" stroke-width="3" stroke-linecap="round"/>';   // vapor
  else if (h === "celebra") s += '<path d="M52,76 Q60,88 68,76 Z" fill="' + tinta + '"/><path d="M56,81 Q60,85 64,81" fill="#FF7A8F"/>';
  else if (h === "anima") s += '<path d="M54,79 L66,79" stroke="' + tinta + '" stroke-width="3" stroke-linecap="round"/><path d="M92,58 q4,6 0,9 q-4,-3 0,-9" fill="#7FC8FF"/>';   // gota de sudor
  else if (h === "cuida") s += '<path d="M54,80 Q60,78 66,80" fill="none" stroke="' + tinta + '" stroke-width="2.5" stroke-linecap="round"/>';
  else if (h === "descanso") s += '<ellipse cx="60" cy="79" rx="3" ry="2.5" fill="' + tinta + '"/>';
  else s += '<path d="M54,77 Q60,82 66,77" fill="none" stroke="' + tinta + '" stroke-width="2.5" stroke-linecap="round"/>';
  return s + '</svg>';
}
