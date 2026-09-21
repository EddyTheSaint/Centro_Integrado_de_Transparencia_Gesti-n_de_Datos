import pqrsd from "./pqrsd.validator.js";
import contratacion from "./contratacion.validator.js";
import buenComienzo from "./buenComienzo.validator.js";
import habitantesCalle from "./habitantesCalle.validator.js";
import envejecimientoVejez from "./envejecimientoVejez.validator.js";
import encuentrosCiudad from "./encuentrosCiudad.validator.js";
const VALIDADORES={PQRSD:pqrsd,CONTRATACION:contratacion,BUEN_COMIENZO:buenComienzo,HABITANTES_CALLE:habitantesCalle,ENVEJECIMIENTO_Y_VEJEZ:envejecimientoVejez,ENCUENTROS_DE_CIUDAD:encuentrosCiudad};
export const obtenerValidador=(p)=>VALIDADORES[String(p||"").toUpperCase()]||null;
