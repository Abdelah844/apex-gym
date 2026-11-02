// =====================================================
// APEX GYM · EFECTOS DE SONIDO
// Todos los sonidos se crean con código (Web Audio API): no hay archivos de audio
// ni licencias de terceros. Cada sonido es una lista de notas.
// =====================================================

// Cada nota: f = frecuencia (Hz, más alto = más agudo), t = cuándo empieza (s), d = cuánto dura (s),
// tipo = forma de la onda ("sine" suave, "triangle" redondo, "square" de videojuego, "sawtooth" áspero),
// v = volumen (0 a 1), f2 = frecuencia final si la nota sube o baja (opcional).
const SONIDOS = {
  // Completar una serie: un "clic" corto
  serie: [{ f: 1250, t: 0, d: 0.05, tipo: "triangle", v: 0.25 }],
  // Fin del descanso: tres pitidos, el último más agudo y largo
  descanso: [
    { f: 880, t: 0, d: 0.15, tipo: "sine", v: 0.3 },
    { f: 880, t: 0.3, d: 0.15, tipo: "sine", v: 0.3 },
    { f: 1320, t: 0.6, d: 0.35, tipo: "sine", v: 0.3 }
  ],
  // Nuevo récord: fanfarria (do, mi, sol, do agudo)
  record: [
    { f: 523, t: 0, d: 0.12, tipo: "square", v: 0.12 },
    { f: 659, t: 0.12, d: 0.12, tipo: "square", v: 0.12 },
    { f: 784, t: 0.24, d: 0.12, tipo: "square", v: 0.12 },
    { f: 1047, t: 0.36, d: 0.45, tipo: "square", v: 0.12 }
  ],
  // Subir de rango: más largo y épico, termina con un acorde
  rango: [
    { f: 392, t: 0, d: 0.15, tipo: "sawtooth", v: 0.08 },
    { f: 523, t: 0.15, d: 0.15, tipo: "sawtooth", v: 0.08 },
    { f: 659, t: 0.3, d: 0.15, tipo: "sawtooth", v: 0.08 },
    { f: 784, t: 0.45, d: 0.25, tipo: "sawtooth", v: 0.08 },
    { f: 523, t: 0.75, d: 0.9, tipo: "triangle", v: 0.18 },
    { f: 659, t: 0.75, d: 0.9, tipo: "triangle", v: 0.18 },
    { f: 784, t: 0.75, d: 0.9, tipo: "triangle", v: 0.18 },
    { f: 1047, t: 0.75, d: 0.9, tipo: "triangle", v: 0.14 }
  ],
  // Terminar el entreno: acorde de victoria corto
  fin: [
    { f: 523, t: 0, d: 0.5, tipo: "triangle", v: 0.2 },
    { f: 659, t: 0.05, d: 0.45, tipo: "triangle", v: 0.2 },
    { f: 784, t: 0.1, d: 0.4, tipo: "triangle", v: 0.2 }
  ],
  // Apix enfadado: "grrr" grave y áspero
  enfadado: [
    { f: 110, t: 0, d: 0.12, tipo: "sawtooth", v: 0.2, f2: 90 },
    { f: 105, t: 0.13, d: 0.12, tipo: "sawtooth", v: 0.2, f2: 85 },
    { f: 100, t: 0.26, d: 0.25, tipo: "sawtooth", v: 0.2, f2: 70 }
  ],
  // Racha mantenida: chispazo que sube
  racha: [
    { f: 600, t: 0, d: 0.15, tipo: "triangle", v: 0.25, f2: 1800 },
    { f: 2400, t: 0.15, d: 0.08, tipo: "sine", v: 0.15 },
    { f: 3000, t: 0.25, d: 0.08, tipo: "sine", v: 0.12 }
  ]
};

// Vibración que acompaña a cada sonido (milisegundos: vibra, pausa, vibra…)
const VIBRACIONES = {
  serie: [30], descanso: [200, 100, 200], record: [80, 60, 80, 60, 200], rango: [100, 60, 100, 60, 400],
  fin: [150], enfadado: [300], racha: [60, 40, 120]
};

let audioCtx = null;

// El navegador solo deja sonar después de que el usuario toque la pantalla.
// Por eso el "altavoz" (AudioContext) se crea o se despierta en el primer toque.
function prepararAudio() {
  if (typeof window === "undefined") return null;                 // en las pruebas de Node no hay altavoz
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  try {
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) { audioCtx = null; }
  return audioCtx;
}

// Reproduce un sonido por su nombre. Devuelve true si estaba permitido sonar.
function sonar(nombre) {
  const notas = SONIDOS[nombre];
  if (!notas) return false;
  const aj = (typeof estado !== "undefined" && estado && estado.ajustes) ? estado.ajustes : {};

  // Vibración (si el móvil la tiene y no está desactivada)
  if (aj.vibracion !== false && typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(VIBRACIONES[nombre] || [50]); } catch (e) { }
  }
  if (aj.sonido === false) return false;

  const ctx = prepararAudio();
  if (!ctx) return true;
  const ahora = ctx.currentTime + 0.02;
  for (const n of notas) {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = n.tipo;
    osc.frequency.setValueAtTime(n.f, ahora + n.t);
    if (n.f2) osc.frequency.linearRampToValueAtTime(n.f2, ahora + n.t + n.d);
    // El volumen sube rápido y baja suave, para que no haga "clic" al empezar y acabar
    vol.gain.setValueAtTime(0.0001, ahora + n.t);
    vol.gain.exponentialRampToValueAtTime(n.v, ahora + n.t + 0.01);
    vol.gain.exponentialRampToValueAtTime(0.0001, ahora + n.t + n.d);
    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(ahora + n.t);
    osc.stop(ahora + n.t + n.d + 0.05);
  }
  return true;
}

// Duración total de un sonido en segundos (lo usan las pruebas)
function duracionSonido(nombre) {
  let fin = 0;
  for (const n of SONIDOS[nombre] || []) fin = Math.max(fin, n.t + n.d);
  return fin;
}
