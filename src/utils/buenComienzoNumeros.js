export function parseNumeroBuenComienzoDetalle(valor) {
  if (valor == null || valor === "") {
    return { valor: null, valido: false, advertencia: "VALOR_VACIO" };
  }

  if (typeof valor === "number") {
    return Number.isFinite(valor)
      ? { valor, valido: true }
      : { valor: NaN, valido: false, advertencia: "NUMERO_INVALIDO" };
  }

  const original = String(valor).trim();
  if (!original) return { valor: null, valido: false, advertencia: "VALOR_VACIO" };

  if (!/\d/.test(original)) {
    return /-/.test(original)
      ? { valor: 0, valido: true }
      : { valor: NaN, valido: false, advertencia: "SIN_DIGITOS" };
  }

  let limpio = original.replace(/\s/g, "").replace(/[^\d.,\-()]/g, "");
  const negativo = limpio.includes("-") || (limpio.startsWith("(") && limpio.endsWith(")"));
  limpio = limpio.replace(/[()\-]/g, "");

  const tieneComa = limpio.includes(",");
  const tienePunto = limpio.includes(".");
  let texto = limpio;

  if (tieneComa && tienePunto) {
    const ultimo = Math.max(limpio.lastIndexOf(","), limpio.lastIndexOf("."));
    const decimal = limpio[ultimo];
    const miles = decimal === "," ? "." : ",";
    texto = limpio.replaceAll(miles, "").replace(decimal, ".");
  } else if (tieneComa || tienePunto) {
    const sep = tieneComa ? "," : ".";
    const partes = limpio.split(sep);
    if (partes.length > 2) {
      if (!partes.slice(1).every(parte => parte.length === 3)) {
        return { valor: NaN, valido: false, advertencia: "SEPARADORES_AMBIGUOS" };
      }
      texto = partes.join("");
    } else {
      const [entero, fraccion] = partes;
      if (fraccion.length === 3 && entero.length <= 3) texto = entero + fraccion;
      else if (fraccion.length <= 2) texto = `${entero}.${fraccion}`;
      else return { valor: NaN, valido: false, advertencia: "SEPARADOR_AMBIGUO" };
    }
  }

  const numero = Number(texto);
  if (!Number.isFinite(numero)) {
    return { valor: NaN, valido: false, advertencia: "CONVERSION_INVALIDA" };
  }

  return { valor: negativo ? -numero : numero, valido: true };
}

export function parseNumeroBuenComienzo(valor) {
  return parseNumeroBuenComienzoDetalle(valor).valor;
}
