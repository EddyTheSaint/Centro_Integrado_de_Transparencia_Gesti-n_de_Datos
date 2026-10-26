import {
  listarArchivosLocales,
  procesarArchivoLocal,
  resolverResultadoCarga
} from "../services/cargas-locales.service.js";
import {
  obtenerRegistroCargas,
  resumirRegistroCargas
} from "../services/registro-cargas.service.js";

function urlsResultados(proceso, archivo) {
  if (!archivo?.idCarga) return {};
  const base = `/api/cargas-locales/${encodeURIComponent(proceso)}/resultados/${encodeURIComponent(archivo.idCarga)}`;
  return Object.fromEntries(
    Object.entries(archivo.salidas || {})
      .filter(([, existe]) => existe)
      .map(([tipo]) => [tipo, `${base}/${tipo}`])
  );
}

function presentarArchivo(proceso, archivo) {
  return { ...archivo, urls: urlsResultados(proceso, archivo) };
}

function responderError(res, error) {
  const noEncontrado = error.code === "ENOENT" || error.message.includes("no existe");
  return res.status(noEncontrado ? 404 : 400).json({ ok: false, mensaje: error.message });
}

export async function listarArchivos(req, res) {
  try {
    const resultado = await listarArchivosLocales({ proceso: req.params.proceso });
    return res.json({
      ok: true,
      proceso: resultado.proceso,
      archivos: resultado.archivos.map(archivo => presentarArchivo(resultado.proceso.folderName, archivo))
    });
  } catch (error) {
    return responderError(res, error);
  }
}

export async function procesarArchivo(req, res) {
  try {
    const { archivo, force = false } = req.body || {};
    if (typeof archivo !== "string" || !archivo.trim()) {
      return res.status(400).json({ ok: false, mensaje: "Seleccione un archivo de 01_RAW." });
    }
    if (typeof force !== "boolean") {
      return res.status(400).json({ ok: false, mensaje: "El campo force debe ser booleano." });
    }

    const ejecucion = await procesarArchivoLocal({
      proceso: req.params.proceso,
      archivo,
      force
    });
    const { rutaNormalizado, rutaReporte, rutaHistorico, ...resultadoPublico } = ejecucion.resultado || {};
    return res.json({
      ok: true,
      procesado: ejecucion.procesado,
      omitido: ejecucion.omitido,
      archivo: presentarArchivo(req.params.proceso, ejecucion.archivo),
      resultado: ejecucion.resultado ? resultadoPublico : null
    });
  } catch (error) {
    return responderError(res, error);
  }
}

export async function descargarResultado(req, res) {
  try {
    const ruta = await resolverResultadoCarga({
      proceso: req.params.proceso,
      idCarga: req.params.idCarga,
      tipo: req.params.tipo
    });
    return res.sendFile(ruta);
  } catch (error) {
    return responderError(res, error);
  }
}

export async function obtenerRegistro(_req, res) {
  try {
    const cargas = await obtenerRegistroCargas();
    return res.json({
      ok: true,
      resumen: resumirRegistroCargas(cargas),
      cargas
    });
  } catch (error) {
    return responderError(res, error);
  }
}
