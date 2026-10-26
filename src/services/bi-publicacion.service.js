import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { BI_PUBLICACION_DIR, CARGAS_LOCALES_ROOT, REGISTRO_CARGAS_JSON_PATH, PROCESOS_CARGAS_LOCALES } from "../config/cargas-locales.config.js";
import { crearExcelBuffer, leerPrimerHoja } from "./excel.service.js";

export const PUBLICACIONES_BI = Object.freeze({ PQRSD: "PQRSD_actual.xlsx", HABITANTE_DE_CALLE: "HABITANTE_DE_CALLE_actual.xlsx" });

function configuracionPublicable(procesos, proceso) {
  const nombre = String(proceso || "").trim().toUpperCase();
  return procesos.find(item => PUBLICACIONES_BI[item.folderName] && (item.folderName.toUpperCase() === nombre || item.internalProcessName.toUpperCase() === nombre)) || null;
}

function resolverDirectorioBi(raiz, directorioBi) {
  if (directorioBi) return path.resolve(directorioBi);
  return path.resolve(raiz) === path.resolve(CARGAS_LOCALES_ROOT) ? BI_PUBLICACION_DIR : path.join(path.resolve(raiz), "CARGAS_OBSERVATORIOS", "CONTROL", "BI");
}

async function existeArchivo(ruta) {
  try { return (await fs.stat(ruta)).isFile(); }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}

async function leerJson(ruta) {
  try { return JSON.parse(await fs.readFile(ruta, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function reemplazarDesdeArchivo({ origen, destino }) {
  await fs.mkdir(path.dirname(destino), { recursive: true });
  const temporal = path.join(path.dirname(destino), `.${path.basename(destino)}.${process.pid}.${randomUUID()}.tmp`);
  try { await fs.copyFile(origen, temporal, fs.constants.COPYFILE_EXCL); await fs.rename(temporal, destino); }
  catch (error) { await fs.rm(temporal, { force: true }).catch(() => {}); throw error; }
}

export async function publicarNormalizadoBi({ proceso, estado, rutaNormalizado, raiz = CARGAS_LOCALES_ROOT, directorioBi, procesos = PROCESOS_CARGAS_LOCALES } = {}) {
  const configuracion = configuracionPublicable(procesos, proceso);
  if (!configuracion || estado !== "VALIDADO" || !rutaNormalizado) return { publicado: false, motivo: "NO_PUBLICABLE" };
  const origen = path.resolve(rutaNormalizado);
  if (!(await existeArchivo(origen))) throw new Error(`No existe el normalizado para publicar: ${origen}`);
  const destino = path.join(resolverDirectorioBi(raiz, directorioBi), PUBLICACIONES_BI[configuracion.folderName]);
  await reemplazarDesdeArchivo({ origen, destino });
  return { publicado: true, proceso: configuracion.folderName, origen, destino };
}

async function buscarCargaValidadaMasReciente({ raiz, configuracion }) {
  const base = path.join(path.resolve(raiz), configuracion.folderName);
  const directorioHistorico = path.join(base, "04_HISTORICO");
  let entradas;
  try { entradas = await fs.readdir(directorioHistorico, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
  const candidatas = [];
  for (const entrada of entradas) {
    if (!entrada.isFile() || !entrada.name.endsWith("-historico.json")) continue;
    const historico = await leerJson(path.join(directorioHistorico, entrada.name));
    const idCarga = String(historico?.idCarga || "");
    if (!idCarga || path.basename(idCarga) !== idCarga || !/^[A-Za-z0-9_.-]+$/.test(idCarga)) continue;
    const validacion = await leerJson(path.join(base, "03_VALIDACION", `${idCarga}-validacion.json`));
    if (historico?.estado !== "VALIDADO" || validacion?.estado !== "VALIDADO") continue;
    const rutaNormalizado = path.join(base, "02_NORMALIZADO", `${idCarga}-normalizado.xlsx`);
    if (!(await existeArchivo(rutaNormalizado))) continue;
    candidatas.push({ idCarga, proceso: configuracion.folderName, fechaProcesamiento: historico.fechaProcesamiento || validacion.fechaProcesamiento || "", totalFilas: validacion.totalFilas ?? historico.totalFilas ?? null, rutaNormalizado });
  }
  candidatas.sort((a, b) => String(b.fechaProcesamiento).localeCompare(String(a.fechaProcesamiento)) || b.idCarga.localeCompare(a.idCarga, "es"));
  return candidatas[0] || null;
}

function resolverRutaNormalizado({ raiz, base, idCarga, rutaNormalizado }) {
  if (rutaNormalizado) return path.isAbsolute(String(rutaNormalizado)) ? path.resolve(String(rutaNormalizado)) : path.resolve(raiz, String(rutaNormalizado));
  return path.join(base, "02_NORMALIZADO", `${idCarga}-normalizado.xlsx`);
}

async function cargarRegistroBi(rutaRegistro = REGISTRO_CARGAS_JSON_PATH) {
  const contenido = await leerJson(path.resolve(rutaRegistro));
  const filas = Array.isArray(contenido) ? contenido : contenido?.cargas;
  return new Map((Array.isArray(filas) ? filas : []).filter(fila => fila?.idCarga).map(fila => [String(fila.idCarga), fila]));
}

async function listarCargasOficiales({ raiz, configuracion, registro }) {
  const base = path.join(path.resolve(raiz), configuracion.folderName);
  const porId = new Map();
  for (const fila of registro.values()) {
    const proceso = String(fila.proceso || "").toUpperCase();
    const corresponde = proceso === configuracion.folderName.toUpperCase() || proceso === configuracion.internalProcessName.toUpperCase();
    if (!corresponde || String(fila.estado || "").toUpperCase() !== "VALIDADO") continue;
    const idCarga = String(fila.idCarga || "");
    if (!idCarga || porId.has(idCarga)) continue;
    const rutaNormalizado = resolverRutaNormalizado({ raiz, base, idCarga, rutaNormalizado: fila.rutaNormalizado });
    if (!(await existeArchivo(rutaNormalizado))) continue;
    porId.set(idCarga, { idCarga, proceso: configuracion.folderName, periodoReportado: fila.periodoReportado ?? null, fechaProcesamiento: fila.fechaProcesamiento || "", rutaNormalizado });
  }
  return [...porId.values()].sort((a, b) => String(a.periodoReportado || "").localeCompare(String(b.periodoReportado || "")) || String(a.fechaProcesamiento).localeCompare(String(b.fechaProcesamiento)) || a.idCarga.localeCompare(b.idCarga, "es"));
}

async function leerFilasBi(carga) {
  const libro = leerPrimerHoja(await fs.readFile(carga.rutaNormalizado));
  return libro.filas.map(fila => ({ ...fila, idCarga: carga.idCarga, periodoReportado: carga.periodoReportado }));
}

export async function reconstruirBiHistorico({ raiz = CARGAS_LOCALES_ROOT, directorioBi, rutaRegistro = REGISTRO_CARGAS_JSON_PATH, procesos = PROCESOS_CARGAS_LOCALES, logger = console } = {}) {
  const registro = await cargarRegistroBi(rutaRegistro);
  const resultados = [];
  for (const proceso of Object.keys(PUBLICACIONES_BI)) {
    const configuracion = configuracionPublicable(procesos, proceso);
    if (!configuracion) { resultados.push({ proceso, publicado: false, cargasIncluidas: 0, totalFilas: 0, periodos: [], error: "Proceso no configurado." }); continue; }
    const cargas = await listarCargasOficiales({ raiz, configuracion, registro });
    if (!cargas.length) { resultados.push({ proceso, publicado: false, cargasIncluidas: 0, totalFilas: 0, periodos: [], error: "No hay cargas VALIDADO con normalizado en el registro oficial." }); continue; }
    const destino = path.join(resolverDirectorioBi(raiz, directorioBi), PUBLICACIONES_BI[configuracion.folderName].replace("_actual", "_BI"));
    try {
      const filas = [];
      const periodos = new Set();
      for (const carga of cargas) { filas.push(...await leerFilasBi(carga)); if (carga.periodoReportado) periodos.add(carga.periodoReportado); }
      const temporal = `${destino}.${process.pid}.${randomUUID()}.tmp`;
      await fs.mkdir(path.dirname(destino), { recursive: true });
      try { await fs.writeFile(temporal, crearExcelBuffer(filas, "Datos"), { flag: "wx" }); await fs.rename(temporal, destino); }
      catch (error) { await fs.rm(temporal, { force: true }).catch(() => {}); throw error; }
      resultados.push({ proceso, publicado: true, destino, cargasIncluidas: cargas.length, totalFilas: filas.length, periodos: [...periodos].sort(), idsCarga: cargas.map(carga => carga.idCarga) });
      logger.log(`[${proceso}] BI historico reconstruido: ${cargas.length} carga(s), ${filas.length} fila(s): ${destino}`);
    } catch (error) {
      resultados.push({ proceso, publicado: false, cargasIncluidas: 0, totalFilas: 0, periodos: [], error: error.message });
      logger.error(`[${proceso}] No se pudo reconstruir BI historico: ${error.message}`);
    }
  }
  return resultados;
}

export async function reconstruirBi({ raiz = CARGAS_LOCALES_ROOT, directorioBi, procesos = PROCESOS_CARGAS_LOCALES, logger = console } = {}) {
  const resultados = [];
  for (const proceso of Object.keys(PUBLICACIONES_BI)) {
    const configuracion = configuracionPublicable(procesos, proceso);
    if (!configuracion) { resultados.push({ proceso, publicado: false, error: "Proceso no configurado." }); continue; }
    const carga = await buscarCargaValidadaMasReciente({ raiz, configuracion });
    if (!carga) { resultados.push({ proceso, publicado: false, error: "No hay una carga VALIDADA con normalizado." }); continue; }
    try {
      const publicacion = await publicarNormalizadoBi({ proceso, estado: "VALIDADO", rutaNormalizado: carga.rutaNormalizado, raiz, directorioBi, procesos });
      resultados.push({ ...carga, ...publicacion });
      logger.log(`[${proceso}] BI reconstruido desde ${carga.idCarga}: ${publicacion.destino}`);
    } catch (error) { resultados.push({ ...carga, publicado: false, error: error.message }); logger.error(`[${proceso}] No se pudo reconstruir BI: ${error.message}`); }
  }
  return resultados;
}
