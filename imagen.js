// =====================================================
// IMAGEN PARA COMPARTIR EL ENTRENO (para Instagram, TikTok o WhatsApp)
// Se dibuja en un <canvas> de 1080 × 1350 (formato vertical de Instagram).
// =====================================================

// Convierte un SVG (texto) en una imagen que se puede pintar en el canvas
function svgAImagen(svg, ancho, alto) {
  return new Promise(function (ok, mal) {
    const conTamano = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="' + ancho + '" height="' + alto + '" ');
    const img = new Image();
    img.onload = function () { ok(img); };
    img.onerror = mal;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(conTamano);
  });
}

// Rectángulo con las esquinas redondeadas
function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

async function crearImagenEntreno(s) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const W = 1080, H = 1350;
  const lienzo = document.createElement("canvas");
  lienzo.width = W; lienzo.height = H;
  const ctx = lienzo.getContext("2d");
  const TITULO = '"Chakra Petch", sans-serif', TEXTO = '"Manrope", sans-serif';

  // 1. Fondo oscuro con un brillo morado
  const fondo = ctx.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, "#0E0E16"); fondo.addColorStop(1, "#24194A");
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, W, H);
  const brillo = ctx.createRadialGradient(W * 0.8, 260, 0, W * 0.8, 260, 520);
  brillo.addColorStop(0, "rgba(138,92,255,.45)"); brillo.addColorStop(1, "rgba(138,92,255,0)");
  ctx.fillStyle = brillo; ctx.fillRect(0, 0, W, H);

  // 2. Cabecera: nombre de la app y fecha
  ctx.fillStyle = "#9A7CFF"; ctx.font = "700 44px " + TITULO; ctx.textBaseline = "top";
  ctx.fillText("APIX GYM", 80, 80);
  ctx.fillStyle = "#A8A8BC"; ctx.font = "500 34px " + TEXTO;
  ctx.fillText(tr(fechaBonita(s.fecha)), 80, 140);

  // 3. Apix celebrando (amarillo si has completado el entreno)
  const apix = await svgAImagen(apixSVG(humorResumen(s)), 300, 300);
  ctx.drawImage(apix, W - 380, 60, 300, 300);

  // 4. Nombre del día de entreno (en dos líneas si es largo)
  ctx.fillStyle = "#FFFFFF"; ctx.font = "700 84px " + TITULO;
  const palabras = tr(s.diaNombre).toUpperCase().split(" ");
  let linea = "", y = 400; const lineas = [];
  for (const p of palabras) { const prueba = linea ? linea + " " + p : p; if (ctx.measureText(prueba).width > W - 160 && linea) { lineas.push(linea); linea = p; } else linea = prueba; }
  lineas.push(linea);
  for (const l of lineas.slice(0, 2)) { ctx.fillText(l, 80, y); y += 96; }

  // 5. Tres cifras: duración, series y kg
  const cifras = [[s.duracion, tr("min")], [s.seriesEfectivas, tr("series")], [miles(s.volumen), "kg"]];
  const anchoCaja = (W - 160 - 40) / 3; y += 30;
  cifras.forEach(function (c, i) {
    const x = 80 + i * (anchoCaja + 20);
    ctx.fillStyle = "rgba(255,255,255,.07)"; rectRedondo(ctx, x, y, anchoCaja, 190, 28); ctx.fill();
    ctx.fillStyle = "#FFFFFF"; ctx.font = "700 72px " + TITULO; ctx.textAlign = "center";
    ctx.fillText(String(c[0]), x + anchoCaja / 2, y + 36);
    ctx.fillStyle = "#A8A8BC"; ctx.font = "600 32px " + TEXTO;
    ctx.fillText(c[1], x + anchoCaja / 2, y + 126);
    ctx.textAlign = "left";
  });
  y += 240;

  // 6. Récords del día (máximo 3)
  if (s.prs.length) {
    ctx.fillStyle = "#FFD23F"; ctx.font = "700 40px " + TITULO;
    ctx.fillText("🏆 " + tr("Récords") + " (" + s.prs.length + ")", 80, y); y += 64;
    ctx.fillStyle = "#FFFFFF"; ctx.font = "600 38px " + TEXTO;
    for (const id of s.prs.slice(0, 3)) { const ej = buscarEj(id); ctx.fillText("• " + tr(ej ? ej.nombre : id), 80, y); y += 54; }
    y += 20;
  }

  // 7. Rango global con su insignia y la racha
  const pg = puntosGlobal();
  const rg = pg === null ? null : rangoDePuntos(pg);
  const yRango = H - 330;
  ctx.fillStyle = "rgba(255,255,255,.07)"; rectRedondo(ctx, 80, yRango, W - 160, 180, 28); ctx.fill();
  if (rg !== null) { const ins = await svgAImagen(insignia(rg, "lg"), 150, 146); ctx.drawImage(ins, 100, yRango + 17, 150, 146); }
  ctx.fillStyle = "#A8A8BC"; ctx.font = "600 30px " + TEXTO;
  ctx.fillText(tr("Rango global"), 280, yRango + 38);
  ctx.fillStyle = "#FFFFFF"; ctx.font = "700 56px " + TITULO;
  ctx.fillText(tr(nombreRango(rg)).toUpperCase(), 280, yRango + 80);
  const racha = rachaSemanas();
  if (racha > 0) { ctx.fillStyle = "#FF9F43"; ctx.font = "700 34px " + TEXTO; ctx.textAlign = "right"; ctx.fillText("🔥 " + racha, W - 110, yRango + 38); ctx.textAlign = "left"; }

  // 8. Pie: dónde descargar la app
  ctx.fillStyle = "#A8A8BC"; ctx.font = "600 30px " + TEXTO; ctx.textAlign = "center";
  ctx.fillText(tr("Entrena conmigo en Apix Gym"), W / 2, H - 110);
  ctx.fillStyle = "#9A7CFF"; ctx.font = "700 30px " + TEXTO;
  ctx.fillText("abdelah844.github.io/apex-gym", W / 2, H - 66);
  ctx.textAlign = "left";

  return new Promise(function (ok) { lienzo.toBlob(ok, "image/png"); });
}

// Comparte la imagen (WhatsApp, Instagram...) o, si el móvil no puede, la descarga
async function compartirImagenEntreno(s) {
  toast("Creando la imagen…");
  let blob;
  try { blob = await crearImagenEntreno(s); } catch (e) { toast("No se ha podido crear la imagen", "error"); return; }
  const archivo = new File([blob], "apex-gym-entreno.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
    try { await navigator.share({ files: [archivo], title: tr("Mi entreno"), text: tr("Entrena conmigo en Apix Gym") + " " + URL_APP }); }
    catch (e) { /* el usuario ha cancelado */ }
    return;
  }
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob); enlace.download = "apex-gym-entreno.png";
  document.body.appendChild(enlace); enlace.click(); enlace.remove();
  setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 4000);
  toast("✓ Imagen descargada", "ok");
}
