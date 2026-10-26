/**
 * Extrae el período reportado del prefijo de fecha de un nombre de archivo.
 * Solo acepta fechas calendario válidas seguidas de un guion bajo.
 */
export function extraerPeriodoDesdeNombreArchivo(nombreArchivo) {
  const coincidencia = String(nombreArchivo || "").match(/^(\d{4})-(\d{2})-(\d{2})_(?=.+)/);
  if (!coincidencia) return null;

  const [, anio, mes, dia] = coincidencia;
  const anioNumero = Number(anio);
  const mesNumero = Number(mes);
  const diaNumero = Number(dia);
  const diasDelMes = new Date(Date.UTC(anioNumero, mesNumero, 0)).getUTCDate();

  if (mesNumero < 1 || mesNumero > 12 || diaNumero < 1 || diaNumero > diasDelMes) {
    return null;
  }

  return `${anio}-${mes}`;
}
