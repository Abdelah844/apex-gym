// =====================================================
// APEX GYM · DATOS FIJOS (ejercicios y rangos)
// =====================================================

// Función para crear un ejercicio de forma ordenada.
// factor = fuerza de nivel avanzado (1RM dividido entre tu peso corporal).
// cuerpo = parte del peso corporal que mueves (solo ejercicios con peso corporal).
// asistido = máquina de asistencia: los kg que escribes AYUDAN (más kg = más fácil).
function ej(id, nombre, grupo, sec, equipo, patron, nivel, compuesto, reps, factor, pasos, error, consejo, variantes, cuerpo, asistido) {
  return { id: id, nombre: nombre, grupo: grupo, sec: sec, equipo: equipo, patron: patron, nivel: nivel,
    compuesto: compuesto, reps: reps, factor: factor, pasos: pasos, error: error, consejo: consejo,
    variantes: variantes, cuerpo: cuerpo || 0, asistido: !!asistido };
}

const GRUPOS = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps",
  antebrazos: "Antebrazos", abdominales: "Abdominales", cuadriceps: "Cuádriceps", aductores: "Aductores",
  isquios: "Isquiotibiales", gluteos: "Glúteos", gemelos: "Gemelos"
};

const EQUIPOS = { barra: "Barra", mancuernas: "Mancuernas", maquina: "Máquina", polea: "Polea", corporal: "Peso corporal" };

const EJERCICIOS = [
  // ---------- PECHO ----------
  ej("press-banca", "Press banca con barra", "pecho", ["triceps", "hombros"], "barra", "Empuje horizontal", 2, true, [6, 10], 1.25,
    ["Túmbate con los ojos bajo la barra y los pies firmes en el suelo.", "Baja la barra controlada hasta la parte baja del pecho.", "Empuja hacia arriba sin despegar la espalda del banco."],
    "Rebotar la barra en el pecho.", "Junta las escápulas antes de bajar la barra.", ["press-maquina", "press-inclinado-mancuernas", "flexiones"]),
  ej("press-inclinado-mancuernas", "Press inclinado con mancuernas", "pecho", ["hombros", "triceps"], "mancuernas", "Empuje inclinado", 2, true, [8, 12], 0.42,
    ["Coloca el banco a unos 30 grados.", "Baja las mancuernas a los lados del pecho.", "Empuja hacia arriba juntándolas un poco."],
    "Inclinar demasiado el banco y trabajar solo hombro.", "Peso indicado por mancuerna.", ["press-banca", "press-maquina"]),
  ej("press-maquina", "Press de pecho en máquina", "pecho", ["triceps", "hombros"], "maquina", "Empuje horizontal", 1, true, [8, 12], 1.1,
    ["Ajusta el asiento para que las asas queden a la altura del pecho.", "Empuja hasta casi estirar los brazos.", "Vuelve despacio sin soltar la tensión."],
    "Bloquear los codos de golpe.", "Mantén la espalda pegada al respaldo.", ["press-banca", "flexiones"]),
  ej("contractora", "Contractora (pec deck)", "pecho", [], "maquina", "Aducción horizontal", 1, false, [10, 15], 0.9,
    ["Siéntate con la espalda recta y los brazos abiertos.", "Junta los brazos delante del pecho.", "Abre despacio hasta notar el estiramiento."],
    "Usar impulso en vez de controlar el movimiento.", "Piensa en juntar los codos, no las manos.", ["aperturas-polea"]),
  ej("aperturas-polea", "Aperturas en polea", "pecho", ["hombros"], "polea", "Aducción horizontal", 2, false, [10, 15], 0.35,
    ["Coloca las poleas a la altura de los hombros.", "Da un paso al frente y junta las manos delante.", "Abre los brazos con los codos un poco doblados."],
    "Doblar mucho los codos y convertirlo en un press.", "Peso indicado por lado.", ["contractora"]),
  ej("fondos", "Fondos en paralelas", "pecho", ["triceps", "hombros"], "corporal", "Empuje vertical", 2, true, [6, 12], 1.7,
    ["Sujétate en las paralelas con los brazos estirados.", "Baja inclinando un poco el tronco hacia delante.", "Sube empujando hasta estirar los brazos."],
    "Bajar demasiado y forzar el hombro.", "Escribe 0 kg si no usas lastre.", ["fondos-asistidos", "press-maquina", "flexiones"], 1.0),
  ej("flexiones", "Flexiones", "pecho", ["triceps", "hombros"], "corporal", "Empuje horizontal", 1, true, [8, 20], 1.0,
    ["Manos un poco más abiertas que los hombros.", "Baja el pecho con el cuerpo recto.", "Empuja hasta estirar los brazos."],
    "Dejar caer la cadera.", "Aprieta el abdomen durante todo el movimiento.", ["press-banca", "press-maquina"], 0.65),

  // ---------- ESPALDA ----------
  ej("dominadas", "Dominadas", "espalda", ["biceps"], "corporal", "Tirón vertical", 3, true, [5, 10], 1.6,
    ["Cuélgate con las manos algo más abiertas que los hombros.", "Tira hasta pasar la barbilla por encima de la barra.", "Baja controlado hasta estirar los brazos."],
    "Balancearse para subir.", "Escribe 0 kg si no usas lastre.", ["dominadas-asistidas", "jalon"], 1.0),
  ej("jalon", "Jalón al pecho", "espalda", ["biceps"], "polea", "Tirón vertical", 1, true, [8, 12], 1.0,
    ["Siéntate y sujeta la barra con agarre abierto.", "Tira hacia la parte alta del pecho.", "Sube despacio hasta estirar los brazos."],
    "Echarse muy atrás para mover más peso.", "Lleva los codos hacia abajo y atrás.", ["dominadas", "remo-polea"]),
  ej("remo-barra", "Remo con barra", "espalda", ["biceps", "isquios"], "barra", "Tirón horizontal", 3, true, [6, 10], 1.0,
    ["Inclina el tronco con la espalda recta.", "Tira de la barra hacia el ombligo.", "Baja controlando el peso."],
    "Redondear la espalda baja.", "Mantén el abdomen apretado.", ["remo-maquina", "remo-mancuerna", "remo-polea"]),
  ej("remo-polea", "Remo en polea baja", "espalda", ["biceps"], "polea", "Tirón horizontal", 1, true, [8, 12], 1.0,
    ["Siéntate con las rodillas un poco dobladas.", "Tira del agarre hacia el abdomen.", "Estira los brazos sin encorvarte."],
    "Balancear el tronco adelante y atrás.", "Junta las escápulas al final del tirón.", ["remo-maquina", "remo-barra"]),
  ej("remo-mancuerna", "Remo con mancuerna", "espalda", ["biceps"], "mancuernas", "Tirón horizontal", 1, true, [8, 12], 0.5,
    ["Apoya una mano y una rodilla en el banco.", "Tira de la mancuerna hacia la cadera.", "Baja hasta estirar el brazo."],
    "Girar el tronco para subir el peso.", "Peso indicado por mancuerna.", ["remo-barra", "remo-maquina"]),
  ej("remo-maquina", "Remo en máquina", "espalda", ["biceps"], "maquina", "Tirón horizontal", 1, true, [8, 12], 1.1,
    ["Apoya el pecho en el soporte.", "Tira de las asas llevando los codos atrás.", "Vuelve despacio."],
    "Separar el pecho del soporte.", "Haz una pausa de un segundo atrás.", ["remo-polea", "remo-barra"]),
  ej("peso-muerto", "Peso muerto", "espalda", ["gluteos", "isquios"], "barra", "Bisagra de cadera", 3, true, [3, 6], 2.0,
    ["Pies a la anchura de la cadera, barra sobre el medio del pie.", "Agarra la barra con la espalda recta.", "Sube empujando el suelo y extendiendo la cadera."],
    "Redondear la espalda al levantar.", "La barra debe ir pegada a las piernas.", ["peso-muerto-rumano", "hip-thrust"]),

  // ---------- HOMBROS ----------
  ej("press-militar", "Press militar con barra", "hombros", ["triceps"], "barra", "Empuje vertical", 2, true, [5, 8], 0.75,
    ["De pie, barra a la altura de las clavículas.", "Empuja hacia arriba hasta estirar los brazos.", "Baja controlado a la posición inicial."],
    "Arquear mucho la espalda baja.", "Aprieta glúteos y abdomen.", ["press-hombro-maquina", "press-hombro-mancuernas"]),
  ej("press-hombro-mancuernas", "Press de hombro con mancuernas", "hombros", ["triceps"], "mancuernas", "Empuje vertical", 1, true, [8, 12], 0.32,
    ["Sentado, mancuernas a la altura de las orejas.", "Empuja hacia arriba.", "Baja despacio."],
    "Bajar poco y acortar el recorrido.", "Peso indicado por mancuerna.", ["press-militar", "press-hombro-maquina"]),
  ej("press-hombro-maquina", "Press de hombro en máquina", "hombros", ["triceps"], "maquina", "Empuje vertical", 1, true, [8, 12], 0.85,
    ["Ajusta el asiento: asas a la altura de los hombros.", "Empuja hacia arriba.", "Vuelve sin soltar la tensión."],
    "Despegar la espalda del respaldo.", "No bloquees los codos arriba.", ["press-militar", "press-hombro-mancuernas"]),
  ej("elevaciones-laterales", "Elevaciones laterales", "hombros", [], "mancuernas", "Abducción", 1, false, [12, 15], 0.15,
    ["De pie, mancuernas a los lados.", "Sube los brazos hasta la altura de los hombros.", "Baja despacio."],
    "Usar impulso con el cuerpo.", "Peso indicado por mancuerna. Mejor ligero y controlado.", ["elevaciones-polea"]),
  ej("elevaciones-polea", "Elevaciones laterales en polea", "hombros", [], "polea", "Abducción", 2, false, [12, 15], 0.12,
    ["Ponte de lado a la polea baja.", "Sube el brazo hasta la altura del hombro.", "Baja controlado."],
    "Subir el brazo por encima del hombro.", "Peso indicado por lado.", ["elevaciones-laterales"]),
  ej("pajaros-maquina", "Pájaros en máquina", "hombros", ["espalda"], "maquina", "Abducción horizontal", 1, false, [12, 15], 0.6,
    ["Siéntate mirando a la máquina.", "Abre los brazos hacia atrás.", "Vuelve despacio."],
    "Encoger los hombros.", "Piensa en llevar los codos lejos.", ["face-pull"]),
  ej("face-pull", "Face pull", "hombros", ["espalda"], "polea", "Tirón horizontal alto", 1, false, [12, 15], 0.5,
    ["Polea a la altura de la cara con cuerda.", "Tira hacia la frente separando las manos.", "Vuelve controlado."],
    "Tirar con la espalda baja.", "Al final, los pulgares apuntan hacia atrás.", ["pajaros-maquina"]),

  // ---------- BÍCEPS ----------
  ej("curl-barra", "Curl con barra", "biceps", ["antebrazos"], "barra", "Flexión de codo", 1, false, [8, 12], 0.55,
    ["De pie, barra con agarre a la anchura de los hombros.", "Sube doblando los codos.", "Baja hasta estirar los brazos."],
    "Balancear el cuerpo.", "Los codos se quedan pegados al cuerpo.", ["curl-mancuernas", "curl-polea", "curl-maquina"]),
  ej("curl-mancuernas", "Curl con mancuernas", "biceps", ["antebrazos"], "mancuernas", "Flexión de codo", 1, false, [8, 12], 0.22,
    ["De pie, mancuernas a los lados.", "Sube girando la palma hacia arriba.", "Baja despacio."],
    "Subir los codos hacia delante.", "Peso indicado por mancuerna.", ["curl-barra", "curl-martillo"]),
  ej("curl-martillo", "Curl martillo", "biceps", ["antebrazos"], "mancuernas", "Flexión de codo", 1, false, [8, 12], 0.25,
    ["Mancuernas con las palmas mirándose.", "Sube sin girar la muñeca.", "Baja controlado."],
    "Usar impulso.", "Peso indicado por mancuerna.", ["curl-mancuernas", "curl-inverso"]),
  ej("curl-polea", "Curl en polea", "biceps", [], "polea", "Flexión de codo", 1, false, [10, 15], 0.5,
    ["Polea baja con barra o cuerda.", "Sube doblando los codos.", "Baja sin soltar la tensión."],
    "Despegar los codos del cuerpo.", "Aprieta arriba un segundo.", ["curl-barra", "curl-maquina"]),
  ej("curl-maquina", "Curl en máquina", "biceps", [], "maquina", "Flexión de codo", 1, false, [10, 12], 0.5,
    ["Apoya los brazos en el soporte.", "Sube doblando los codos.", "Baja hasta casi estirar."],
    "Levantar los codos del soporte.", "Controla la bajada.", ["curl-polea", "curl-barra"]),

  // ---------- TRÍCEPS ----------
  ej("extension-polea", "Extensión de tríceps en polea", "triceps", [], "polea", "Extensión de codo", 1, false, [10, 15], 0.6,
    ["Polea alta con barra o cuerda.", "Estira los brazos hacia abajo.", "Sube hasta que los codos queden a 90 grados."],
    "Mover los codos hacia delante.", "Codos pegados al cuerpo.", ["triceps-maquina", "press-frances"]),
  ej("press-frances", "Press francés", "triceps", [], "barra", "Extensión de codo", 2, false, [8, 12], 0.5,
    ["Tumbado, barra sobre la frente con los brazos estirados.", "Dobla los codos bajando la barra.", "Estira los brazos."],
    "Abrir los codos hacia fuera.", "Usa barra Z si te molestan las muñecas.", ["extension-nuca", "extension-polea"]),
  ej("extension-nuca", "Extensión tras nuca con mancuerna", "triceps", [], "mancuernas", "Extensión de codo", 1, false, [10, 12], 0.35,
    ["Sentado, sujeta una mancuerna con las dos manos sobre la cabeza.", "Bájala por detrás de la cabeza.", "Estira los brazos."],
    "Arquear la espalda baja.", "Codos apuntando al techo.", ["press-frances"]),
  ej("triceps-maquina", "Tríceps en máquina", "triceps", [], "maquina", "Extensión de codo", 1, false, [10, 12], 0.7,
    ["Ajusta el asiento.", "Estira los brazos empujando las asas.", "Vuelve despacio."],
    "Encoger los hombros.", "Pausa abajo un segundo.", ["extension-polea"]),

  // ---------- ANTEBRAZOS ----------
  ej("curl-muneca", "Curl de muñeca", "antebrazos", [], "mancuernas", "Flexión de muñeca", 1, false, [12, 20], 0.2,
    ["Apoya el antebrazo en el banco con la palma arriba.", "Sube la mano doblando la muñeca.", "Baja despacio."],
    "Mover el antebrazo.", "Peso indicado por mancuerna.", ["curl-inverso"]),
  ej("curl-inverso", "Curl inverso con barra", "antebrazos", ["biceps"], "barra", "Flexión de codo", 1, false, [10, 15], 0.4,
    ["Barra con las palmas hacia abajo.", "Sube doblando los codos.", "Baja controlado."],
    "Doblar las muñecas.", "Usa menos peso que en el curl normal.", ["curl-martillo", "curl-muneca"]),

  // ---------- ABDOMINALES ----------
  ej("crunch-polea", "Crunch en polea", "abdominales", [], "polea", "Flexión de tronco", 1, false, [10, 15], 0.8,
    ["De rodillas frente a la polea alta con cuerda.", "Baja el pecho hacia las rodillas.", "Sube despacio."],
    "Tirar con los brazos.", "Piensa en enrollar la columna.", ["elevacion-piernas", "rueda-abdominal"]),
  ej("elevacion-piernas", "Elevación de piernas colgado", "abdominales", [], "corporal", "Flexión de cadera", 2, false, [8, 15], 0.7,
    ["Cuélgate de una barra.", "Sube las piernas hasta la altura de la cadera.", "Baja sin balancearte."],
    "Balancearse.", "Escribe 0 kg si no usas lastre.", ["crunch-polea"], 0.35),
  ej("rueda-abdominal", "Rueda abdominal", "abdominales", [], "corporal", "Antiextensión", 2, false, [8, 12], 0.9,
    ["De rodillas, sujeta la rueda.", "Rueda hacia delante con el abdomen apretado.", "Vuelve sin arquear la espalda."],
    "Hundir la espalda baja.", "Escribe 0 kg si no usas lastre.", ["crunch-polea"], 0.5),

  // ---------- CUÁDRICEPS ----------
  ej("sentadilla", "Sentadilla con barra", "cuadriceps", ["gluteos", "isquios"], "barra", "Sentadilla", 2, true, [5, 8], 1.75,
    ["Barra sobre la parte alta de la espalda.", "Baja doblando rodillas y cadera.", "Sube empujando el suelo."],
    "Levantar los talones.", "Las rodillas siguen la dirección de los pies.", ["prensa", "hack", "sentadilla-goblet"]),
  ej("prensa", "Prensa de piernas", "cuadriceps", ["gluteos"], "maquina", "Sentadilla", 1, true, [8, 12], 3.0,
    ["Pies en la plataforma a la anchura de la cadera.", "Baja hasta 90 grados de rodilla.", "Empuja sin bloquear las rodillas."],
    "Despegar la cadera del asiento.", "Controla la bajada.", ["sentadilla", "hack"]),
  ej("hack", "Hack squat", "cuadriceps", ["gluteos"], "maquina", "Sentadilla", 2, true, [8, 12], 2.0,
    ["Espalda contra el respaldo, hombros bajo los soportes.", "Baja doblando las rodillas.", "Sube empujando la plataforma."],
    "Bajar poco.", "Pies un poco adelantados si notas las rodillas.", ["prensa", "sentadilla"]),
  ej("extension-cuadriceps", "Extensión de cuádriceps", "cuadriceps", [], "maquina", "Extensión de rodilla", 1, false, [10, 15], 1.0,
    ["Ajusta el respaldo y el rodillo sobre los tobillos.", "Estira las piernas.", "Baja despacio."],
    "Dar patadas rápidas.", "Pausa arriba un segundo.", ["sentadilla-bulgara"]),
  ej("zancadas", "Zancadas con mancuernas", "cuadriceps", ["gluteos"], "mancuernas", "Zancada", 1, true, [8, 12], 0.4,
    ["De pie con mancuernas.", "Da un paso al frente y baja la rodilla trasera.", "Vuelve empujando con la pierna delantera."],
    "Dejar que la rodilla delantera se meta hacia dentro.", "Peso por mancuerna. Reps por pierna.", ["sentadilla-bulgara"]),
  ej("sentadilla-bulgara", "Sentadilla búlgara", "cuadriceps", ["gluteos"], "mancuernas", "Zancada", 2, true, [8, 12], 0.35,
    ["Pie trasero apoyado en un banco.", "Baja con el tronco recto.", "Sube empujando con la pierna delantera."],
    "Poner el pie delantero demasiado cerca.", "Peso por mancuerna. Reps por pierna.", ["zancadas"]),
  ej("sentadilla-goblet", "Sentadilla goblet", "cuadriceps", ["gluteos"], "mancuernas", "Sentadilla", 1, true, [10, 15], 0.5,
    ["Sujeta una mancuerna pegada al pecho.", "Baja con la espalda recta.", "Sube empujando el suelo."],
    "Inclinar el tronco hacia delante.", "Codos entre las rodillas al bajar.", ["sentadilla", "prensa"]),

  // ---------- ISQUIOTIBIALES ----------
  ej("peso-muerto-rumano", "Peso muerto rumano", "isquios", ["gluteos", "espalda"], "barra", "Bisagra de cadera", 2, true, [8, 10], 1.6,
    ["De pie con la barra, rodillas un poco dobladas.", "Baja la barra echando la cadera atrás.", "Sube apretando los glúteos."],
    "Redondear la espalda.", "Baja hasta notar estiramiento detrás de las piernas.", ["curl-femoral-tumbado", "peso-muerto"]),
  ej("curl-femoral-tumbado", "Curl femoral tumbado", "isquios", [], "maquina", "Flexión de rodilla", 1, false, [10, 12], 0.8,
    ["Túmbate boca abajo con el rodillo en los tobillos.", "Dobla las rodillas.", "Baja despacio."],
    "Levantar la cadera.", "Controla la bajada.", ["curl-femoral-sentado"]),
  ej("curl-femoral-sentado", "Curl femoral sentado", "isquios", [], "maquina", "Flexión de rodilla", 1, false, [10, 12], 0.9,
    ["Siéntate con el rodillo detrás de los tobillos.", "Dobla las rodillas hacia abajo.", "Vuelve despacio."],
    "Usar impulso.", "Inclina un poco el tronco hacia delante.", ["curl-femoral-tumbado"]),

  // ---------- GLÚTEOS ----------
  ej("hip-thrust", "Hip thrust", "gluteos", ["isquios"], "barra", "Extensión de cadera", 2, true, [8, 12], 2.0,
    ["Espalda apoyada en un banco, barra sobre la cadera.", "Sube la cadera hasta alinear tronco y muslos.", "Baja controlado."],
    "Arquear la espalda arriba.", "Mira al frente, no al techo.", ["patada-gluteo", "peso-muerto-rumano"]),
  ej("patada-gluteo", "Patada de glúteo en polea", "gluteos", [], "polea", "Extensión de cadera", 1, false, [12, 15], 0.4,
    ["Tobillera en la polea baja.", "Lleva la pierna hacia atrás.", "Vuelve despacio."],
    "Arquear la espalda baja.", "Peso por pierna.", ["hip-thrust"]),
  ej("abductores", "Abductores en máquina", "gluteos", [], "maquina", "Abducción de cadera", 1, false, [12, 15], 1.2,
    ["Siéntate con las piernas juntas.", "Abre las piernas.", "Vuelve despacio."],
    "Soltar el peso de golpe.", "Inclínate un poco hacia delante.", ["patada-gluteo"]),

  // ---------- GEMELOS ----------
  ej("gemelos-maquina", "Gemelos en máquina", "gemelos", [], "maquina", "Flexión plantar", 1, false, [10, 15], 1.8,
    ["Puntas de los pies en el borde.", "Sube de puntillas todo lo que puedas.", "Baja hasta notar el estiramiento."],
    "Hacer rebotes rápidos.", "Pausa arriba y abajo.", ["gemelos-mancuerna"]),
  ej("gemelos-mancuerna", "Gemelos con mancuerna a una pierna", "gemelos", [], "mancuernas", "Flexión plantar", 1, false, [12, 20], 0.4,
    ["De pie en un escalón con una mancuerna.", "Sube de puntillas.", "Baja despacio."],
    "Doblar la rodilla.", "Reps por pierna.", ["gemelos-maquina"]),
  // ---------- AMPLIACIÓN 2.2: cada uno cubre un hueco concreto ----------
  // Aductores: no había ningún ejercicio para la cara interna del muslo
  ej("aductores", "Aductores en máquina", "aductores", [], "maquina", "Aducción de cadera", 1, false, [12, 15], 1.0,
    ["Siéntate con la espalda apoyada y las piernas abiertas contra las almohadillas.", "Junta las piernas de forma controlada.", "Vuelve despacio hasta notar el estiramiento."],
    "Abrir más de lo que permite tu flexibilidad.", "Empieza con un recorrido cómodo y amplíalo poco a poco.", ["sentadilla-goblet"]),
  // Gemelo sentado: con la rodilla doblada trabaja sobre todo el sóleo, que el gemelo de pie trabaja poco
  ej("gemelo-sentado", "Gemelo sentado en máquina", "gemelos", [], "maquina", "Flexión plantar", 1, false, [12, 20], 1.0,
    ["Siéntate con las rodillas bajo la almohadilla y las puntas en el borde.", "Sube los talones todo lo que puedas.", "Baja despacio hasta notar el estiramiento."],
    "Rebotar abajo sin control.", "Pausa de un segundo arriba y abajo.", ["gemelos-maquina", "gemelos-mancuerna"]),
  // Remo con pecho apoyado: espalda sin carga para la zona lumbar
  ej("remo-pecho-apoyado", "Remo con pecho apoyado", "espalda", ["biceps", "hombros"], "maquina", "Tirón horizontal", 1, true, [8, 12], 1.0,
    ["Apoya el pecho en el soporte y coge las asas con los brazos estirados.", "Tira llevando los codos hacia atrás.", "Vuelve despacio sin despegar el pecho."],
    "Separar el pecho del soporte para mover más peso.", "Ajusta la altura para que las asas queden a la altura del pecho.", ["remo-maquina", "remo-mancuerna"]),
  // Dominadas asistidas: el paso intermedio entre el jalón y la dominada libre
  ej("dominadas-asistidas", "Dominadas asistidas", "espalda", ["biceps"], "maquina", "Tirón vertical", 1, true, [6, 12], 1.6,
    ["Elige la asistencia y apoya las rodillas o los pies en la plataforma.", "Tira hasta pasar la barbilla por encima de la barra.", "Baja controlado hasta estirar los brazos."],
    "Usar tanta asistencia que el ejercicio no cuesta.", "El peso que escribes es la ayuda: cuanto menos, más difícil.", ["dominadas", "jalon"], 1.0, true),
  // Fondos asistidos: progresión hacia los fondos libres
  ej("fondos-asistidos", "Fondos asistidos", "pecho", ["triceps", "hombros"], "maquina", "Empuje vertical", 1, true, [6, 12], 1.7,
    ["Elige la asistencia y apoya las rodillas en la plataforma.", "Baja doblando los codos con el tronco un poco inclinado.", "Sube hasta estirar los brazos."],
    "Bajar demasiado y forzar el hombro.", "El peso que escribes es la ayuda: cuanto menos, más difícil.", ["fondos", "press-maquina"], 1.0, true),
  // Hip thrust en máquina: glúteo guiado, sin montar barra ni discos
  ej("hip-thrust-maquina", "Hip thrust en máquina", "gluteos", ["isquios"], "maquina", "Extensión de cadera", 1, true, [8, 12], 1.8,
    ["Apoya la espalda en el respaldo y coloca el cinturón o la almohadilla sobre la cadera.", "Sube la cadera hasta alinear tronco y muslos.", "Baja controlado."],
    "Arquear la zona lumbar al final del movimiento.", "Aprieta los glúteos arriba un segundo.", ["hip-thrust", "patada-gluteo"]),
  // Multipower: movimiento guiado para quien aún no domina la barra libre
  ej("sentadilla-multipower", "Sentadilla en multipower", "cuadriceps", ["gluteos"], "maquina", "Sentadilla", 1, true, [6, 10], 1.6,
    ["Coloca la barra sobre la parte alta de la espalda y los pies un poco adelantados.", "Desbloquea girando la barra y baja doblando rodillas y cadera.", "Sube y bloquea la barra en los ganchos al terminar."],
    "Poner los pies justo debajo de la barra y cargar las rodillas.", "Ajusta los topes de seguridad a la altura más baja que vayas a bajar.", ["sentadilla", "hack", "prensa"]),
  ej("press-inclinado-multipower", "Press inclinado en multipower", "pecho", ["hombros", "triceps"], "maquina", "Empuje inclinado", 1, true, [6, 10], 0.9,
    ["Coloca el banco a unos 30 grados con la barra sobre la parte alta del pecho.", "Desbloquea y baja la barra controlada hasta el pecho.", "Empuja y bloquea en los ganchos al terminar."],
    "Colocar el banco tan inclinado que trabaja sobre todo el hombro.", "Ajusta los topes por encima de tu pecho por si no puedes subir.", ["press-inclinado-mancuernas", "press-banca"]),
  // Hiperextensiones: zona lumbar con carga ligera y controlada
  ej("hiperextensiones", "Hiperextensiones (extensión lumbar)", "espalda", ["gluteos", "isquios"], "corporal", "Extensión lumbar", 1, false, [10, 15], 0.8,
    ["Ajusta el apoyo para que quede justo por debajo de la cadera.", "Baja el tronco con la espalda recta.", "Sube hasta alinear el tronco con las piernas, sin pasarte."],
    "Subir de más y arquear la espalda.", "Escribe 0 kg si no sujetas ningún disco.", ["peso-muerto-rumano"], 0.5)
];

// 9 rangos propios. "min" = puntuación mínima (0-100)
const RANGOS = [
  { nombre: "Hierro",    min: 0,  color: "#8A94A3", claro: "#D5DAE1", oscuro: "#3B4250" },
  { nombre: "Bronce",    min: 12, color: "#C47A45", claro: "#F0C29C", oscuro: "#6B3A17" },
  { nombre: "Plata",     min: 24, color: "#B9C4D2", claro: "#FFFFFF", oscuro: "#5F6B7C" },
  { nombre: "Oro",       min: 36, color: "#F2B531", claro: "#FFE9A8", oscuro: "#8C5B00" },
  { nombre: "Platino",   min: 48, color: "#37C9C0", claro: "#BFF6F1", oscuro: "#0E6A64" },
  { nombre: "Esmeralda", min: 58, color: "#2FC46B", claro: "#B5F5CD", oscuro: "#0D6A33" },
  { nombre: "Diamante",  min: 68, color: "#4A9DFF", claro: "#CFE5FF", oscuro: "#1A4FA0" },
  { nombre: "Titán",     min: 78, color: "#9B6BFF", claro: "#DCCBFF", oscuro: "#4B2A9E" },
  { nombre: "Apex",      min: 88, color: "#FF4D8D", claro: "#FFC2D8", oscuro: "#9E1446" }
];

// Usuarios ficticios para el modo demo de la parte social
const USUARIOS_DEMO = [
  { uid: "demo-laura", usuario: "laura.fit", nombre: "Laura", rango: 5 },
  { uid: "demo-marcos", usuario: "marcos_lift", nombre: "Marcos", rango: 6 },
  { uid: "demo-sara", usuario: "sara.trains", nombre: "Sara", rango: 3 },
  { uid: "demo-dani", usuario: "dani_gym", nombre: "Dani", rango: 4 },
  { uid: "demo-noa", usuario: "noa.strong", nombre: "Noa", rango: 7 },
  { uid: "demo-hugo", usuario: "hugo.pr", nombre: "Hugo", rango: 2, privado: true }
];
