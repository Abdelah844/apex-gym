// =====================================================
// APIX GYM · IDIOMAS (español, inglés y francés)
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
  // ---- Generales ----
  ["Hola, {x}", "Hi, {x}", "Salut, {x}"],
  ["Tu mejor avance: {x} en {x}.", "Your best progress: {x} in {x}.", "Ton meilleur progrès : {x} en {x}."],
  ["📸 Compartir mi mes de {x}", "📸 Share my {x}", "📸 Partager mon mois de {x}"],
  ["Ritmo: {x} al mes", "Pace: {x} a month", "Rythme : {x} par mois"],
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
  ["Datos de @{x} actualizados.", "@{x}’s data updated.", "Données de @{x} mises à jour."],
  ["@{x} añadido a tus amigos.", "@{x} added to your friends.", "@{x} ajouté à tes amis."],
  ["Entreno en curso · {x}", "Workout in progress · {x}", "Séance en cours · {x}"],
  ["Para tener más datos en este grupo puedes añadir: {x}", "To get more data in this group you can add: {x}", "Pour avoir plus de données dans ce groupe, tu peux ajouter : {x}"],
  ["Para subir, mejora tus músculos más flojos: {x}", "To move up, improve your weakest muscles: {x}", "Pour monter, améliore tes muscles les plus faibles : {x}"],
  ["Cambiar por {x}", "Swap for {x}", "Remplacer par {x}"],
  ["✓ Cambiado por {x}", "✓ Swapped for {x}", "✓ Remplacé par {x}"],
  ["Quitado: {x}. Pulsa «Deshacer» si fue sin querer.", "Removed: {x}. Tap “Undo” if it was a mistake.", "Retiré : {x}. Appuie sur « Annuler » si c’était une erreur."],
  ["Quitado: {x}", "Removed: {x}", "Retiré : {x}"],
  ["Tu rutina actual «{x}» se sustituirá.", "Your current routine “{x}” will be replaced.", "Ton programme actuel « {x} » sera remplacé."],
  ["El usuario «{x}» ya está cogido. Prueba con otro.", "The username “{x}” is already taken. Try another one.", "Le nom d’utilisateur « {x} » est déjà pris. Essaie un autre."],
  ["Ejercicio desconocido: {x}", "Unknown exercise: {x}", "Exercice inconnu : {x}"],
  ["Ejercicio sin series en {x}", "Exercise with no sets in {x}", "Exercice sans séries dans {x}"],
  ["El enlace ha caducado o ya se usó. Vuelve a pedirlo. ({x})", "The link has expired or was already used. Request it again. ({x})", "Le lien a expiré ou a déjà été utilisé. Redemande-le. ({x})"],
  ["La copia de la nube no es válida: {x}", "The cloud backup isn’t valid: {x}", "La sauvegarde du cloud n’est pas valide : {x}"],
  ["Si existe una cuenta con {x}, te llegará un email. Pulsa el enlace y elige una contraseña nueva.", "If there’s an account with {x}, you’ll get an email. Tap the link and choose a new password.", "S’il existe un compte avec {x}, tu recevras un e-mail. Appuie sur le lien et choisis un nouveau mot de passe."],
  ["Te hemos enviado un email a {x}. Ábrelo y pulsa el enlace para activar la cuenta. Después, inicia sesión.", "We’ve sent an email to {x}. Open it and tap the link to activate your account. Then log in.", "Nous avons envoyé un e-mail à {x}. Ouvre-le et appuie sur le lien pour activer le compte. Ensuite, connecte-toi."],
  ["Superserie: ahora {x}", "Superset: now {x}", "Superset : maintenant {x}"],
  ["Hoy toca descanso · próximo: {x}", "Rest day today · next: {x}", "Repos aujourd’hui · prochain : {x}"],
  ["Completó {x} · {x} series efectivas · {x} récord(s)", "Completed {x} · {x} effective sets · {x} record(s)", "A terminé {x} · {x} séries efficaces · {x} record(s)"],
  ["Completó {x} · {x} series efectivas", "Completed {x} · {x} effective sets", "A terminé {x} · {x} séries efficaces"],
  ["💪 {x} en Apix Gym · racha de {x} semanas 🔥", "💪 {x} on Apix Gym · {x}-week streak 🔥", "💪 {x} sur Apix Gym · série de {x} semaines 🔥"],
  ["💪 {x} en Apix Gym", "💪 {x} on Apix Gym", "💪 {x} sur Apix Gym"],
  ["{x} series hechas. Estoy orgulloso de ti.", "{x} sets done. I’m proud of you.", "{x} séries faites. Je suis fier de toi."],
  ["{x} récords nuevos. ¡Eres una máquina!", "{x} new records. You’re a machine!", "{x} nouveaux records. Tu es une machine !"],
  ["{x} récord nuevo. ¡Eres una máquina!", "{x} new record. You’re a machine!", "{x} nouveau record. Tu es une machine !"],
  ["{x} series hechas. Si la próxima vez acabas todas, me pondré amarillo.", "{x} sets done. If you finish them all next time, I’ll turn yellow.", "{x} séries faites. Si tu les termines toutes la prochaine fois, je deviendrai jaune."],
  ["{x} récords nuevos. Has hecho todas las series: ¡mira qué color me has puesto!", "{x} new records. You did every set: look what colour you’ve turned me!", "{x} nouveaux records. Tu as fait toutes les séries : regarde quelle couleur tu m’as donnée !"],
  ["{x} récord nuevo. Has hecho todas las series: ¡mira qué color me has puesto!", "{x} new record. You did every set: look what colour you’ve turned me!", "{x} nouveau record. Tu as fait toutes les séries : regarde quelle couleur tu m’as donnée !"],
  ["{x} récords nuevos. ¡Eres una máquina! Si acabas todas las series, me pondré amarillo.", "{x} new records. You’re a machine! If you finish every set, I’ll turn yellow.", "{x} nouveaux records. Tu es une machine ! Si tu termines toutes les séries, je deviendrai jaune."],
  ["{x} récord nuevo. ¡Eres una máquina! Si acabas todas las series, me pondré amarillo.", "{x} new record. You’re a machine! If you finish every set, I’ll turn yellow.", "{x} nouveau record. Tu es une machine ! Si tu termines toutes les séries, je deviendrai jaune."],
  ["Se han importado {x} entrenos.", "{x} workouts were imported.", "{x} séances ont été importées."],
  ["Tu última copia es de hace {x} días.", "Your last backup is {x} days old.", "Ta dernière sauvegarde date d’il y a {x} jours."],
  ["Elige exactamente {x} días (llevas {x}).", "Choose exactly {x} days (you have {x}).", "Choisis exactement {x} jours (tu en as {x})."],
  ["Elige exactamente {x} días.", "Choose exactly {x} days.", "Choisis exactement {x} jours."],
  ["Elige {x} días (llevas {x}).", "Choose {x} days (you have {x}).", "Choisis {x} jours (tu en as {x})."],
  ["{x} dura unos {x} min (tienes {x}).", "{x} takes about {x} min (you have {x}).", "{x} dure environ {x} min (tu en as {x})."],
  ["{x} no tiene ejercicios.", "{x} has no exercises.", "{x} n’a pas d’exercices."],
  ["{x} se ha cambiado por {x} en {x}.", "{x} was swapped for {x} on {x}.", "{x} a été remplacé par {x} le {x}."],
  ["{x} tiene carga alta el {x} ({x}) y el {x} ({x}), días seguidos.", "{x} gets a heavy load on {x} ({x}) and {x} ({x}), back-to-back days.", "{x} a une forte charge le {x} ({x}) et le {x} ({x}), des jours consécutifs."],
  ["{x}: escribe un valor entre {x} y {x} cm.", "{x}: enter a value between {x} and {x} cm.", "{x} : écris une valeur entre {x} et {x} cm."],
  ["{x}: RPE no válido.", "{x}: invalid RPE.", "{x} : RPE non valide."],
  ["{x}: {x} series por semana (recomendado unas {x}).", "{x}: {x} sets per week (about {x} recommended).", "{x} : {x} séries par semaine (environ {x} recommandées)."],
  ["{x}: {x} series/semana, demasiado volumen ({x}).", "{x}: {x} sets/week, too much volume ({x}).", "{x} : {x} séries/semaine, trop de volume ({x})."],
  ["{x}: {x} series/semana, por debajo de lo recomendado ({x}).", "{x}: {x} sets/week, below the recommended amount ({x}).", "{x} : {x} séries/semaine, en dessous du recommandé ({x})."],
  ["{x}: {x} sesiones comparables en {x} días sin superar tu mejor marca ({x} de {x}RM).", "{x}: {x} comparable sessions in {x} days without beating your best lift ({x} of {x}RM).", "{x} : {x} séances comparables en {x} jours sans battre ta meilleure marque ({x} de {x}RM)."],
  ["{x}% hacia {x}", "{x}% towards {x}", "{x}% vers {x}"],
  ["{x} de {x} superadas", "{x} of {x} passed", "{x} sur {x} réussis"],
  ["Hoy acaba tu reto «{x}». ¡A por él!", "Your challenge “{x}” ends today. Go for it!", "Ton défi « {x} » se termine aujourd’hui. Fonce !"],
  ["Tu rango global está limitado a {x} hasta completar {x} entrenos válidos (llevas {x}).", "Your overall rank is capped at {x} until you complete {x} valid workouts (you have {x}).", "Ton rang global est plafonné à {x} jusqu’à {x} séances valides (tu en as {x})."],
  ["Te faltan datos de {x}. Cada músculo sin datos cuenta {x} en el global.", "You’re missing data for {x}. Each muscle without data counts {x} in the overall rank.", "Il te manque des données pour {x}. Chaque muscle sans données compte {x} dans le global."],
  ["Necesitas {x} sesión(es) más con este ejercicio para poder subir a {x}. El tope evita subir de rango con un solo día bueno.", "You need {x} more session(s) with this exercise to be able to move up to {x}. The cap stops you ranking up with a single good day.", "Il te faut {x} séance(s) de plus avec cet exercice pour pouvoir monter à {x}. Le plafond évite de monter de rang avec un seul bon jour."],
  ["Para {x} necesitas una {x}RM estimada de {x}. Por ejemplo: {x}.", "For {x} you need an estimated {x}RM of {x}. For example: {x}.", "Pour {x} il te faut un {x}RM estimé de {x}. Par exemple : {x}."],
  ["{x} de ayuda × {x}", "{x} of assistance × {x}", "{x} d’aide × {x}"],
  ["{x} de lastre × {x}", "{x} of extra weight × {x}", "{x} de lest × {x}"],
  ["{x} reps con {x} kg de ayuda", "{x} reps with {x} kg of assistance", "{x} rép avec {x} kg d’aide"],
  ["La ayuda ({x} kg) no puede ser igual o mayor que tu peso corporal.", "The assistance ({x} kg) can’t be equal to or greater than your body weight.", "L’aide ({x} kg) ne peut pas être égale ou supérieure à ton poids du corps."],
  ["¿Lo has escrito en libras? {x} lb son {x} kg.", "Did you write it in pounds? {x} lb is {x} kg.", "Tu l’as écrit en livres ? {x} lb font {x} kg."],
  ["Es un {x} % más que tu máximo ({x} kg).", "That’s {x} % more than your max ({x} kg).", "C’est {x} % de plus que ton maximum ({x} kg)."],
  ["Son muchas más repeticiones de las previstas ({x}).", "That’s many more reps than planned ({x}).", "C’est beaucoup plus de répétitions que prévu ({x})."],
  ["Tu esfuerzo medio esta semana es muy alto (RPE {x}).", "Your average effort this week is very high (RPE {x}).", "Ton effort moyen cette semaine est très élevé (RPE {x})."],
  ["Llegaste a {x} reps en todas las series. Repítelo una vez más para confirmar antes de subir.", "You hit {x} reps on every set. Do it once more to confirm before going up.", "Tu as fait {x} rép sur toutes les séries. Refais-le une fois pour confirmer avant d’augmenter."],
  ["Completaste todas las series en {x} reps. Quita {x} kg de ayuda (de {x} a {x} kg).", "You completed every set at {x} reps. Remove {x} kg of assistance (from {x} to {x} kg).", "Tu as terminé toutes les séries à {x} rép. Retire {x} kg d’aide (de {x} à {x} kg)."],
  ["Completaste todas las series en {x} reps. Sube a {x} kg.", "You completed every set at {x} reps. Go up to {x} kg.", "Tu as terminé toutes les séries à {x} rép. Passe à {x} kg."],
  ["Dos sesiones seguidas por debajo de {x} reps. Añade {x} kg de ayuda y vuelve a progresar.", "Two sessions in a row below {x} reps. Add {x} kg of assistance and progress again.", "Deux séances d’affilée en dessous de {x} rép. Ajoute {x} kg d’aide et repars."],
  ["Dos sesiones seguidas por debajo de {x} reps. Baja un {x} % y vuelve a progresar.", "Two sessions in a row below {x} reps. Drop {x} % and progress again.", "Deux séances d’affilée en dessous de {x} rép. Baisse de {x} % et repars."],
  ["No llegaste a {x} reps en varias series. Mantén el peso hasta conseguirlo.", "You didn’t reach {x} reps on several sets. Keep the weight until you do.", "Tu n’as pas atteint {x} rép sur plusieurs séries. Garde le poids jusqu’à y arriver."],
  ["Subir {x} kg sería un +{x} %. Primero suma repeticiones (hasta {x}) y luego sube.", "Adding {x} kg would be +{x} %. First add reps (up to {x}) and then go up.", "Ajouter {x} kg ferait +{x} %. Ajoute d’abord des répétitions (jusqu’à {x}) puis augmente."],
  ["Serie descendente: baja a {x} kg y sigue sin descansar", "Drop set: go down to {x} kg and keep going without rest", "Série dégressive : descends à {x} kg et continue sans repos"],
  ["🏆 ¡Récord personal! {x}", "🏆 Personal record! {x}", "🏆 Record personnel ! {x}"],
  ["{x} kg × {x}. Eso antes no lo levantabas.", "{x} kg × {x}. You couldn’t lift that before.", "{x} kg × {x}. Avant, tu ne soulevais pas ça."],
  ["Siguiente: {x}", "Next: {x}", "Suivant : {x}"],
  ["✓ Copia descargada: {x}", "✓ Backup downloaded: {x}", "✓ Sauvegarde téléchargée : {x}"],
  ["✓ Descanso de {x}: {x} s", "✓ Rest for {x}: {x} s", "✓ Repos pour {x} : {x} s"],
  ["✓ Guardado en la nube el {x}.", "✓ Saved to the cloud on {x}.", "✓ Enregistré dans le cloud le {x}."],
  ["✓ Guardado en la nube hace {x} min.", "✓ Saved to the cloud {x} min ago.", "✓ Enregistré dans le cloud il y a {x} min."],
  ["✓ Guardado en la nube hace {x} h.", "✓ Saved to the cloud {x} h ago.", "✓ Enregistré dans le cloud il y a {x} h."],
  ["✓ {x} kg en las series pendientes", "✓ {x} kg on the remaining sets", "✓ {x} kg sur les séries restantes"],
  ["+{x} serie (ahora {x})", "+{x} set (now {x})", "+{x} série (maintenant {x})"],
  ["−{x} serie (ahora {x})", "−{x} set (now {x})", "−{x} série (maintenant {x})"],
  ["🗑 Borrar serie {x}", "🗑 Delete set {x}", "🗑 Supprimer la série {x}"],
  ["Paso {x} de {x}", "Step {x} of {x}", "Étape {x} sur {x}"],
  ["🔥 Racha de {x} semanas · {x} entrenos", "🔥 {x}-week streak · {x} workouts", "🔥 Série de {x} semaines · {x} séances"],
  ["🔥 Racha de {x} semana · {x} entrenos", "🔥 {x}-week streak · {x} workouts", "🔥 Série de {x} semaine · {x} séances"],
  ["🔥 Racha de {x} semanas · {x} entreno", "🔥 {x}-week streak · {x} workout", "🔥 Série de {x} semaines · {x} séance"],
  ["{x} entrenos · {x} series · {x} kg · 🏆 {x}", "{x} workouts · {x} sets · {x} kg · 🏆 {x}", "{x} séances · {x} séries · {x} kg · 🏆 {x}"],
  ["{x} entrenos · {x} series · {x} kg", "{x} workouts · {x} sets · {x} kg", "{x} séances · {x} séries · {x} kg"],
  ["{x} entreno · {x} series · {x} kg · 🏆 {x}", "{x} workout · {x} sets · {x} kg · 🏆 {x}", "{x} séance · {x} séries · {x} kg · 🏆 {x}"],
  ["{x} entreno · {x} series · {x} kg", "{x} workout · {x} sets · {x} kg", "{x} séance · {x} séries · {x} kg"],
  ["Semana del {x}", "Week of {x}", "Semaine du {x}"],
  ["Ver semanas anteriores ({x} más)", "See earlier weeks ({x} more)", "Voir les semaines précédentes ({x} de plus)"],
  ["Su mejor serie hoy: {x} × {x} · Tu mejor serie: {x} × {x}", "Their best set today: {x} × {x} · Your best set: {x} × {x}", "Sa meilleure série aujourd’hui : {x} × {x} · Ta meilleure série : {x} × {x}"],
  ["💪 Tú vas un {x} % por delante", "💪 You’re {x}% ahead", "💪 Tu as {x} % d’avance"],
  ["🎯 Te saca un {x} %: ¡a por él!", "🎯 They’re {x}% ahead: go get them!", "🎯 Il a {x} % d’avance : à toi de jouer !"],
  ["🏋️ {x} ejercicios", "🏋️ {x} exercises", "🏋️ {x} exercices"],
  ["🏆 {x} récord(s)", "🏆 {x} record(s)", "🏆 {x} record(s)"],
  ["Tu entreno · {x}", "Your workout · {x}", "Ta séance · {x}"],
  ["Añadir {x} serie a {x}", "Add {x} set to {x}", "Ajouter {x} série à {x}"],
  ["Se ha añadido {x} serie a {x} ({x}): ahora tiene {x}.", "{x} set was added to {x} ({x}): it now has {x}.", "{x} série a été ajoutée à {x} ({x}) : il en a maintenant {x}."],
  ["Completaste todas las series en {x}", "You completed every set in {x}", "Tu as terminé toutes les séries de {x}"],
  ["Rutina {x}", "{x} routine", "Programme {x}"],
  ["{x} reps", "{x} reps", "{x} rép"],
  ["Es {x} kg menos de ayuda que tu mínimo ({x} kg).", "That’s {x} kg less assistance than your minimum ({x} kg).", "C’est {x} kg d’aide de moins que ton minimum ({x} kg)."],
  ["Se añadirá exactamente {x} serie a {x} ({x}), que pasará de {x} a {x} series.", "Exactly {x} set will be added to {x} ({x}), going from {x} to {x} sets.", "Exactement {x} série sera ajoutée à {x} ({x}), qui passera de {x} à {x} séries."],
  ["Completaste todas las series en {x} reps dos sesiones seguidas. Puedes probar +{x} kg y volver a {x} reps.", "You completed every set at {x} reps two sessions in a row. You can try +{x} kg and go back to {x} reps.", "Tu as terminé toutes les séries à {x} rép deux séances d’affilée. Tu peux essayer +{x} kg et revenir à {x} rép."],
  ["Completaste todas las series en {x} reps con esfuerzo controlado. Puedes probar +{x} kg y volver a {x} reps.", "You completed every set at {x} reps with controlled effort. You can try +{x} kg and go back to {x} reps.", "Tu as terminé toutes les séries à {x} rép avec un effort maîtrisé. Tu peux essayer +{x} kg et revenir à {x} rép."],
  ["Solo se han comparado sesiones sin molestias, sin cambio de máquina, sin semana de fatiga y con un peso corporal parecido. Cambiar a {x} unas semanas suele ayudar.", "Only sessions without discomfort, without a machine change, without a fatigue week and with a similar body weight were compared. Switching to {x} for a few weeks usually helps.", "Seules les séances sans gêne, sans changement de machine, sans semaine de fatigue et avec un poids du corps proche ont été comparées. Passer à {x} quelques semaines aide souvent."],
  ["(hace {x} día).", "({x} day ago).", "(il y a {x} jour)."],
  ["(hace {x} días).", "({x} days ago).", "(il y a {x} jours)."],
  ["(y {x} problema(s) más)", "(and {x} more problem(s))", "(et {x} autre(s) problème(s))"],
  ["{x}RM estimada con {x}. Cámbiala en Ajustes.", "Estimated {x}RM with {x}. Change it in Settings.", "{x}RM estimé avec {x}. Change-le dans Réglages."],
  ["Actualizado {x}", "Updated {x}", "Mis à jour {x}"],
  ["Equivalentes a {x}", "Equivalent to {x}", "Équivalents à {x}"],
  ["Frente a la última vez ({x})", "Compared with last time ({x})", "Par rapport à la dernière fois ({x})"],
  ["La recuperación se comprueba con tu calendario: {x}. Cuentan también los músculos que trabajan como secundarios.", "Recovery is checked against your calendar: {x}. Muscles working as secondary also count.", "La récupération est vérifiée avec ton calendrier : {x}. Les muscles secondaires comptent aussi."],
  ["Nivel: {x}", "Level: {x}", "Niveau : {x}"],
  ["No se ha podido conectar con la nube ({x}). Inténtalo más tarde.", "Couldn’t connect to the cloud ({x}). Try again later.", "Impossible de se connecter au cloud ({x}). Réessaie plus tard."],
  ["Nota: {x}", "Note: {x}", "Note : {x}"],
  ["Recuerda: {x}. Para si notas dolor.", "Remember: {x}. Stop if you feel pain.", "Rappel : {x}. Arrête si tu as mal."],
  ["Se excluyen {x} ejercicio(s) que no puedes hacer o no hay en tu gimnasio.", "{x} exercise(s) you can’t do or that your gym doesn’t have are excluded.", "{x} exercice(s) que tu ne peux pas faire ou absents de ta salle sont exclus."],
  ["Subir {x} kg sería un +{x} %. Primero suma repeticiones (hasta {x}) o usa un incremento menor si tu gimnasio lo tiene.", "Adding {x} kg would be +{x} %. First add reps (up to {x}) or use a smaller increment if your gym has it.", "Ajouter {x} kg ferait +{x} %. Ajoute d’abord des répétitions (jusqu’à {x}) ou utilise un incrément plus petit si ta salle en a."],
  ["Tope según sesiones con el ejercicio: {x} → {x}, {x} → {x}, {x} → {x}, {x} o más → sin tope. Un grupo con un solo ejercicio distinto tiene tope de {x}.", "Cap by sessions with the exercise: {x} → {x}, {x} → {x}, {x} → {x}, {x} or more → no cap. A group with only one different exercise is capped at {x}.", "Plafond selon les séances avec l’exercice : {x} → {x}, {x} → {x}, {x} → {x}, {x} ou plus → sans plafond. Un groupe avec un seul exercice différent est plafonné à {x}."],
  ["Tus informes ({x})", "Your reports ({x})", "Tes rapports ({x})"],
  ["Usar {x} kg", "Use {x} kg", "Utiliser {x} kg"],
  ["guardado {x}", "saved {x}", "enregistré {x}"],
  ["meta: {x} {x}", "goal: {x} {x}", "objectif : {x} {x}"],
  ["máx. {x} {x}", "max {x} {x}", "max {x} {x}"],
  ["{x} serie(s) en revisión.", "{x} set(s) under review.", "{x} série(s) en vérification."],
  ["· RPE {x}", "· RPE {x}", "· RPE {x}"],
  ["· racha de {x} semanas 🔥", "· {x}-week streak 🔥", "· série de {x} semaines 🔥"],
  ["· {x} récord(s)", "· {x} record(s)", "· {x} record(s)"],
  ["⚠ En revisión: {x}", "⚠ Under review: {x}", "⚠ En vérification : {x}"],
  ["Tu rango global está limitado a {x} hasta completar {x} entrenos válidos (llevas {x}).", "Your overall rank is capped at {x} until you complete {x} valid workouts (you have {x}).", "Ton rang global est plafonné à {x} jusqu’à {x} séances valides (tu en as {x})."],
  ["Te quedan {x} serie sin hacer. No se guardarán.", "You have {x} set left undone. It won’t be saved.", "Il te reste {x} série non faite. Elle ne sera pas enregistrée."],
  ["Te falta {x} entreno esta semana para no perder tu racha.", "You need {x} more workout this week so you don’t lose your streak.", "Il te manque {x} séance cette semaine pour ne pas perdre ta série."],
  ["Te faltan {x} entrenos esta semana para no perder tu racha.", "You need {x} more workouts this week so you don’t lose your streak.", "Il te manque {x} séances cette semaine pour ne pas perdre ta série."],
  ["({x}). Se han cargado igualmente. Revisa tu perfil en Ajustes y exporta una copia.", "({x}). They were loaded anyway. Check your profile in Settings and export a backup.", "({x}). Elles ont été chargées quand même. Vérifie ton profil dans Réglages et exporte une sauvegarde."],
  ["+{x} en revisión", "+{x} under review", "+{x} en vérification"],
  ["Invitación de @{x}", "Invitation from @{x}", "Invitation de @{x}"],
  ["Crea tu perfil y una cuenta en la nube (Ajustes → ☁️ Cuenta). Después, en Social → Amigos, escribe su usuario: @{x}", "Create your profile and a cloud account (Settings → ☁️ Account). Then, in Social → Friends, type their username: @{x}", "Crée ton profil et un compte cloud (Réglages → ☁️ Compte). Ensuite, dans Social → Amis, écris son nom d’utilisateur : @{x}"],
  ["¡Añádeme como amigo en Apix Gym! Mi usuario es @{x}. Abre el enlace:", "Add me as a friend on Apix Gym! My username is @{x}. Open the link:", "Ajoute-moi comme ami sur Apix Gym ! Mon nom d’utilisateur est @{x}. Ouvre le lien :"],
  ["Solicitudes recibidas ({x})", "Requests received ({x})", "Demandes reçues ({x})"],
  // ---- Mensajes de Apix (mascota.js) ----
  ["{x} días parado…", "{x} days without moving…", "{x} jours à l’arrêt…"],
  ["Llevas {x} días sin entrenar y hoy te toca.", "It’s been {x} days without training and today’s the day.", "Ça fait {x} jours sans entraînement et aujourd’hui c’est ton tour."],
  ["{x} días parado… ¡Me oxido de verlo!", "{x} days without moving… I’m getting rusty just watching!", "{x} jours à l’arrêt… Je rouille rien qu’à te regarder !"],
  ["Las ganas van y vienen; la disciplina se queda.", "Motivation comes and goes; discipline stays.", "La motivation va et vient ; la discipline reste."],
  ["¡¿Cómo que has perdido la racha?! {x} semanas seguidas… Esta semana la recuperamos, ¿vale?", "What do you mean you lost your streak?! {x} weeks in a row… We’ll get it back this week, okay?", "Comment ça, tu as perdu ta série ?! {x} semaines d’affilée… On la récupère cette semaine, d’accord ?"],
  ["Grrr… {x} semanas de racha a la basura. Venga, levanta y empezamos otra hoy.", "Grrr… a {x}-week streak in the bin. Come on, get up and let’s start another one today.", "Grrr… {x} semaines de série à la poubelle. Allez, lève-toi et on en commence une autre aujourd’hui."],
  ["¡{x} en {x}! Eso antes no lo levantabas. ¡Estoy orgulloso!", "{x} on {x}! You couldn’t lift that before. I’m proud!", "{x} en {x} ! Avant, tu ne soulevais pas ça. Je suis fier !"],
  ["¡Nuevo récord en {x}: {x}! El trabajo de estas semanas se nota.", "New record in {x}: {x}! These weeks of work are showing.", "Nouveau record en {x} : {x} ! Le travail de ces semaines se voit."],
  ["Te faltan {x} {x} para tu reto «{x}» y quedan {x} días.", "You need {x} more {x} for your challenge “{x}” and there are {x} days left.", "Il te manque {x} {x} pour ton défi « {x} » et il reste {x} jours."],
  ["Tu reto «{x}» te espera: faltan {x} {x}. ¡No lo sueltes ahora!", "Your challenge “{x}” is waiting: {x} {x} to go. Don’t let go now!", "Ton défi « {x} » t’attend : il manque {x} {x}. Ne lâche pas maintenant !"],
  ["¡Último día para tu reto «{x}»! Te faltan {x} {x}. Hoy es el día.", "Last day for your challenge “{x}”! You need {x} more {x}. Today’s the day.", "Dernier jour pour ton défi « {x} » ! Il te manque {x} {x}. C’est aujourd’hui."],
  ["¡Reto «{x}» conseguido! Sabía que podías. ¿Te pones otro más difícil?", "Challenge “{x}” achieved! I knew you could. Fancy a harder one?", "Défi « {x} » réussi ! Je savais que tu pouvais. Tu en prends un plus difficile ?"],
  ["¡Descanso terminado! A por ella.", "Rest over! Go get it.", "Repos terminé ! À toi de jouer."]
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
  // 3. Empieza en minúscula (p. ej. el nombre de un ejercicio dentro de una frase): se prueba con mayúscula
  const primera = frase.charAt(0);
  if (primera !== primera.toUpperCase()) {
    const t = traducirFrase(primera.toUpperCase() + frase.slice(1));
    if (t !== null) return t.charAt(0).toLowerCase() + t.slice(1);
  }
  // 4. Varias frases seguidas: se traduce cada una (tienen que conocerse todas)
  // (sin "lookbehind" en la expresión regular: así funciona también en iPhone antiguos)
  const frases = [];
  let resto = frase;
  const corte = /([.!?…])\s+(?=[¡¿A-ZÁÉÍÓÚÑ0-9{])/;
  let m;
  while ((m = resto.match(corte))) {
    frases.push(resto.slice(0, m.index + 1));
    resto = resto.slice(m.index + m[0].length);
  }
  frases.push(resto);
  if (frases.length > 1) {
    const trad = frases.map(traducirFrase);
    if (trad.every(function (t) { return t !== null; })) return trad.join(" ");
  }
  // 5. Partes separadas por " · " o por ", " (listas): cada parte por su cuenta
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

// Lee un número escrito en cualquier idioma: "7.340", "7,340", "62,5" o "62.5".
// Un separador seguido de exactamente 3 cifras es de miles; si no, es el decimal.
function leerNumeroLocal(t) {
  t = t.replace(/[\s\u00a0\u202f]/g, "");
  t = t.replace(/[.,](?=\d{3}(?:[.,]|$))/g, "");
  return parseFloat(t.replace(",", "."));
}
// Si el usuario usa libras, cambia "80 kg" por "176,5 lb" en todo el texto de la pantalla
function convertirUnidades(texto) {
  if (typeof usaLibras !== "function" || !usaLibras() || texto.indexOf("kg") < 0) return texto;
  return texto.replace(/(\d[\d.,\u00a0\u202f]*\d|\d)\s?kg\b/g, function (todo, num) {
    const kg = leerNumeroLocal(num);
    if (isNaN(kg)) return todo;
    const lb = kg * KG_A_LB;
    const redondo = lb >= 1000 ? Math.round(lb) : Math.round(lb * 2) / 2;
    return redondo.toLocaleString(localeApp()) + " lb";
  }).replace(/\bkg\b/g, "lb").replace(/\bKg\b/g, "Lb").replace(/\bKG\b/g, "LB");
}

function traducirNodoTexto(n) {
  if (traducidoPorMi.get(n) === n.nodeValue) return;
  if (saltarElemento(n.parentElement) || n.parentElement.closest("textarea")) return;
  const nuevo = convertirUnidades(IDIOMA_ACTUAL === "es" ? n.nodeValue : tr(n.nodeValue));
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
  // En español no hace falta traducir, pero el observador sigue activo para pasar kg a libras si se eligen
  if (IDIOMA_ACTUAL !== "es") { prepararTraductor(); document.title = tr(document.title); }
  traducirArbol(document.body);
  new MutationObserver(function (cambios) {
    for (const c of cambios) {
      if (c.type === "childList") { for (const n of c.addedNodes) traducirArbol(n); }
      else if (c.type === "characterData") traducirNodoTexto(c.target);
      else if (c.type === "attributes") traducirAtributos(c.target);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS_TRADUCIBLES });
}
