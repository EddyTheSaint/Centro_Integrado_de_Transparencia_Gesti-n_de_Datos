import { BUEN_COMIENZO_CATALOGOS } from "../catalogs/buenComienzo.catalog.js";
import { canon } from "../validators/utils.js";
import { parseNumeroBuenComienzoDetalle } from "../utils/buenComienzoNumeros.js";

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

function parseCantidad(valor) {
  if (valor == null || String(valor).trim() === "") return null;
  const numero = Number(String(valor).replace(/,/g, "").trim());
  return Number.isFinite(numero) ? numero : null;
}

function normalizarTextoBasico(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

function normalizarBeneficiarios({ filas, campos }) {
  const registros = new Map();
  const indices = {
    modalidad: indiceReglas(BUEN_COMIENZO_CATALOGOS.normalizaciones.modalidad),
    comuna: indiceReglas(BUEN_COMIENZO_CATALOGOS.normalizaciones.comuna)
  };

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    if (campos.comuna) {
      const columna = campos.comuna;
      const valor = fila[columna];
      normalizada._COMUNA_ORIGINAL = valor;
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.comuna.get(canon(limpio));
        if (regla) {
          normalizada.COMUNA_NORMALIZADA = regla.normalizado;
          normalizada.TIPO_TERRITORIO = regla.tipo;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        } else {
          normalizada.COMUNA_NORMALIZADA = limpio;
          normalizada.TIPO_TERRITORIO = "SIN_CLASIFICAR";
        }
      } else {
        normalizada.COMUNA_NORMALIZADA = null;
        normalizada.TIPO_TERRITORIO = "SIN_TERRITORIO";
      }
    }

    if (campos.modalidad) {
      const columna = campos.modalidad;
      const valor = fila[columna];
      normalizada._MODALIDAD_ORIGINAL = valor;
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.modalidad.get(canon(limpio));
        if (regla) {
          normalizada.NOMBRE_MODALIDAD_NORMALIZADA = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        } else {
          normalizada.NOMBRE_MODALIDAD_NORMALIZADA = normalizarTextoBasico(limpio);
        }
      }
    }

    for (const [campoLogico, campoNormalizado] of [
      ["niña", "NIÑA_NORMALIZADA"],
      ["niño", "NIÑO_NORMALIZADO"],
      ["total", "TOTAL_NORMALIZADO"]
    ]) {
      const columna = campos[campoLogico];
      if (!columna) continue;
      const valor = parseCantidad(fila[columna]);
      normalizada[campoNormalizado] = valor;
      if (valor != null) normalizada[columna] = valor;
    }

    return normalizada;
  });

  return { datosNormalizados, reglasAplicadas: registros };
}

function normalizarPresupuesto({ filas, campos }) {
  const registros = new Map();

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    if (campos.proyecto) {
      const valor = fila[campos.proyecto];
      normalizada._PROYECTO_ORIGINAL = valor;
      if (valor != null && String(valor).trim() !== "") {
        const normalizado = normalizarTextoBasico(valor);
        normalizada.PROYECTO_NORMALIZADO = normalizado;
        if (normalizado !== String(valor).trim()) {
          registrarAplicacion(registros, campos.proyecto, String(valor).trim(), normalizado, "BC-PROYECTO-CASE-ESPACIOS");
        }
      }
    }

    if (campos.valor) {
      const columna = campos.valor;
      const valor = fila[columna];
      normalizada._VALOR_ORIGINAL = valor;
      const resultado = parseNumeroBuenComienzoDetalle(valor);
      normalizada.VALOR_NORMALIZADO = resultado.valido ? resultado.valor : null;
      if (resultado.valido && resultado.valor !== Number(valor)) {
        registrarAplicacion(registros, columna, valor, resultado.valor, "BC-CONVERSION-VALOR");
      }
    }

    if (campos.ejecutado) {
      const columna = campos.ejecutado;
      const valor = fila[columna];
      normalizada._EJECUTADO_ORIGINAL = valor;
      const resultado = parseNumeroBuenComienzoDetalle(valor);
      normalizada.EJECUTADO_NORMALIZADO = resultado.valido ? resultado.valor : null;
      if (resultado.valido && resultado.valor !== Number(valor)) {
        registrarAplicacion(registros, columna, valor, resultado.valor, "BC-CONVERSION-EJECUTADO");
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
