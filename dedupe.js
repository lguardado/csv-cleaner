// Lógica compartida: la usan duplicados.js (terminal) e index.html (navegador).
(function (raiz) {
  function parseCSV(texto) {
    const filas = [];
    let fila = [], campo = "", comillas = false;
    texto = texto.replace(/^﻿/, ""); // BOM de Excel
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"' && texto[i + 1] === '"') { campo += '"'; i++; }
        else if (c === '"') comillas = false;
        else campo += c;
      } else if (c === '"') comillas = true;
      else if (c === ",") { fila.push(campo); campo = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(campo); filas.push(fila); fila = []; campo = "";
      } else campo += c;
    }
    if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
    return filas.filter((f) => f.some((v) => v.trim() !== ""));
  }

  const aCSV = (filas) =>
    filas
      .map((f) => f.map((v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(","))
      .join("\n") + "\n";

  const normalizar = (sku) => (sku || "").trim().toUpperCase();

  // Devuelve todo lo necesario para mostrar el resultado.
  function analizar(texto, nombreColumna = "sku") {
    const [encabezado = [], ...filas] = parseCSV(texto);
    const nombre = nombreColumna.toLowerCase();
    const col = encabezado.findIndex((h) => h.trim().toLowerCase() === nombre);
    if (col < 0) {
      throw new Error(`No encontré la columna "${nombreColumna}". Columnas: ${encabezado.join(", ")}`);
    }

    const grupos = new Map();
    const sinSku = [];
    const unicas = [];
    filas.forEach((fila, i) => {
      const linea = i + 2; // +1 encabezado, +1 porque las líneas arrancan en 1
      const sku = normalizar(fila[col]);
      if (!sku) { sinSku.push(linea); unicas.push(fila); return; }
      if (!grupos.has(sku)) { grupos.set(sku, []); unicas.push(fila); }
      grupos.get(sku).push({ linea, fila });
    });

    const duplicados = [...grupos]
      .filter(([, v]) => v.length > 1)
      .map(([sku, apariciones]) => ({ sku, apariciones }));

    return { encabezado, col, filas, unicas, duplicados, sinSku };
  }

  const api = { parseCSV, aCSV, normalizar, analizar };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.Dedupe = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
