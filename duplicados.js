#!/usr/bin/env node
// Busca filas duplicadas por SKU en un CSV.
// Uso:  node duplicados.js archivo.csv [--columna sku] [--limpio salida.csv]
//   --columna  nombre de la columna a comparar (por defecto "sku", sin importar mayúsculas)
//   --limpio   además escribe un CSV sin duplicados (se queda con la primera aparición)

const fs = require("fs");
const { analizar, aCSV } = require("./dedupe");

const args = process.argv.slice(2);
const archivo = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!archivo) {
  console.log("Uso: node duplicados.js archivo.csv [--columna sku] [--limpio salida.csv]");
  process.exit(1);
}

let r;
try {
  r = analizar(fs.readFileSync(archivo, "utf8"), opt("--columna") || "sku");
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const sobrantes = r.filas.length - r.unicas.length;
if (!r.duplicados.length) console.log(`Sin duplicados. ${r.filas.length} filas, todas con SKU único.`);
else {
  console.log(`${r.duplicados.length} SKU repetidos (${sobrantes} filas de más) en ${r.filas.length} filas:\n`);
  for (const { sku, apariciones } of r.duplicados) {
    console.log(`${sku}  — aparece ${apariciones.length} veces`);
    for (const { linea, fila } of apariciones) console.log(`   línea ${linea}: ${fila.join(" | ")}`);
    console.log();
  }
}
if (r.sinSku.length) console.log(`Ojo: filas sin SKU en líneas ${r.sinSku.join(", ")}\n`);

const salida = opt("--limpio");
if (salida) {
  fs.writeFileSync(salida, aCSV([r.encabezado, ...r.unicas]));
  console.log(`Guardé ${salida} con ${r.unicas.length} filas (saqué ${sobrantes}).`);
}
