import { ENVEJECIMIENTO_VEJEZ_CATALOGOS } from "../catalogs/envejecimientoVejez.catalog.js";
import { buscarHeader, canon } from "./utils.js";

function resolver(headers, filas) {
  const headersReales = filas?.[0] ? Object.keys(filas[0]) : headers;
  return Object.fromEntries(
    Object.entries(ENVEJECIMIENTO_VEJEZ_CATALOGOS.campos).map(([k, v]) => [k, buscarHeader(headersReales, v)])
  );
}

function parseNumero(valor) {
  if (valor == null || String(valor).trim() === "") return { ok: false, numero: 0, vacio: true };
  const original = String(valor).trim();
  const sinSimbolos = original.replace(/[^\d,.\-]/g, "");
  if (!sinSimbolos || sinSimbolos === "-" || sinSimbolos === "." || sinSimbolos === ",") {
    return { ok: false, numero: 0, vacio: false };
  }
  const normalizado = sinSimbolos.includes(".") ? sinSimbolos.replace(/,/g, "") : sinSimbolos.replace(/,/g, "");
  const numero = Number(normalizado);
  return { ok: Number.isFinite(numero), numero: Number.isFinite(numero) ? numero : 0, vacio: false };
}

export default {
  version: "ENVEJECIMIENTO_Y_VEJEZ-v0.1",
  validar({ headers, filas }) {
    const campos = resolver(headers, filas);
    const errores = [];
    const advertencias = [];

    const camposCriticos = ["ano", "comuna", "barrio", "programa", "sexo", "rangoDeEdades", "cantidad", "presupuesto"];

    for (const campo of camposCriticos) {
      if (!campos[campo]) {
        errores.push({
          regla: "EV-ESTRUCTURA",
          campo,
          mensaje: `No se encontró columna compatible para ${campo}.`
        });
      }
    }

    if (errores.length) {
      return {
        valido: false,
        errores,
        advertencias,
        campos,
        resumen: { totalFilas: filas.length, headersDetectados: headers }
      };
    }

    let filasCantidadVacia = 0;
    let filasCantidadInvalida = 0;
    let filasPresupuestoInvalido = 0;
    let totalCantidad = 0;
    let totalPresupuesto = 0;

    const categoriasDetectadas = {
      anos: new Set(),
      comunas: new Set(),
      barrios: new Set(),
      programas: new Set(),
      sexos: new Set(),
      rangosDeEdades: new Set()
    };

    filas.forEach((fila, i) => {
      const cantidad = parseNumero(fila[campos.cantidad]);
      if (cantidad.vacio) {
        filasCantidadVacia++;
        advertencias.push({
          regla: "EV-CANTIDAD-VACIA",
          fila: i + 2,
          mensaje: "Registro sin CANTIDAD."
        });
      } else if (!cantidad.ok) {
        filasCantidadInvalida++;
        advertencias.push({
          regla: "EV-CANTIDAD-INVALIDA",
          fila: i + 2,
          mensaje: `Cantidad no numérica: "${fila[campos.cantidad]}"`
        });
      } else {
        totalCantidad += cantidad.numero;
      }

      const presupuesto = parseNumero(fila[campos.presupuesto]);
      if (!presupuesto.vacio && !presupuesto.ok) {
        filasPresupuestoInvalido++;
        advertencias.push({
          regla: "EV-PRESUPUESTO-INVALIDO",
          fila: i + 2,
          mensaje: `Presupuesto no numérico: "${fila[campos.presupuesto]}"`
        });
      } else {
        totalPresupuesto += presupuesto.numero;
      }

      const detecciones = [
        ["anos", campos.ano],
        ["comunas", campos.comuna],
        ["barrios", campos.barrio],
        ["programas", campos.programa],
        ["sexos", campos.sexo],
        ["rangosDeEdades", campos.rangoDeEdades]
      ];

      for (const [categoria, campo] of detecciones) {
        const valor = fila[campo];
        if (valor != null && String(valor).trim() !== "") categoriasDetectadas[categoria].add(canon(valor));
      }
    });

    return {
      valido: true,
      errores,
      advertencias,
      campos,
      resumen: {
        totalFilas: filas.length,
        filasCantidadVacia,
        filasCantidadInvalida,
        filasPresupuestoInvalido,
        totalCantidad,
        totalPresupuesto: Number(totalPresupuesto.toFixed(2)),
        categoriasDetectadas: Object.fromEntries(
          Object.entries(categoriasDetectadas).map(([k, s]) => [k, [...s].sort()])
        )
      }
    };
  }
};
