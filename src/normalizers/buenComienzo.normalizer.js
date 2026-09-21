import { BUEN_COMIENZO_CATALOGOS } from "../catalogs/buenComienzo.catalog.js";
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

function normalizarBeneficiarios({ filas, campos }) {
  const registros = new Map();
  const indices = {
    modalidad: indiceReglas(BUEN_COMIENZO_CATALOGOS.normalizaciones.modalidad),
    comuna: indiceReglas(BUEN_COMIENZO_CATALOGOS.normalizaciones.comuna)
  };

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    if (campos.modalidad) {
      const columna = campos.modalidad;
      const valor = fila[columna];
      if (valor != null && String(valor).trim() !== "") {
        const regla = indices.modalidad.get(canon(valor));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, String(valor), regla.normalizado, regla.regla);
        }
      }
    }

    if (campos.comuna) {
      const columna = campos.comuna;
      const valor = fila[columna];
      if (valor != null && String(valor).trim() !== "") {
        const regla = indices.comuna.get(canon(valor));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, String(valor), regla.normalizado, regla.regla);
        }
      }
    }

    return normalizada;
  });

  return { datosNormalizados, reglasAplicadas: registros };
}

function normalizarPresupuesto({ filas, campos }) {
  const registros = new Map();

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    if (campos.valor) {
      const columna = campos.valor;
      const valor = fila[columna];
      if (valor != null && !isNaN(Number(valor))) {
        const numerico = Number(valor);
        if (numerico < 0) {
          registrarAplicacion(registros, columna, valor, 0, "BC-PRESUPUESTO-NEGATIVO");
          normalizada[columna] = 0;
        }
      }
    }

    if (campos.ejecutado) {
      const columna = campos.ejecutado;
      const valor = fila[columna];
      if (valor != null && !isNaN(Number(valor))) {
        const numerico = Number(valor);
        if (numerico < 0) {
          registrarAplicacion(registros, columna, valor, 0, "BC-EJECUTADO-NEGATIVO");
          normalizada[columna] = 0;
        }
      }
    }

    return normalizada;
  });

  return { datosNormalizados, reglasAplicadas: registros };
}

export function normalizarBuenComienzo({ hojas }) {
  const reglasAplicadas = new Map();
  let datosNormalizadosBenef = [];
  let datosNormalizadosPresup = [];

  if (hojas.beneficiarios) {
    const resultado = normalizarBeneficiarios(hojas.beneficiarios);
    datosNormalizadosBenef = resultado.datosNormalizados;
    resultado.reglasAplicadas.forEach((v, k) => reglasAplicadas.set(k, v));
  }

  if (hojas.presupuesto) {
    const resultado = normalizarPresupuesto(hojas.presupuesto);
    datosNormalizadosPresup = resultado.datosNormalizados;
    resultado.reglasAplicadas.forEach((v, k) => reglasAplicadas.set(k, v));
  }

  return {
    hojas: {
      beneficiarios: datosNormalizadosBenef,
      presupuesto: datosNormalizadosPresup
    },
    reglasAplicadas: [...reglasAplicadas.values()].sort(
      (a, b) => a.campo.localeCompare(b.campo) || a.regla.localeCompare(b.regla)
    )
  };
}
