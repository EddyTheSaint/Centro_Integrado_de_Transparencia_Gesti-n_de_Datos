import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  CARGAS_LOCALES_ROOT,
  PROCESOS_CARGAS_LOCALES,
  PROCESSED_FILES_PATH
} from "../config/cargas-locales.config.js";
import {
  crearExcelBuffer,
  crearExcelMultiHojaBuffer,
  leerPrimerHoja
} from "./excel.service.js";
import { crearDashboard } from "./dashboard.service.js";
import { crearDashboardBuenComienzo } from "./dashboard-buen-comienzo.service.js";
import { crearReporteValidacion } from "./reporte-validacion.service.js";
import { obtenerValidador } from "../validators/index.js";
import { obtenerNormalizador } from "../normalizers/index.js";
import { actualizarRegistroCarga } from "./registro-cargas.service.js";
import { publicarNormalizadoBi, reconstruirBiHistorico } from "./bi-publicacion.service.js";
import { extraerPeriodoDesdeNombreArchivo } from "../utils/periodo-reportado.js";

const DIRECTORIOS = {
  raw: "01_RAW",
  normalizado: "02_NORMALIZADO",
  validacion: "03_VALIDACION",
  historico: "04_HISTORICO"
};

function esExcel(nombre) {
  return [".xls", ".xlsx"].includes(path.extname(nombre).toLowerCase());
}

function nombreSeguro(valor) {
  return String(valor || "carga")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "carga";
}

function crearIdCarga(proceso) {
  const fecha = new Date().toISOString().replace(/[-:.TZ]/g, "");
  return `${nombreSeguro(proceso)}-${fecha}-${randomUUID().slice(0, 8)}`;
}

function rutaPortable(ruta) {
  return ruta.replace(/\\/g, "/");
}

function rutaRelativa(base, ruta) {
  return rutaPortable(path.relative(base, ruta));
}

function fingerprintCoincide(registro, ruta, stat) {
  const rutaNormalizada = path.resolve(ruta).toLowerCase();
  return registro.archivos.some(item =>
    item.ruta &&
    path.resolve(item.ruta).toLowerCase() === rutaNormalizada &&
    item.size === stat.size &&
    item.mtimeMs === stat.mtimeMs
  );
}

function obtenerConfiguracionProceso(procesos, proceso) {
  const normalizado = String(proceso || "").trim().toUpperCase();
  const configuracion = procesos.find(item =>
    item.folderName.toUpperCase() === normalizado ||
    item.internalProcessName.toUpperCase() === normalizado
  );
  if (!configuracion) throw new Error(`Proceso desconocido: ${proceso}`);
  return configuracion;
}

function validarNombreArchivo(nombre) {
  const valor = String(nombre || "");
  if (!valor || valor === "." || valor === ".." || path.basename(valor) !== valor || /[\\/]/.test(valor)) {
    throw new Error("Nombre de archivo no permitido.");
  }
  if (!esExcel(valor)) throw new Error("Solo se permiten archivos .xls o .xlsx.");
  return valor;
}

function resolverArchivoRaw(rutaRaw, nombre) {
  const nombreValidado = validarNombreArchivo(nombre);
  const raizRaw = path.resolve(rutaRaw);
  const archivoRuta = path.resolve(raizRaw, nombreValidado);
  if (path.dirname(archivoRuta).toLowerCase() !== raizRaw.toLowerCase()) {
    throw new Error("El archivo debe estar dentro de 01_RAW.");
  }
  return archivoRuta;
}

async function leerRegistro(rutaRegistro) {
  try {
    const contenido = JSON.parse(await fs.readFile(rutaRegistro, "utf8"));
    return {
      version: 1,
      archivos: Array.isArray(contenido.archivos) ? contenido.archivos : []
    };
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, archivos: [] };
    throw new Error(`No se pudo leer el control de procesados: ${error.message}`);
  }
}

async function escribirRegistroAtomico(rutaRegistro, registro) {
  await fs.mkdir(path.dirname(rutaRegistro), { recursive: true });
  const temporal = `${rutaRegistro}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(registro, null, 2), { encoding: "utf8", flag: "wx" });
  try {
    await fs.rename(temporal, rutaRegistro);
  } catch (error) {
    await fs.rm(temporal, { force: true });
    throw error;
  }
}

async function escribirJsonExclusivo(ruta, contenido) {
  await fs.writeFile(ruta, JSON.stringify(contenido, null, 2), { encoding: "utf8", flag: "wx" });
}

async function escribirBufferExclusivo(ruta, contenido) {
  await fs.writeFile(ruta, contenido, { flag: "wx" });
}

async function existeArchivo(ruta) {
  try {
    return (await fs.stat(ruta)).isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function leerJsonOpcional(ruta) {
  try {
    return JSON.parse(await fs.readFile(ruta, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function asegurarEstructura(baseProceso) {
  const rutas = Object.fromEntries(
    Object.entries(DIRECTORIOS).map(([clave, carpeta]) => [clave, path.join(baseProceso, carpeta)])
  );
  await Promise.all([
    fs.mkdir(rutas.normalizado, { recursive: true }),
    fs.mkdir(rutas.validacion, { recursive: true }),
    fs.mkdir(rutas.historico, { recursive: true })
  ]);
  return rutas;
}

function prepararBuenComienzo(validacion) {
  const beneficiarios = validacion.hojas?.beneficiarios;
  const presupuesto = validacion.hojas?.presupuesto;
  return {
    beneficiarios: beneficiarios ? {
      nombre: beneficiarios.nombre,
      headers: beneficiarios.headers,
      filas: beneficiarios.filas,
      campos: beneficiarios.campos,
      datosNormalizados: beneficiarios.filas
    } : null,
    presupuesto: presupuesto ? {
      nombre: presupuesto.nombre,
      headers: presupuesto.headers,
      filas: presupuesto.filas,
      campos: presupuesto.campos,
      datosNormalizados: presupuesto.filas
    } : null
  };
}

async function ejecutarValidacion({ archivoRuta, proceso, idCarga, rutas }) {
  const buffer = await fs.readFile(archivoRuta);
  const validador = obtenerValidador(proceso);
  if (!validador) throw new Error(`No existe validador registrado para ${proceso}.`);

  let excel;
  let hojas = null;
  let validacion;

  if (proceso === "BUEN_COMIENZO" && typeof validador.validarMultiHoja === "function") {
    validacion = validador.validarMultiHoja(buffer);
    validacion.errores = validacion.errores || [];
    validacion.advertencias = validacion.advertencias || [];
    hojas = prepararBuenComienzo(validacion);
    excel = {
      hojaNombre: [hojas.beneficiarios?.nombre, hojas.presupuesto?.nombre].filter(Boolean).join(" + "),
      filas: hojas.beneficiarios?.filas || []
    };
  } else {
    excel = leerPrimerHoja(buffer);
    validacion = validador.validar(excel);
    validacion.errores = validacion.errores || [];
    validacion.advertencias = validacion.advertencias || [];
  }

  const estado = validacion.errores.length ? "OBSERVADO" : "VALIDADO";
  let normalizacion = { datosNormalizados: [], reglasAplicadas: [] };
  let dashboard = null;
  let rutaNormalizado = null;

  if (estado === "VALIDADO") {
    const normalizador = obtenerNormalizador(proceso);
    if (normalizador) {
      if (proceso === "BUEN_COMIENZO" && hojas) {
        normalizacion = normalizador({ hojas });
        const hojasSalida = [];
        if (hojas.beneficiarios) {
          hojas.beneficiarios.datosNormalizados = normalizacion.hojas.beneficiarios;
          hojasSalida.push({
            nombre: hojas.beneficiarios.nombre || "Beneficiarios",
            filas: normalizacion.hojas.beneficiarios
          });
        }
        if (hojas.presupuesto) {
          hojas.presupuesto.datosNormalizados = normalizacion.hojas.presupuesto;
          hojasSalida.push({
            nombre: hojas.presupuesto.nombre || "Presupuesto",
            filas: normalizacion.hojas.presupuesto
          });
        }
        dashboard = crearDashboardBuenComienzo({ hojas, validacion });
        if (hojasSalida.length) {
          rutaNormalizado = path.join(rutas.normalizado, `${idCarga}-normalizado.xlsx`);
          await escribirBufferExclusivo(rutaNormalizado, crearExcelMultiHojaBuffer(hojasSalida));
        }
      } else {
        normalizacion = normalizador({ filas: excel.filas, campos: validacion.campos });
        dashboard = crearDashboard({
          proceso,
          filas: normalizacion.datosNormalizados,
          campos: validacion.campos,
          validacion
        });
        if (normalizacion.datosNormalizados?.length) {
          rutaNormalizado = path.join(rutas.normalizado, `${idCarga}-normalizado.xlsx`);
          await escribirBufferExclusivo(
            rutaNormalizado,
            crearExcelBuffer(normalizacion.datosNormalizados, "Normalizado")
          );
        }
      }
    }
  }

  const detalle = crearReporteValidacion({
    excel,
    validacion,
    reglasAplicadas: normalizacion.reglasAplicadas || [],
    dashboard
  });

  return {
    estado,
    totalFilas: excel.filas?.length || 0,
    errores: validacion.errores,
    advertencias: validacion.advertencias,
    versionReglas: validador.version || null,
    detalle,
    rutaNormalizado
  };
}

function crearReporteBase({ idCarga, proceso, archivoNombre, stat, fechaProcesamiento }) {
  return {
    idCarga,
    proceso,
    archivoOriginal: archivoNombre,
    periodoReportado: extraerPeriodoDesdeNombreArchivo(archivoNombre),
    fechaProceso: new Date(stat.mtimeMs).toISOString(),
    fechaProcesamiento,
    estado: "PENDIENTE_VALIDACION",
    totalFilas: 0,
    errores: [],
    advertencias: [],
    versionReglas: null,
    detalle: {}
  };
}

async function procesarArchivo({
  archivoRuta,
  archivoNombre,
  stat,
  configuracion,
  rutas,
  raiz,
  directorioBi,
  logger
}) {
  const proceso = configuracion.internalProcessName;
  const idCarga = crearIdCarga(proceso);
  const fechaProcesamiento = new Date().toISOString();
  const reporte = crearReporteBase({
    idCarga,
    proceso,
    archivoNombre,
    stat,
    fechaProcesamiento
  });
  let rutaNormalizado = null;

  logger.log(`[${configuracion.folderName}] Detectado: ${archivoNombre}`);

  try {
    if (!configuracion.automaticValidationEnabled) {
      logger.log(`[${configuracion.folderName}] PENDIENTE_VALIDACION`);
    } else {
      logger.log(`[${configuracion.folderName}] Validando...`);
      const resultadoValidacion = await ejecutarValidacion({ archivoRuta, proceso, idCarga, rutas });
      rutaNormalizado = resultadoValidacion.rutaNormalizado;
      delete resultadoValidacion.rutaNormalizado;
      Object.assign(reporte, resultadoValidacion);
      logger.log(`[${configuracion.folderName}] ${reporte.estado} - ${reporte.totalFilas} filas`);

      if (reporte.estado === "VALIDADO" && rutaNormalizado) {
        try {
          const publicacionBi = await publicarNormalizadoBi({
            proceso,
            estado: reporte.estado,
            rutaNormalizado,
            raiz,
            directorioBi
          });
          reporte.detalle.publicacionBi = publicacionBi;
          if (publicacionBi.publicado) {
            logger.log(`[${configuracion.folderName}] BI actualizado: ${publicacionBi.destino}`);
          }
        } catch (error) {
          reporte.detalle.publicacionBi = { publicado: false, error: error.message };
          logger.error(
            `[${configuracion.folderName}] No se pudo actualizar BI; se conserva la versión anterior: ${error.message}`
          );
        }
      }
    }
  } catch (error) {
    reporte.estado = "ERROR_PROCESAMIENTO";
    reporte.errores = [{ regla: "CARGA-LOCAL-ERROR", mensaje: error.message }];
    reporte.detalle = { error: { mensaje: error.message } };
    reporte.versionReglas = obtenerValidador(proceso)?.version || null;
    logger.error(`[${configuracion.folderName}] ERROR_PROCESAMIENTO - ${error.message}`);
  }

  const rutaReporte = path.join(rutas.validacion, `${idCarga}-validacion.json`);
  await escribirJsonExclusivo(rutaReporte, reporte);
  logger.log(`[${configuracion.folderName}] Reporte: ${rutaRelativa(path.dirname(rutas.raw), rutaReporte)}`);

  if (rutaNormalizado) {
    logger.log(`[${configuracion.folderName}] Normalizado: ${rutaRelativa(path.dirname(rutas.raw), rutaNormalizado)}`);
  }

  const historico = {
    idCarga,
    proceso,
    archivoOriginal: archivoNombre,
    periodoReportado: reporte.periodoReportado,
    rutaOriginal: rutaRelativa(raiz, archivoRuta),
    fechaProceso: reporte.fechaProceso,
    fechaProcesamiento,
    estado: reporte.estado,
    totalFilas: reporte.totalFilas,
    totalErrores: reporte.errores.length,
    totalAdvertencias: reporte.advertencias.length,
    versionReglas: reporte.versionReglas,
    salidas: {
      normalizado: rutaNormalizado ? rutaRelativa(raiz, rutaNormalizado) : null,
      validacion: rutaRelativa(raiz, rutaReporte)
    }
  };
  const rutaHistorico = path.join(rutas.historico, `${idCarga}-historico.json`);
  await escribirJsonExclusivo(rutaHistorico, historico);
  logger.log(`[${configuracion.folderName}] Histórico: ${rutaRelativa(path.dirname(rutas.raw), rutaHistorico)}`);

  return {
    idCarga,
    proceso,
    archivoOriginal: archivoNombre,
    periodoReportado: reporte.periodoReportado,
    fechaArchivo: reporte.fechaProceso,
    fechaProcesamiento,
    estado: reporte.estado,
    totalFilas: reporte.totalFilas,
    errores: reporte.errores,
    advertencias: reporte.advertencias,
    versionReglas: reporte.versionReglas,
    detalle: reporte.detalle,
    rutaNormalizado,
    rutaReporte,
    rutaHistorico
  };
}

async function registrarResultado({
  archivoRuta,
  archivoNombre,
  stat,
  configuracion,
  rutas,
  raiz,
  registro,
  rutaRegistro,
  rutaRegistroCargasCsv,
  rutaRegistroCargasJson,
  directorioBi,
  procesos,
  force,
  logger
}) {
  if (!force && fingerprintCoincide(registro, archivoRuta, stat)) {
    logger.log(`[${configuracion.folderName}] Omitido (ya procesado): ${archivoNombre}`);
    return { procesado: false, omitido: true, resultado: null };
  }

  let resultado;
  try {
    resultado = await procesarArchivo({
      archivoRuta,
      archivoNombre,
      stat,
      configuracion,
      rutas,
      raiz,
      directorioBi,
      logger
    });
  } catch (error) {
    logger.error(`[${configuracion.folderName}] No se pudieron guardar las salidas de ${archivoNombre}: ${error.message}`);
    resultado = {
      idCarga: crearIdCarga(configuracion.internalProcessName),
      proceso: configuracion.internalProcessName,
      archivoOriginal: archivoNombre,
      periodoReportado: extraerPeriodoDesdeNombreArchivo(archivoNombre),
      fechaArchivo: new Date(stat.mtimeMs).toISOString(),
      fechaProcesamiento: new Date().toISOString(),
      estado: "ERROR_PROCESAMIENTO",
      totalFilas: 0,
      errores: [{ regla: "CARGA-LOCAL-SALIDA", mensaje: error.message }],
      advertencias: [],
      versionReglas: obtenerValidador(configuracion.internalProcessName)?.version || null,
      detalle: { error: { mensaje: error.message } }
    };
  }
  registro.archivos.push({
    ruta: path.resolve(archivoRuta),
    nombre: archivoNombre,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    fechaProcesamiento: new Date().toISOString(),
    idCarga: resultado.idCarga,
    estado: resultado.estado,
    periodoReportado: resultado.periodoReportado
  });
  await escribirRegistroAtomico(path.resolve(rutaRegistro), registro);
  try {
    await actualizarRegistroCarga({
      idCarga: resultado.idCarga,
      proceso: configuracion.folderName,
      archivoOriginal: resultado.archivoOriginal || archivoNombre,
      fechaArchivo: resultado.fechaArchivo || new Date(stat.mtimeMs).toISOString(),
      fechaProcesamiento: resultado.fechaProcesamiento || registro.archivos.at(-1).fechaProcesamiento,
      estado: resultado.estado,
      totalFilas: resultado.totalFilas,
      cantidadErrores: resultado.errores?.length ?? 0,
      cantidadAdvertencias: resultado.advertencias?.length ?? 0,
      versionReglas: resultado.versionReglas,
      procesado: true,
      rutaValidacion: resultado.rutaReporte ? rutaRelativa(raiz, resultado.rutaReporte) : null,
      rutaNormalizado: resultado.rutaNormalizado ? rutaRelativa(raiz, resultado.rutaNormalizado) : null,
      rutaHistorico: resultado.rutaHistorico ? rutaRelativa(raiz, resultado.rutaHistorico) : null,
      periodoReportado: resultado.periodoReportado
    }, {
      rutaCsv: rutaRegistroCargasCsv || path.join(path.dirname(path.resolve(rutaRegistro)), "registro-cargas.csv"),
      rutaJson: rutaRegistroCargasJson || path.join(path.dirname(path.resolve(rutaRegistro)), "registro-cargas.json")
    });
  } catch (error) {
    logger.error(
      `[${configuracion.folderName}] Las salidas se conservaron, pero no se pudo actualizar registro-cargas.csv: ${error.message}`
    );
  }
  if (resultado.estado === "VALIDADO" && resultado.rutaNormalizado) {
    try {
      const reconstruccionBiHistorica = await reconstruirBiHistorico({
        raiz,
        directorioBi,
        rutaRegistro: rutaRegistroCargasJson || path.join(path.dirname(path.resolve(rutaRegistro)), "registro-cargas.json"),
        procesos,
        logger
      });
      resultado.detalle = { ...(resultado.detalle || {}), reconstruccionBiHistorica };
    } catch (error) {
      resultado.detalle = { ...(resultado.detalle || {}), reconstruccionBiHistorica: { publicado: false, error: error.message } };
      logger.error(`[${configuracion.folderName}] No se pudo actualizar BI historico; se conserva la version anterior: ${error.message}`);
    }
  }
  return { procesado: true, omitido: false, resultado };
}

async function describirArchivo({ archivoRuta, stat, registro, configuracion, rutas }) {
  const rutaNormalizada = path.resolve(archivoRuta).toLowerCase();
  const registroActual = [...registro.archivos].reverse().find(item =>
    item.ruta &&
    path.resolve(item.ruta).toLowerCase() === rutaNormalizada &&
    item.size === stat.size &&
    item.mtimeMs === stat.mtimeMs
  );

  if (!registroActual) {
    return {
      nombre: path.basename(archivoRuta),
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      fechaModificacion: new Date(stat.mtimeMs).toISOString(),
      procesado: false,
      estado: "SIN_PROCESAR",
      fechaProcesamiento: null,
      idCarga: null,
      totalFilas: null,
      totalErrores: null,
      totalAdvertencias: null,
      salidas: { validacion: false, normalizado: false, historico: false }
    };
  }

  const idCarga = registroActual.idCarga;
  const rutaValidacion = path.join(rutas.validacion, `${idCarga}-validacion.json`);
  const rutaNormalizado = path.join(rutas.normalizado, `${idCarga}-normalizado.xlsx`);
  const rutaHistorico = path.join(rutas.historico, `${idCarga}-historico.json`);
  const reporte = await leerJsonOpcional(rutaValidacion);

  return {
    nombre: path.basename(archivoRuta),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    fechaModificacion: new Date(stat.mtimeMs).toISOString(),
    procesado: true,
    estado: registroActual.estado,
    fechaProcesamiento: registroActual.fechaProcesamiento,
    idCarga,
    procesoInterno: configuracion.internalProcessName,
    totalFilas: reporte?.totalFilas ?? null,
    totalErrores: Array.isArray(reporte?.errores) ? reporte.errores.length : null,
    totalAdvertencias: Array.isArray(reporte?.advertencias) ? reporte.advertencias.length : null,
    salidas: {
      validacion: await existeArchivo(rutaValidacion),
      normalizado: await existeArchivo(rutaNormalizado),
      historico: await existeArchivo(rutaHistorico)
    }
  };
}

export async function listarArchivosLocales({
  proceso,
  raiz = CARGAS_LOCALES_ROOT,
  rutaRegistro = PROCESSED_FILES_PATH,
  procesos = PROCESOS_CARGAS_LOCALES
} = {}) {
  const configuracion = obtenerConfiguracionProceso(procesos, proceso);
  const raizAbsoluta = path.resolve(raiz);
  const rutas = await asegurarEstructura(path.join(raizAbsoluta, configuracion.folderName));
  const registro = await leerRegistro(path.resolve(rutaRegistro));
  let entradas;
  try {
    entradas = await fs.readdir(rutas.raw, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") entradas = [];
    else throw error;
  }

  const archivos = [];
  for (const entrada of entradas.filter(item => item.isFile() && esExcel(item.name))) {
    const archivoRuta = resolverArchivoRaw(rutas.raw, entrada.name);
    archivos.push(await describirArchivo({
      archivoRuta,
      stat: await fs.stat(archivoRuta),
      registro,
      configuracion,
      rutas
    }));
  }
  archivos.sort((a, b) => b.mtimeMs - a.mtimeMs || a.nombre.localeCompare(b.nombre, "es"));

  return {
    proceso: {
      folderName: configuracion.folderName,
      internalProcessName: configuracion.internalProcessName,
      automaticValidationEnabled: configuracion.automaticValidationEnabled
    },
    archivos
  };
}

export async function procesarArchivoLocal({
  proceso,
  archivo,
  force = false,
  raiz = CARGAS_LOCALES_ROOT,
  rutaRegistro = PROCESSED_FILES_PATH,
  rutaRegistroCargasCsv,
  rutaRegistroCargasJson,
  directorioBi,
  procesos = PROCESOS_CARGAS_LOCALES,
  logger = console
} = {}) {
  const configuracion = obtenerConfiguracionProceso(procesos, proceso);
  const raizAbsoluta = path.resolve(raiz);
  const rutas = await asegurarEstructura(path.join(raizAbsoluta, configuracion.folderName));
  const archivoRuta = resolverArchivoRaw(rutas.raw, archivo);
  const stat = await fs.stat(archivoRuta);
  if (!stat.isFile()) throw new Error("El archivo seleccionado no es un archivo regular.");
  const registro = await leerRegistro(path.resolve(rutaRegistro));
  const ejecucion = await registrarResultado({
    archivoRuta,
    archivoNombre: path.basename(archivoRuta),
    stat,
    configuracion,
    rutas,
    raiz: raizAbsoluta,
    registro,
    rutaRegistro,
    rutaRegistroCargasCsv,
    rutaRegistroCargasJson,
    directorioBi,
    procesos,
    force: Boolean(force),
    logger
  });
  const actualizado = await listarArchivosLocales({ proceso, raiz, rutaRegistro, procesos });
  const metadata = actualizado.archivos.find(item => item.nombre === path.basename(archivoRuta));
  return { ...ejecucion, archivo: metadata };
}

export async function resolverResultadoCarga({
  proceso,
  idCarga,
  tipo,
  raiz = CARGAS_LOCALES_ROOT,
  procesos = PROCESOS_CARGAS_LOCALES
} = {}) {
  const configuracion = obtenerConfiguracionProceso(procesos, proceso);
  const id = String(idCarga || "");
  if (!id || path.basename(id) !== id || !/^[A-Za-z0-9_.-]+$/.test(id)) {
    throw new Error("Identificador de carga no permitido.");
  }
  const tipos = {
    validacion: [DIRECTORIOS.validacion, `${id}-validacion.json`],
    normalizado: [DIRECTORIOS.normalizado, `${id}-normalizado.xlsx`],
    historico: [DIRECTORIOS.historico, `${id}-historico.json`]
  };
  if (!tipos[tipo]) throw new Error("Tipo de resultado no permitido.");
  const baseProceso = path.join(path.resolve(raiz), configuracion.folderName);
  const ruta = path.resolve(baseProceso, ...tipos[tipo]);
  const directorioPermitido = path.resolve(baseProceso, tipos[tipo][0]);
  if (path.dirname(ruta).toLowerCase() !== directorioPermitido.toLowerCase()) {
    throw new Error("Ruta de resultado no permitida.");
  }
  if (!(await existeArchivo(ruta))) throw new Error("El resultado solicitado no existe.");
  return ruta;
}

function filtrarProcesos(procesos, filtro) {
  if (!filtro) return procesos;
  const normalizado = String(filtro).trim().toUpperCase();
  const seleccionados = procesos.filter(item =>
    item.folderName.toUpperCase() === normalizado ||
    item.internalProcessName.toUpperCase() === normalizado
  );
  if (!seleccionados.length) throw new Error(`Proceso desconocido: ${filtro}`);
  return seleccionados;
}

export async function procesarCargasLocales({
  raiz = CARGAS_LOCALES_ROOT,
  rutaRegistro = PROCESSED_FILES_PATH,
  rutaRegistroCargasCsv,
  rutaRegistroCargasJson,
  directorioBi,
  procesos = PROCESOS_CARGAS_LOCALES,
  processFilter = null,
  force = false,
  logger = console
} = {}) {
  const raizAbsoluta = path.resolve(raiz);
  const registro = await leerRegistro(path.resolve(rutaRegistro));
  const seleccionados = filtrarProcesos(procesos, processFilter);
  const resumen = { detectados: 0, procesados: 0, omitidos: 0, estados: {}, resultados: [] };

  for (const configuracion of seleccionados) {
    const baseProceso = path.join(raizAbsoluta, configuracion.folderName);
    const rutas = await asegurarEstructura(baseProceso);
    let entradas;
    try {
      entradas = await fs.readdir(rutas.raw, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") {
        logger.error(`[${configuracion.folderName}] No existe ${DIRECTORIOS.raw}`);
        continue;
      }
      throw error;
    }

    const archivos = entradas
      .filter(entrada => entrada.isFile() && esExcel(entrada.name))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));

    for (const entrada of archivos) {
      const archivoRuta = path.join(rutas.raw, entrada.name);
      const stat = await fs.stat(archivoRuta);
      resumen.detectados += 1;

      const ejecucion = await registrarResultado({
        archivoRuta,
        archivoNombre: entrada.name,
        stat,
        configuracion,
        rutas,
        raiz: raizAbsoluta,
        registro,
        rutaRegistro,
        rutaRegistroCargasCsv,
        rutaRegistroCargasJson,
        directorioBi,
        procesos,
        force,
        logger
      });
      if (ejecucion.omitido) {
        resumen.omitidos += 1;
        continue;
      }
      const resultado = ejecucion.resultado;

      resumen.procesados += 1;
      resumen.estados[resultado.estado] = (resumen.estados[resultado.estado] || 0) + 1;
      resumen.resultados.push({ proceso: configuracion.folderName, archivo: entrada.name, ...resultado });
    }
  }

  return resumen;
}
