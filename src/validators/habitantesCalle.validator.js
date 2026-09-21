import { buscarHeader, canon } from "./utils.js";

// Campos esperados en el Excel RAW de Habitantes de Calle
const CAMPOS = {
  año: ["AÑO", "AÑO", "YEAR"],
  numeroProyecto: ["No. PROYECTO", "NO. PROYECTO", "NUMERO PROYECTO", "PROJECT_ID"],
  nombreProyecto: ["Nombre del proyecto", "NOMBRE DEL PROYECTO", "PROJECT_NAME"],
  sedeDeAtencion: ["SEDE DE ATENCION", "SEDE DE ATENCIÓN", "SEDE ATENCION", "LOCATION"],
  programa: ["PROGRAMA", "PROGRAM"],
  componente: ["COMPONENTE", "COMPONENT"],
  sexo: ["SEXO", "SEX", "GENDER"],
  rangosDeEdades: ["RANGOS DE EDADES", "RANGOS DE EDAD", "RANGO EDADES", "AGE_RANGE"],
  cantidad: ["CANTIDAD", "TOTAL", "COUNT", "CANTIDAD_PERSONAS"],
  presupuesto: ["PRESUPUESTO", "BUDGET", "PRESUPUESTO_TOTAL"]
};

function resolver(headers) {
  return Object.fromEntries(
    Object.entries(CAMPOS).map(([k, v]) => [k, buscarHeader(headers, v)])
  );
}

export default {
  version: "HABITANTES_CALLE-v0.1",
  validar({ headers, filas }) {
    const campos = resolver(headers);
    const errores = [];
    const advertencias = [];

    // Campos críticos
    const camposCriticos = ["año", "nombreProyecto", "componente", "sexo", "rangosDeEdades", "cantidad", "presupuesto"];

    for (const campo of camposCriticos) {
      if (!campos[campo]) {
        errores.push({
          regla: "HC-ESTRUCTURA",
          campo,
          mensaje: `No se encontró columna compatible para ${campo}.`
        });
      }
    }

    if (!campos.sedeDeAtencion) {
      advertencias.push({
        regla: "HC-SEDE-FALTANTE",
        mensaje: "No se encontró columna SEDE DE ATENCION."
      });
    }

    if (!campos.programa) {
      advertencias.push({
        regla: "HC-PROGRAMA-FALTANTE",
        mensaje: "No se encontró columna PROGRAMA."
      });
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

    let filasConCantidadVacia = 0;
    let filasConCantidadInvalida = 0;
    let filasConPresupuestoInvalido = 0;
    let totalCantidad = 0;
    let totalPresupuesto = 0;

    const categoriasDetectadas = {
      años: new Set(),
      sedesDeAtencion: new Set(),
      programas: new Set(),
      componentes: new Set(),
      sexos: new Set(),
      rangosDeEdades: new Set(),
      proyectos: new Set()
    };

    const variantes = {
      sexos: new Map(),
      rangosDeEdades: new Map()
    };

    filas.forEach((fila, i) => {
      // Validar CANTIDAD
      const cantidad = fila[campos.cantidad];
      if (cantidad == null || String(cantidad).trim() === "") {
        filasConCantidadVacia++;
        advertencias.push({
          regla: "HC-CANTIDAD-VACIA",
          fila: i + 2,
          mensaje: "Registro sin CANTIDAD."
        });
      } else if (isNaN(Number(cantidad))) {
        filasConCantidadInvalida++;
        advertencias.push({
          regla: "HC-CANTIDAD-INVALIDA",
          fila: i + 2,
          mensaje: `Cantidad no numérica: "${cantidad}"`
        });
      } else {
        totalCantidad += Number(cantidad);
      }

      // Validar PRESUPUESTO
      const presupuesto = fila[campos.presupuesto];
      if (presupuesto != null && String(presupuesto).trim() !== "") {
        if (isNaN(Number(presupuesto))) {
          filasConPresupuestoInvalido++;
        } else {
          totalPresupuesto += Number(presupuesto);
        }
      }

      // Detectar categorías
      if (campos.año) {
        const año = fila[campos.año];
        if (año != null) categoriasDetectadas.años.add(canon(año));
      }

      if (campos.sedeDeAtencion) {
        const sede = fila[campos.sedeDeAtencion];
        if (sede != null && String(sede).trim() !== "") {
          categoriasDetectadas.sedesDeAtencion.add(canon(sede));
        }
      }

      if (campos.programa) {
        const prog = fila[campos.programa];
        if (prog != null && String(prog).trim() !== "") {
          categoriasDetectadas.programas.add(canon(prog));
        }
      }

      if (campos.componente) {
        const comp = fila[campos.componente];
        if (comp != null && String(comp).trim() !== "") {
          categoriasDetectadas.componentes.add(canon(comp));
        }
      }

      if (campos.sexo) {
        const sexo = fila[campos.sexo];
        if (sexo != null && String(sexo).trim() !== "") {
          const clave = canon(sexo);
          categoriasDetectadas.sexos.add(clave);
          variantes.sexos.set(String(sexo).trim(), true);
        }
      }

      if (campos.rangosDeEdades) {
        const rango = fila[campos.rangosDeEdades];
        if (rango != null && String(rango).trim() !== "") {
          const clave = canon(rango);
          categoriasDetectadas.rangosDeEdades.add(clave);
          variantes.rangosDeEdades.set(String(rango).trim(), true);
        }
      }

      if (campos.nombreProyecto) {
        const proy = fila[campos.nombreProyecto];
        if (proy != null && String(proy).trim() !== "") {
          categoriasDetectadas.proyectos.add(canon(proy));
        }
      }
    });

    return {
      valido: true,
      errores,
      advertencias,
      campos,
      resumen: {
        totalFilas: filas.length,
        filasConCantidadVacia,
        filasConCantidadInvalida,
        filasConPresupuestoInvalido,
        totalCantidad,
        totalPresupuesto,
        categoriasDetectadas: Object.fromEntries(
          Object.entries(categoriasDetectadas).map(([k, s]) => [k, [...s].sort()])
        ),
        variantesDetectadas: {
          sexos: [...variantes.sexos.keys()].sort(),
          rangosDeEdades: [...variantes.rangosDeEdades.keys()].sort()
        }
      }
    };
  }
};
