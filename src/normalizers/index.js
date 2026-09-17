import { normalizarPqrsd } from "./pqrsd.normalizer.js";

const NORMALIZADORES={PQRSD:normalizarPqrsd};

export const obtenerNormalizador=(proceso)=>NORMALIZADORES[String(proceso||"").toUpperCase()]||null;
