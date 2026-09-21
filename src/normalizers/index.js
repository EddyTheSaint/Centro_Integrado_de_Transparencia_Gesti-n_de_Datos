import { normalizarPqrsd } from "./pqrsd.normalizer.js";
import { normalizarBuenComienzo } from "./buenComienzo.normalizer.js";
import { normalizarContratacion } from "./contratacion.normalizer.js";
import { normalizarHabitantesCalle } from "./habitantesCalle.normalizer.js";
import { normalizarEnvejecimientoVejez } from "./envejecimientoVejez.normalizer.js";
import { normalizarEncuentrosCiudad } from "./encuentrosCiudad.normalizer.js";

const NORMALIZADORES = {
  PQRSD: normalizarPqrsd,
  BUEN_COMIENZO: normalizarBuenComienzo,
  CONTRATACION: normalizarContratacion,
  HABITANTES_CALLE: normalizarHabitantesCalle,
  ENVEJECIMIENTO_Y_VEJEZ: normalizarEnvejecimientoVejez,
  ENCUENTROS_DE_CIUDAD: normalizarEncuentrosCiudad
};

export const obtenerNormalizador = (proceso) => NORMALIZADORES[String(proceso || "").toUpperCase()] || null;
