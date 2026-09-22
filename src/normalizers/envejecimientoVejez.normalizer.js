function parseNumero(valor) {
  if (valor == null || String(valor).trim() === "") return null;
  const original = String(valor).trim();
  const sinSimbolos = original.replace(/[^\d,.\-]/g, "");
  if (!sinSimbolos || sinSimbolos === "-" || sinSimbolos === "." || sinSimbolos === ",") return null;
  const normalizado = sinSimbolos.includes(".") ? sinSimbolos.replace(/,/g, "") : sinSimbolos.replace(/,/g, "");
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}

function registrarAplicacion(registros, campo, valorOriginal, valorNormalizado, regla) {
  const clave = [campo, valorOriginal, valorNormalizado, regla].join("||");
  const actual = registros.get(clave) || {
    campo,
    valor_original: valorOriginal,
    valor_normalizado: valorNormalizado,
    regla,
    cantidad_afectada: 0
  };
  actual.cantidad_afectada++;
  registros.set(clave, actual);
}

export function normalizarEnvejecimientoVejez({ filas, campos }) {
  const registros = new Map();

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    if (campos.ano) {
      const valor = normalizada[campos.ano];
      const numero = parseNumero(valor);
      if (numero != null) {
        normalizada[campos.ano] = numero;
        if (numero !== Number(valor)) {
          registrarAplicacion(registros, campos.ano, valor, numero, "EV-CONVERSION-ANO");
        }
      }
    }

    for (const campoKey of ["cantidad", "presupuesto"]) {
      const columna = campos[campoKey];
      if (!columna) continue;
      const valor = normalizada[columna];
      const numero = parseNumero(valor);
      if (numero != null) {
        normalizada[columna] = numero;
        if (numero !== Number(valor)) {
          registrarAplicacion(registros, columna, valor, numero, `EV-CONVERSION-${campoKey.toUpperCase()}`);
        }
      }
    }

    return normalizada;
  });

  return {
    datosNormalizados,
    reglasAplicadas: [...registros.values()].sort(
      (a, b) => a.campo.localeCompare(b.campo) || a.regla.localeCompare(b.regla)
    )
  };
}
