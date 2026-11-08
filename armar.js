#!/usr/bin/env node
// Copia dedupe.js adentro de index.html para que la página funcione sola,
// sin depender de archivos al lado. Correr cada vez que cambie dedupe.js.
const fs = require("fs");
const path = require("path");

const html = path.join(__dirname, "index.html");
const logica = fs.readFileSync(path.join(__dirname, "dedupe.js"), "utf8");
const actual = fs.readFileSync(html, "utf8");

const patron = /(<!-- DEDUPE:INICIO[^>]*-->)[\s\S]*?(<!-- DEDUPE:FIN -->)/;
if (!patron.test(actual)) {
  console.error("No encontré las marcas DEDUPE:INICIO / DEDUPE:FIN en index.html");
  process.exit(1);
}
fs.writeFileSync(html, actual.replace(patron, (_, a, b) => `${a}\n<script>\n${logica}</script>\n${b}`));
console.log("index.html actualizado con la lógica de dedupe.js");
