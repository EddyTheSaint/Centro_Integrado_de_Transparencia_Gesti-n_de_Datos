export const PRESUPUESTO_ORIGINAL_CAMPO = "_PRESUPUESTO_ORIGINAL";
export const PRESUPUESTO_NORMALIZADO_CAMPO = "PRESUPUESTO_NORMALIZADO";

export function parsePresupuestoHabitantesDetalle(valor) {
  if (valor == null || valor === "") {
    return { valor: null, valido: false, advertencia: "PRESUPUESTO_VACIO" };
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? { valor, valido: true }
      : { valor: NaN, valido: false, advertencia: "PRESUPUESTO_NUMERO_INVALIDO" };
  }

  const original = String(valor).trim();
  if (!original) {
    return { valor: null, valido: false, advertencia: "PRESUPUESTO_VACIO" };
  }

  const conDigitos = /\d/.test(original);
  if (!conDigitos) {
    return /-/.test(original)
      ? { valor: 0, valido: true }
      : { valor: NaN, valido: false, advertencia: "PRESUPUESTO_SIN_DIGITOS" };
  }

  let limpio = original
    .replace(/\s/g, "")
    .replace(/[^\d.,\-()]/g, "");

  const negativo = limpio.includes("-") || (limpio.startsWith("(") && limpio.endsWith(")"));
  limpio = limpio.replace(/[()\-]/g, "");

  const coma = ",";
  const punto = ".";
  const tieneComa = limpio.includes(coma);
  const tienePunto = limpio.includes(punto);
  let numericoTexto = limpio;

  if (tieneComa && tienePunto) {
    const ultimoSeparador = Math.max(limpio.lastIndexOf(coma), limpio.lastIndexOf(punto));
    const separadorDecimal = limpio[ultimoSeparador];
    const separadorMiles = separadorDecimal === coma ? punto : coma;
    numericoTexto = limpio
      .replaceAll(separadorMiles, "")
      .replace(separadorDecimal, ".");
  } else if (tieneComa || tienePunto) {
    const separador = tieneComa ? coma : punto;
    const partes = limpio.split(separador);

    if (partes.length > 2) {
      const gruposMiles = partes.slice(1).every(parte => parte.length === 3);
      if (!gruposMiles) {
        return { valor: NaN, valido: false, advertencia: "PRESUPUESTO_SEPARADORES_AMBIGUOS" };
      }
      numericoTexto = partes.join("");
    } else {
      const [entero, fraccion] = partes;
      if (fraccion.length === 3 && entero.length <= 3) {
        numericoTexto = entero + fraccion;
      } else if (fraccion.length <= 2) {
        numericoTexto = `${entero}.${fraccion}`;
      } else {
        return { valor: NaN, valido: false, advertencia: "PRESUPUESTO_SEPARADOR_AMBIGUO" };
      }
    }
  }

  const numero = Number(numericoTexto);
  if (!Number.isFinite(numero)) {
    return { valor: NaN, valido: false, advertencia: "PRESUPUESTO_CONVERSION_INVALIDA" };
  }

  return { valor: negativo ? -numero : numero, valido: true };
}

export function parsePresupuestoHabitantes(valor) {
  return parsePresupuestoHabitantesDetalle(valor).valor;
}
