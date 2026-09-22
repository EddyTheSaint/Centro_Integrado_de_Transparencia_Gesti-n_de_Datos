import XLSX from "xlsx";

function normalizarEncabezado(header) {
  return String(header ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function leerFilasYHeaders(sheet) {
  const filas = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  const matriz = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, raw: false });
  const headers = (matriz[0] || []).map(v => String(v ?? "").trim()).filter(Boolean);
  return { filas, headers };
}

function recortarClavesFilas(filas) {
  return filas.map(fila =>
    Object.fromEntries(Object.entries(fila).map(([clave, valor]) => [String(clave).trim(), valor]))
  );
}

export function leerPrimerHoja(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const hojaNombre = workbook.SheetNames[0];
  if (!hojaNombre) throw new Error("El archivo no contiene hojas.");
  const sheet = workbook.Sheets[hojaNombre];
  const { filas, headers } = leerFilasYHeaders(sheet);
  return { hojaNombre, headers, filas };
}

export function leerTodasLasHojas(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const hojas = [];
  for (const hojaNombre of workbook.SheetNames) {
    const sheet = workbook.Sheets[hojaNombre];
    const { filas, headers } = leerFilasYHeaders(sheet);
    hojas.push({ hojaNombre, headers, filas });
  }
  return hojas;
}

export function leerHoja(buffer, nombreHoja) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[nombreHoja];
  if (!sheet) throw new Error(`Hoja "${nombreHoja}" no encontrada.`);
  const { filas, headers } = leerFilasYHeaders(sheet);
  return { hojaNombre: nombreHoja, headers, filas };
}

export function detectarHojaBuenComienzo(buffer) {
  const hojas = leerTodasLasHojas(buffer);
  const patronesBeneficiarios = ["AÑO", "ID_COMUNA_SEDE", "NOMBRE COMUNA", "NOMBRE_MODALIDAD", "NIÑA", "NIÑO", "TOTAL"];
  const patronesPresupuesto = ["PROYECTO", "VALOR", "EJECUTADO"];

  let hojaBeneficiarios = null;
  let hojaPresupuesto = null;

  for (const hoja of hojas) {
    const headersNorm = hoja.headers.map(normalizarEncabezado);
    const contBenef = patronesBeneficiarios.filter(p => headersNorm.includes(normalizarEncabezado(p))).length;
    const contPresup = patronesPresupuesto.filter(p => headersNorm.includes(normalizarEncabezado(p))).length;

    if (contBenef >= 5 && !hojaBeneficiarios) {
      hojaBeneficiarios = {
        nombre: hoja.hojaNombre,
        headers: hoja.headers,
        filas: recortarClavesFilas(hoja.filas),
        totalFilas: hoja.filas.length
      };
    }

    if (contPresup >= 2 && !hojaPresupuesto) {
      hojaPresupuesto = {
        nombre: hoja.hojaNombre,
        headers: hoja.headers,
        filas: recortarClavesFilas(hoja.filas),
        totalFilas: hoja.filas.length
      };
    }
  }

  return { hojaBeneficiarios, hojaPresupuesto };
}

export function crearExcelBuffer(filas, hojaNombre = "Datos") {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(filas);
  XLSX.utils.book_append_sheet(workbook, sheet, hojaNombre);
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function crearExcelMultiHojaBuffer(hojas) {
  const workbook = XLSX.utils.book_new();
  for (const hoja of hojas) {
    const sheet = XLSX.utils.json_to_sheet(hoja.filas || []);
    XLSX.utils.book_append_sheet(workbook, sheet, hoja.nombre);
  }
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}
