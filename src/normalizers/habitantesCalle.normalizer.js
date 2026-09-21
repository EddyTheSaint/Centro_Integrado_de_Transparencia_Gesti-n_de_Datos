import { HABITANTES_CALLE_CATALOGOS } from "../catalogs/habitantesCalle.catalog.js";
import { canon } from "../validators/utils.js";

function indiceReglas(reglas) {
  return new Map((reglas || []).map(regla => [canon(regla.original), regla]));
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

export function normalizarHabitantesCalle({ filas, campos }) {
  const registros = new Map();

  // Preparar índices de normalización
  const indices = {
    sexo: indiceReglas(HABITANTES_CALLE_CATALOGOS.normalizaciones.sexo),
    rangosDeEdades: indiceReglas(HABITANTES_CALLE_CATALOGOS.normalizaciones.rangosDeEdades)
  };

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    // Mantener valores originales para análisis institucional
    if (campos.sexo) {
      normalizada['_SEXO_ORIGINAL'] = fila[campos.sexo];
    }
    if (campos.rangosDeEdades) {
      normalizada['_RANGOS_EDADES_ORIGINAL'] = fila[campos.rangosDeEdades];
    }
    if (campos.componente) {
      normalizada['_COMPONENTE_ORIGINAL'] = fila[campos.componente];
    }
    if (campos.sedeDeAtencion) {
      normalizada['_SEDE_ORIGINAL'] = fila[campos.sedeDeAtencion];
    }
    if (campos.nombreProyecto) {
      normalizada['_PROYECTO_ORIGINAL'] = fila[campos.nombreProyecto];
    }

    // Normalizar SEXO
    if (campos.sexo) {
      const columna = campos.sexo;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.sexo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Normalizar RANGOS DE EDADES
    if (campos.rangosDeEdades) {
      const columna = campos.rangosDeEdades;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.rangosDeEdades.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Convertir CANTIDAD a número
    // IMPORTANTE: La coma es separador de miles, no decimal
    // "4,337" -> 4337 (no 4.337)
    if (campos.cantidad) {
      const columna = campos.cantidad;
      const valor = normalizada[columna];
      if (valor != null) {
        const valorStr = String(valor).trim();
        // Remover comas (separador de miles) y convertir a entero
        const numerico = parseInt(valorStr.replace(/,/g, ""), 10);
        if (!isNaN(numerico)) {
          normalizada[columna] = numerico;
          if (numerico !== Number(valor)) {
            registrarAplicacion(registros, columna, valorStr, numerico, "HC-CONVERSION-CANTIDAD");
          }
        }
      }
    }

    // Convertir PRESUPUESTO a número
    if (campos.presupuesto) {
      const columna = campos.presupuesto;
      const valor = normalizada[columna];
      if (valor != null) {
        const numerico = Number(String(valor).replace(/[^\d.,\-]/g, "").replace(",", "."));
        if (!isNaN(numerico) && numerico !== Number(valor)) {
          normalizada[columna] = numerico;
          registrarAplicacion(registros, columna, valor, numerico, "HC-CONVERSION-PRESUPUESTO");
        } else if (!isNaN(Number(valor))) {
          normalizada[columna] = Number(valor);
        }
      }
    }

    // Convertir AÑO a número
    if (campos.año) {
      const columna = campos.año;
      const valor = normalizada[columna];
      if (valor != null && !isNaN(Number(valor))) {
        normalizada[columna] = Number(valor);
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
