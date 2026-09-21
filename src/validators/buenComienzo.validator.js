import { buscarHeader, canon } from "./utils.js";
import { detectarHojaBuenComienzo } from "../services/excel.service.js";

const CAMPOS_BENEFICIARIOS = {
  id: ["ID", "IDENTIFICADOR"],
  año: ["AÑO"],
  idComunaSede: ["ID_COMUNA_SEDE"],
  comuna: ["COMUNA", "NOMBRE COMUNA"],
  corregimiento: ["CORREGIMIENTO"],
  niña: ["NIÑA", "NINA"],
  niño: ["NIÑO", "NINO"],
  total: ["TOTAL", "TOTAL BENEFICIARIOS"],
  modalidad: ["MODALIDAD", "NOMBRE_MODALIDAD"],
  sede: ["SEDE", "NOMBRE_SEDE"],
  mes: ["MES"],
  fechaCorte: ["FECHA CORTE", "FECHA_CORTE"]
};

const CAMPOS_PRESUPUESTO = {
  proyecto: ["PROYECTO"],
  valor: ["VALOR", " VALOR ", "PRESUPUESTO_ASIGNADO", "PRESUPUESTO ASIGNADO"],
  ejecutado: ["EJECUTADO", " EJECUTADO ", "PRESUPUESTO_EJECUTADO", "PRESUPUESTO EJECUTADO"]
};

function resolver(headers, campos) {
  return Object.fromEntries(
    Object.entries(campos).map(([k, v]) => [k, buscarHeader(headers, v)])
  );
}

function validarBeneficiarios({ headers, filas }) {
  const campos = resolver(headers, CAMPOS_BENEFICIARIOS);
  const errores = [];
  const advertencias = [];

  if (!campos.niña && !campos.niño && !campos.total) {
    errores.push({
      regla: "BC-ESTRUCTURA-BENEF",
      campo: "beneficiarios",
      mensaje: "Se requiere al menos una columna: TOTAL, NIÑA o NIÑO."
    });
  }

  let comunasVacias = 0;
  const categorias = { comunas: new Set(), modalidades: new Set() };

  filas.forEach((fila, i) => {
    const comuna = fila[campos.comuna];
    if (comuna == null || String(comuna).trim() === "") {
      comunasVacias++;
      advertencias.push({
        regla: "BC-COMUNA-VACIA-ICBF",
        fila: i + 2,
        mensaje: "Registro sin COMUNA (válido para ICBF)."
      });
    } else {
      categorias.comunas.add(canon(comuna));
    }

    if (campos.modalidad) {
      const modalidad = fila[campos.modalidad];
      if (modalidad != null && String(modalidad).trim() !== "") {
        categorias.modalidades.add(canon(modalidad));
      }
    }
  });

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    campos,
    resumen: {
      totalFilas: filas.length,
      comunasVacias,
      categoriasDetectadas: {
        comunas: [...categorias.comunas].sort(),
        modalidades: [...categorias.modalidades].sort()
      }
    }
  };
}

function validarPresupuesto({ headers, filas }) {
  const campos = resolver(headers, CAMPOS_PRESUPUESTO);
  const errores = [];
  const advertencias = [];

  if (!campos.proyecto) {
    advertencias.push({
      regla: "BC-PRESUPUESTO-PROYECTO",
      mensaje: "No se encontró columna PROYECTO."
    });
  }

  if (!campos.valor) {
    advertencias.push({
      regla: "BC-PRESUPUESTO-VALOR",
      mensaje: "No se encontró columna VALOR o PRESUPUESTO_ASIGNADO."
    });
  }

  let valoresInvalidos = 0;
  let ejecutadosInvalidos = 0;

  filas.forEach((fila, i) => {
    if (campos.valor) {
      const valor = fila[campos.valor];
      if (valor != null && isNaN(Number(valor))) {
        valoresInvalidos++;
      }
    }
    if (campos.ejecutado) {
      const ejecutado = fila[campos.ejecutado];
      if (ejecutado != null && isNaN(Number(ejecutado))) {
        ejecutadosInvalidos++;
      }
    }
  });

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    campos,
    resumen: {
      totalFilas: filas.length,
      valoresInvalidos,
      ejecutadosInvalidos
    }
  };
}

export default {
  version: "BUEN_COMIENZO-v0.2",
  validarMultiHoja(buffer) {
    try {
      const { hojaBeneficiarios, hojaPresupuesto } = detectarHojaBuenComienzo(buffer);

      if (!hojaBeneficiarios) {
        return {
          ok: false,
          errores: [{
            regla: "BC-HOJAS",
            mensaje: "No se encontró hoja de beneficiarios con columnas: AÑO, NOMBRE COMUNA, NIÑA, NIÑO, TOTAL, etc."
          }],
          hojas: { beneficiarios: null, presupuesto: null }
        };
      }

      const validacionBenef = validarBeneficiarios(hojaBeneficiarios);
      const validacionPresup = hojaPresupuesto ? validarPresupuesto(hojaPresupuesto) : { ok: true, errores: [], advertencias: [], campos: {}, resumen: {} };

      const hojas = {
        beneficiarios: validacionBenef.valido ? {
          nombre: hojaBeneficiarios.nombre,
          headers: hojaBeneficiarios.headers,
          filas: hojaBeneficiarios.filas,
          campos: validacionBenef.campos,
          errores: validacionBenef.errores,
          advertencias: validacionBenef.advertencias
        } : null,
        presupuesto: hojaPresupuesto && validacionPresup.valido ? {
          nombre: hojaPresupuesto.nombre,
          headers: hojaPresupuesto.headers,
          filas: hojaPresupuesto.filas,
          campos: validacionPresup.campos,
          errores: validacionPresup.errores,
          advertencias: validacionPresup.advertencias
        } : null
      };

      return {
        ok: validacionBenef.valido && validacionPresup.valido,
        errores: [...validacionBenef.errores, ...validacionPresup.errores],
        advertencias: [...validacionBenef.advertencias, ...validacionPresup.advertencias],
        hojas
      };
    } catch (error) {
      return {
        ok: false,
        errores: [{ regla: "BC-ERROR", mensaje: error.message }],
        hojas: { beneficiarios: null, presupuesto: null }
      };
    }
  },

  validar({ headers, filas }) {
    const campos = resolver(headers, CAMPOS_BENEFICIARIOS);
    const errores = [];
    const advertencias = [];

    if (!campos.niña && !campos.niño && !campos.total) {
      errores.push({
        regla: "BC-ESTRUCTURA",
        campo: "beneficiarios",
        mensaje: "Se requiere al menos una columna: TOTAL, NIÑA o NIÑO."
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

    let comunasVacias = 0;
    const categorias = { comunas: new Set(), modalidades: new Set() };

    filas.forEach((fila, i) => {
      const comuna = fila[campos.comuna];
      if (comuna == null || String(comuna).trim() === "") {
        comunasVacias++;
        advertencias.push({
          regla: "BC-COMUNA-VACIA-ICBF",
          fila: i + 2,
          mensaje: "Registro sin COMUNA (válido para ICBF)."
        });
      } else {
        categorias.comunas.add(canon(comuna));
      }

      if (campos.modalidad) {
        const modalidad = fila[campos.modalidad];
        if (modalidad != null && String(modalidad).trim() !== "") {
          categorias.modalidades.add(canon(modalidad));
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
        comunasVacias,
        categoriasDetectadas: {
          comunas: [...categorias.comunas].sort(),
          modalidades: [...categorias.modalidades].sort()
        }
      }
    };
  }
};
