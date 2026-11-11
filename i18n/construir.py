# Junta las traducciones en apex/idiomas.js y comprueba que no falte nada
import json, glob, re
lista = json.load(open("i18n/lista.json"))
tr = {}
for f in sorted(glob.glob("i18n/tr_*.tsv")):
    for linea in open(f, encoding="utf-8"):
        linea = linea.rstrip("\n")
        if not linea: continue
        partes = linea.split("\t")
        assert len(partes) == 3, (f, linea[:60])
        tr[int(partes[0])] = (partes[1], partes[2])
faltan = [i for i in range(len(lista)) if i not in tr]
print("faltan", len(faltan), faltan[:10])
problemas = []
dicc = {}
for i, es in enumerate(lista):
    if i not in tr: continue
    en, fr = tr[i]
    for nombre, t in (("en", en), ("fr", fr)):
        if t.count("{n}") != es.count("{n}"): problemas.append((i, nombre, es, t))
    if en == es and fr == es: continue          # igual en los tres idiomas: no hace falta
    dicc[es] = [en, fr]
num = lambda t: re.sub(r'\d+(?:[.,]\d+)?', '{n}', t)
for f in sorted(glob.glob("i18n/extra_*.tsv")):
    for linea in open(f, encoding="utf-8"):
        linea = linea.rstrip("\n")
        if not linea: continue
        es, en, fr = linea.split("\t")
        es, en, fr = num(es.strip()), num(en.strip()), num(fr.strip())
        for nombre, t in (("en", en), ("fr", fr)):
            if t.count("{n}") != es.count("{n}"): problemas.append((f, nombre, es, t))
        dicc[es] = [en, fr]
for p in problemas: print("NÚMEROS DISTINTOS", p)
cab = "// =====================================================\n// APIX GYM · TRADUCCIONES (generado automáticamente desde i18n/tr_*.tsv)\n// Clave = texto en español ({n} = un número). Valor = [inglés, francés].\n// =====================================================\n"
open("apex/idiomas.js", "w", encoding="utf-8").write(cab + "const TRADUCCIONES = " + json.dumps(dicc, ensure_ascii=False, indent=0) + ";\n")
print("entradas", len(dicc))
