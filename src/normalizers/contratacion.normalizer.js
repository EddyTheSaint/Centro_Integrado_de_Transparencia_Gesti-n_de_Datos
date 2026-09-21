import { CONTRATACION_CATALOGOS } from "../catalogs/contratacion.catalog.js";
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

// INFERIDA_DESDE_PBIX: Normalización básica de datos de Contratación
export function normalizarContratacion({ filas, campos }) {
  const registros = new Map();

  // Preparar índices de normalización (cuando existan reglas)
  const indices = Object.fromEntries(
    Object.entries(CONTRATACION_CATALOGOS.normalizaciones).map(([campo, reglas]) => [
      campo,
      indiceReglas(reglas)
    ])
  );

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    // Limpiar espacios en blanco en campos de texto
    for (const campoKey of ["sujetoDeControl", "contratista", "procesoDeContratacion", "sectorDelProyecto"]) {
      const columna = campos[campoKey];
      if (columna) {
        const valor = normalizada[columna];
        if (valor != null && String(valor).trim() !== "") {
          const limpio = String(valor).trim();
          if (limpio !== valor) {
            normalizada[columna] = limpio;
            registrarAplicacion(registros, columna, valor, limpio, "CONTRATACION-LIMPIEZA-ESPACIOS");
          }

          // Aplicar normalizaciones del catálogo si existen
          if (indices[campoKey]) {
            const regla = indices[campoKey].get(canon(limpio));
            if (regla) {
              normalizada[columna] = regla.normalizado;
              registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
            }
          }
        }
      }
    }

    // Normalizar valor contratado (convertir a número)
    if (campos.valorContratado) {
      const columna = campos.valorContratado;
      const valor = normalizada[columna];
      if (valor != null) {
        const numerico = Number(String(valor).replace(/[^\d.,\-]/g, "").replace(",", "."));
        if (!isNaN(numerico) && numerico !== Number(valor)) {
          normalizada[columna] = numerico;
          registrarAplicacion(registros, columna, valor, numerico, "CONTRATACION-CONVERSION-NUMERO");
        } else if (!isNaN(Number(valor))) {
          normalizada[columna] = Number(valor);
        }
      }
    }

    // Validar fecha
    if (campos.fecha) {
      const columna = campos.fecha;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const fecha = new Date(valor);
        if (isNaN(fecha.getTime())) {
          registrarAplicacion(registros, columna, valor, "INVALIDA", "CONTRATACION-FECHA-INVALIDA");
        }
      }
    }

    // Validar evento
    if (campos.evento) {
      const columna = campos.evento;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const eventos = ["1", "2", "3", "4", "PRINCIPAL", "ADICIONES", "PRÓRROGAS", "TERMINACIONES"];
        const eventoUpper = String(valor).toUpperCase();
        if (!eventos.includes(String(valor)) && !eventos.includes(eventoUpper)) {
          registrarAplicacion(registros, columna, valor, "DESCONOCIDO", "CONTRATACION-EVENTO-DESCONOCIDO");
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
