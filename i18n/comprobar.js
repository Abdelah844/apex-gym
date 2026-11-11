// Lista lo que aún no se traduce al inglés (textos completos y frases montadas)
const fs = require("fs");
global.localStorage = { getItem() { return "en"; }, setItem() { } }; global.navigator = { language: "en" };
eval(fs.readFileSync("idiomas.js", "utf8").replace("const TRADUCCIONES", "global.TRADUCCIONES"));
eval(fs.readFileSync("traductor.js", "utf8").replace(/^const /gm, "var ").replace(/^let /gm, "var "));
const ignorar = /^(AbortError|Alex|Apex|Apix Gym|Apix|Authorization|Bearer|Brzycki|Butterfly|Chin-Up|Content-Type|Crunches|Dani|Demo|Enter|Face pull|Hack squat|Hip thrust|Hugo|Kilos|Laura|Lombardi|Marcos|O'Conner|Prefer|Pullups|Pushups|Reps|Sara|Social|POST|PUT|GET|INPUT|BUTTON|undefined|min|kg|pts)$/;
const t = JSON.parse(fs.readFileSync("i18n/textos_codigo.json"));
const faltanT = t.filter(x => !ignorar.test(x) && !x.includes("_") && !/^[a-z0-9.\-:]+$/.test(x)).filter(x => { const p = x.replace(/\{n\}/g, "7"); return tr(p) === p; });
const pl = JSON.parse(fs.readFileSync("i18n/plantillas_codigo.json"));
const faltanP = pl.filter(x => { const p = x.replace(/\{x\}/g, "7"); return /[a-záéíóúñ]{3}/i.test(p.replace(/7/g, "")) && tr(p) === p; });
fs.writeFileSync("i18n/faltan.json", JSON.stringify({ textos: faltanT, plantillas: faltanP }, null, 1));
console.log("textos sin traducir:", faltanT.length, "| frases montadas sin traducir:", faltanP.length);
