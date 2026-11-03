// Saca de verdad (con un analizador de JavaScript) todos los textos y frases montadas con "+"
const fs = require("fs");
const acorn = require("/opt/npm-tools/node_modules/acorn");
const walk = require("/opt/npm-tools/node_modules/acorn-walk");
const textos = new Set(), plantillas = new Set();
function trozos(s) { return s.split(/<[^>]*>/).map(t => t.replace(/\s+/g, " ").trim()).filter(t => /[a-záéíóúñ]{2}/i.test(t) && !/[=;]|class|data-|style|https?:|\.json|\.png|var\(/.test(t)); }
function aplanar(n, out) {
  if (n.type === "BinaryExpression" && n.operator === "+") { aplanar(n.left, out); aplanar(n.right, out); }
  else if (n.type === "Literal" && typeof n.value === "string") out.push(n.value);
  else if (n.type === "Literal" && typeof n.value === "number") out.push(String(n.value));
  else out.push("{x}");
}
for (const f of ["app.js", "logica.js", "eventos.js", "nube.js", "mascota.js", "academia.js", "datos.js"]) {
  const ast = acorn.parse(fs.readFileSync("" + f, "utf8"), { ecmaVersion: 2022 });
  walk.full(ast, function (n) {
    if (n.type === "Literal" && typeof n.value === "string") trozos(n.value).forEach(t => textos.add(t));
    if (n.type === "TemplateLiteral") n.quasis.forEach(q => trozos(q.value.cooked).forEach(t => textos.add(t)));
  });
  walk.ancestor(ast, {
    BinaryExpression(n, estado, padres) {
      if (n.operator !== "+") return;
      const p = padres[padres.length - 2];
      if (p && p.type === "BinaryExpression" && p.operator === "+") return;   // solo la cadena entera
      const out = []; aplanar(n, out);
      if (!out.some(x => x !== "{x}")) return;
      trozos(out.join("")).filter(t => t.includes("{x}")).forEach(t => plantillas.add(t));
    }
  });
}
fs.writeFileSync("i18n/textos_codigo.json", JSON.stringify([...textos].sort(), null, 0));
fs.writeFileSync("i18n/plantillas_codigo.json", JSON.stringify([...plantillas].sort(), null, 0));
console.log("textos", textos.size, "plantillas", plantillas.size);
