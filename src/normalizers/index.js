import { normalizarPqrsd } from "./pqrsd.normalizer.js";
import { normalizarBuenComienzo } from "./buenComienzo.normalizer.js";
import { normalizarContratacion } from "./contratacion.normalizer.js";
import { normalizarHabitantesCalle } from "./habitantesCalle.normalizer.js";

const NORMALIZADORES = {
  PQRSD: normalizarPqrsd,
  BUEN_COMIENZO: normalizarBuenComienzo,
  CONTRATACION: normalizarContratacion,
  HABITANTES_CALLE: normalizarHabitantesCalle
};

export const obtenerNormalizador = (proceso) => NORMALIZADORES[String(proceso || "").toUpperCase()] || null;
