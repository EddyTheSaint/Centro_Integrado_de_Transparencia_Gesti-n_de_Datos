import pqrsd from "./pqrsd.validator.js";
import contratacion from "./contratacion.validator.js";
import buenComienzo from "./buenComienzo.validator.js";
import habitantesCalle from "./habitantesCalle.validator.js";
const VALIDADORES={PQRSD:pqrsd,CONTRATACION:contratacion,BUEN_COMIENZO:buenComienzo,HABITANTES_CALLE:habitantesCalle};
export const obtenerValidador=(p)=>VALIDADORES[String(p||"").toUpperCase()]||null;
