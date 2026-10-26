import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  CARGAS_LOCALES_ROOT,
  PROCESOS_CARGAS_LOCALES,
  PROCESSED_FILES_PATH,
  REGISTRO_CARGAS_CSV_PATH,
  REGISTRO_CARGAS_JSON_PATH,
  REGISTRO_CARGAS_PUBLICACION_DIR
} from "../config/cargas-locales.config.js";

export const COLUMNAS_REGISTRO_CARGAS = [
  "idCarga",
  "proceso",
  "archivoOriginal",
  "fechaArchivo",
  "fechaProcesamiento",
  "estado",
  "totalFilas",
  "cantidadErrores",
  "cantidadAdvertencias",
  "versionReglas",
  "procesado",
  "rutaValidacion",
  "rutaNormalizado",
  "rutaHistorico",
  "periodoReportado"
];

const ESTADOS = new Set([
  "VALIDADO",
  "OBSERVADO",
  "PENDIENTE_VALIDACION",
  "ERROR_PROCESAMIENTO"
]);

let colaEscritura = Promise.resolve();

function rutaPortable(ruta) {
  return ruta ? String(ruta).replace(/\\/g, "/") : null;
}

function rutaRelativa(base, ruta) {
  if (!ruta) return null;
  const absoluta = path.resolve(ruta);
  const relativa = path.relative(path.resolve(base), absoluta);
  return rutaPortable(relativa && !relativa.startsWith("..") ? relativa : absoluta);
}

function numeroONull(valor) {
  if (valor === "" || valor === undefined || valor === null) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function fechaONull(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

function normalizarEstado(valor) {
  const estado = String(valor || "").trim().toUpperCase();
  if (ESTADOS.has(estado)) return estado;
  if (estado === "ERROR") return "ERROR_PROCESAMIENTO";
  return "PENDIENTE_VALIDACION";
}

function normalizarFila(fila = {}) {
  return {
    idCarga: String(fila.idCarga || "").trim(),
    proceso: String(fila.proceso || "").trim(),
    archivoOriginal: String(fila.archivoOriginal || fila.archivo || fila.nombre || "").trim(),
    fechaArchivo: fechaONull(fila.fechaArchivo || fila.fechaProceso),
    fechaProcesamiento: fechaONull(fila.fechaProcesamiento || fila.registrado_en),
    estado: normalizarEstado(fila.estado),
    totalFilas: numeroONull(fila.totalFilas ?? fila.total_registros),
    cantidadErrores: numeroONull(fila.cantidadErrores ?? fila.totalErrores ?? fila.total_errores),
    cantidadAdvertencias: numeroONull(
      fila.cantidadAdvertencias ?? fila.totalAdvertencias ?? fila.total_advertencias
    ),
    versionReglas: fila.versionReglas == null ? null : String(fila.versionReglas),
    procesado: fila.procesado === false || fila.procesado === "false" ? false : true,
    rutaValidacion: rutaPortable(fila.rutaValidacion || fila.salidas?.validacion),
    rutaNormalizado: rutaPortable(fila.rutaNormalizado || fila.salidas?.normalizado),
    rutaHistorico: rutaPortable(fila.rutaHistorico),
    periodoReportado: fila.periodoReportado == null && fila.periodo == null
      ? null
      : String(fila.periodoReportado ?? fila.periodo)
  };
}

function ordenarFilas(filas) {
  return [...filas].sort((a, b) =>
    String(b.fechaProcesamiento || "").localeCompare(String(a.fechaProcesamiento || "")) ||
    a.idCarga.localeCompare(b.idCarga, "es")
  );
}

function escaparCsv(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = typeof valor === "boolean" ? String(valor).toLowerCase() : String(valor);
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function convertirRegistroACsv(filas) {
  const lineas = [COLUMNAS_REGISTRO_CARGAS.join(",")];
  for (const fila of filas) {
    lineas.push(COLUMNAS_REGISTRO_CARGAS.map(columna => escaparCsv(fila[columna])).join(","));
  }
  return `\uFEFF${lineas.join("\r\n")}\r\n`;
}

async function leerJsonOpcional(ruta) {
  try {
    return JSON.parse(await fs.readFile(ruta, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function existeArchivo(ruta) {
  if (!ruta) return false;
  try {
    return (await fs.stat(ruta)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function escribirAtomico(ruta, contenido) {
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  const temporal = `${ruta}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporal, contenido, { encoding: "utf8", flag: "wx" });
  try {
    await fs.rename(temporal, ruta);
  } catch (error) {
    await fs.rm(temporal, { force: true });
    throw error;
  }
}

function resolverDirectorioPublicacion(rutaCsv, directorioPublicacion) {
  if (directorioPublicacion) return path.resolve(directorioPublicacion);
  return path.resolve(rutaCsv) === path.resolve(REGISTRO_CARGAS_CSV_PATH)
    ? REGISTRO_CARGAS_PUBLICACION_DIR
    : path.join(path.dirname(path.resolve(rutaCsv)), "CONTROL");
}

async function publicarRegistro({ rutaCsv, rutaJson, directorioPublicacion }) {
  const destino = resolverDirectorioPublicacion(rutaCsv, directorioPublicacion);
  const [csv, json] = await Promise.all([
    fs.readFile(rutaCsv),
    fs.readFile(rutaJson)
  ]);
  await fs.mkdir(destino, { recursive: true });
  await escribirAtomico(path.join(destino, "registro-cargas.csv"), csv);
  await escribirAtomico(path.join(destino, "registro-cargas.json"), json);
  return destino;
}

async function guardarRegistro(filas, { rutaCsv, rutaJson, directorioPublicacion }) {
  const normalizadas = ordenarFilas(filas.map(normalizarFila).filter(fila => fila.idCarga));
  await escribirAtomico(rutaJson, `${JSON.stringify(normalizadas, null, 2)}\n`);
  await escribirAtomico(rutaCsv, convertirRegistroACsv(normalizadas));
  await publicarRegistro({ rutaCsv, rutaJson, directorioPublicacion });
  return normalizadas;
}

function encolarEscritura(operacion) {
  const actual = colaEscritura.then(operacion, operacion);
  colaEscritura = actual.catch(() => {});
  return actual;
}

export async function obtenerRegistroCargas({
  rutaJson = REGISTRO_CARGAS_JSON_PATH
} = {}) {
  const contenido = await leerJsonOpcional(path.resolve(rutaJson));
  const filas = Array.isArray(contenido) ? contenido : contenido?.cargas;
  return ordenarFilas((Array.isArray(filas) ? filas : []).map(normalizarFila).filter(fila => fila.idCarga));
}

export async function actualizarRegistroCarga(fila, {
  rutaCsv = REGISTRO_CARGAS_CSV_PATH,
  rutaJson = REGISTRO_CARGAS_JSON_PATH,
  directorioPublicacion
} = {}) {
  const nueva = normalizarFila(fila);
  if (!nueva.idCarga) throw new Error("El registro consolidado requiere idCarga.");
  return encolarEscritura(async () => {
    const existentes = await obtenerRegistroCargas({ rutaJson });
    const indice = existentes.findIndex(item => item.idCarga === nueva.idCarga);
    if (indice >= 0) existentes[indice] = { ...existentes[indice], ...nueva };
    else existentes.push(nueva);
    return guardarRegistro(existentes, {
      rutaCsv: path.resolve(rutaCsv),
      rutaJson: path.resolve(rutaJson),
      directorioPublicacion
    });
  });
}

async function listarJson(directorio, sufijo) {
  try {
    const entradas = await fs.readdir(directorio, { withFileTypes: true });
    return entradas
      .filter(entrada => entrada.isFile() && entrada.name.endsWith(sufijo))
      .map(entrada => path.join(directorio, entrada.name));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function procesoDesdeRegistro(registro, procesos) {
  const ruta = rutaPortable(registro.ruta || "").toUpperCase();
  const id = String(registro.idCarga || "").toUpperCase();
  return procesos.find(item =>
    ruta.includes(`/${item.folderName.toUpperCase()}/`) ||
    id.startsWith(`${item.internalProcessName.toUpperCase()}-`)
  );
}

async function filaDesdeHistorico({ historico, rutaHistorico, rutaValidacion, raiz }) {
  const validacion = await leerJsonOpcional(rutaValidacion);
  return normalizarFila({
    ...historico,
    archivoOriginal: historico.archivoOriginal || historico.archivo,
    totalFilas: historico.totalFilas ?? historico.total_registros ?? validacion?.totalFilas ?? validacion?.total_registros,
    cantidadErrores: historico.totalErrores ?? historico.total_errores ?? validacion?.errores?.length,
    cantidadAdvertencias:
      historico.totalAdvertencias ?? historico.total_advertencias ?? validacion?.advertencias?.length,
    versionReglas: historico.versionReglas ?? validacion?.versionReglas,
    fechaArchivo: historico.fechaArchivo || historico.fechaProceso,
    fechaProcesamiento: historico.fechaProcesamiento || historico.registrado_en,
    rutaValidacion: historico.salidas?.validacion || (validacion ? rutaRelativa(raiz, rutaValidacion) : null),
    rutaNormalizado: historico.salidas?.normalizado,
    rutaHistorico: rutaRelativa(raiz, rutaHistorico),
    periodoReportado: historico.periodoReportado,
    procesado: true
  });
}

export async function reconstruirRegistroCargas({
  raiz = CARGAS_LOCALES_ROOT,
  rutaProcesados = PROCESSED_FILES_PATH,
  procesos = PROCESOS_CARGAS_LOCALES,
  rutaCsv = REGISTRO_CARGAS_CSV_PATH,
  rutaJson = REGISTRO_CARGAS_JSON_PATH,
  directorioPublicacion
} = {}) {
  const raizAbsoluta = path.resolve(raiz);
  const porId = new Map();

  for (const proceso of procesos) {
    const base = path.join(raizAbsoluta, proceso.folderName);
    const historicos = await listarJson(path.join(base, "04_HISTORICO"), "-historico.json");
    for (const rutaHistorico of historicos) {
      const historico = await leerJsonOpcional(rutaHistorico);
      if (!historico?.idCarga) continue;
      const rutaValidacion = path.join(base, "03_VALIDACION", `${historico.idCarga}-validacion.json`);
      const fila = await filaDesdeHistorico({ historico, rutaHistorico, rutaValidacion, raiz: raizAbsoluta });
      fila.proceso = proceso.folderName;
      if (fila.idCarga) porId.set(fila.idCarga, fila);
    }
  }

  const control = await leerJsonOpcional(path.resolve(rutaProcesados));
  for (const procesado of Array.isArray(control?.archivos) ? control.archivos : []) {
    if (!procesado.idCarga) continue;
    const configuracion = procesoDesdeRegistro(procesado, procesos);
    const existente = porId.get(procesado.idCarga);
    if (existente) {
      porId.set(procesado.idCarga, normalizarFila({
        ...existente,
        fechaProcesamiento: existente.fechaProcesamiento || procesado.fechaProcesamiento,
        estado: existente.estado || procesado.estado,
        procesado: true
      }));
      continue;
    }

    const base = configuracion ? path.join(raizAbsoluta, configuracion.folderName) : null;
    const rutaValidacion = base
      ? path.join(base, "03_VALIDACION", `${procesado.idCarga}-validacion.json`)
      : null;
    const validacion = rutaValidacion ? await leerJsonOpcional(rutaValidacion) : null;
    const rutaNormalizado = base
      ? path.join(base, "02_NORMALIZADO", `${procesado.idCarga}-normalizado.xlsx`)
      : null;
    porId.set(procesado.idCarga, normalizarFila({
      idCarga: procesado.idCarga,
      proceso: configuracion?.folderName || "",
      archivoOriginal: procesado.nombre || (procesado.ruta ? path.basename(procesado.ruta) : ""),
      fechaArchivo: procesado.mtimeMs,
      fechaProcesamiento: procesado.fechaProcesamiento,
      estado: procesado.estado,
      totalFilas: validacion?.totalFilas,
      cantidadErrores: validacion?.errores?.length,
      cantidadAdvertencias: validacion?.advertencias?.length,
      versionReglas: validacion?.versionReglas,
      procesado: true,
      rutaValidacion: validacion ? rutaRelativa(raizAbsoluta, rutaValidacion) : null,
      rutaNormalizado: await existeArchivo(rutaNormalizado) ? rutaRelativa(raizAbsoluta, rutaNormalizado) : null,
      rutaHistorico: null,
      periodoReportado: procesado.periodoReportado ?? null
    }));
  }

  return encolarEscritura(() => guardarRegistro([...porId.values()], {
    rutaCsv: path.resolve(rutaCsv),
    rutaJson: path.resolve(rutaJson),
    directorioPublicacion
  }));
}

export function resumirRegistroCargas(cargas) {
  const resumen = {
    totalCargas: cargas.length,
    validadas: 0,
    observadas: 0,
    pendientes: 0,
    errores: 0
  };
  for (const carga of cargas) {
    if (carga.estado === "VALIDADO") resumen.validadas += 1;
    else if (carga.estado === "OBSERVADO") resumen.observadas += 1;
    else if (carga.estado === "PENDIENTE_VALIDACION") resumen.pendientes += 1;
    else if (carga.estado === "ERROR_PROCESAMIENTO") resumen.errores += 1;
  }
  return resumen;
}
