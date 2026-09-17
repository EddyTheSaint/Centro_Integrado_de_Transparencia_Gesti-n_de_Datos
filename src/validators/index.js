import pqrsd from "./pqrsd.validator.js";
import contratacion from "./contratacion.validator.js";
const VALIDADORES={PQRSD:pqrsd,CONTRATACION:contratacion};
export const obtenerValidador=(p)=>VALIDADORES[String(p||"").toUpperCase()]||null;
