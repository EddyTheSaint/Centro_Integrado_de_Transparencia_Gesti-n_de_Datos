import { buscarHeader, canon } from "./utils.js";

// INFERIDA_DESDE_PBIX: Campos esperados en el Excel RAW de Contratación
// Aliases configurables para cada campo esperado
const CAMPOS = {
  sujetoDeControl: ["SUJETO_DE_CONTROL", "SUJETO DE CONTROL", "SUJETO CONTROL"],
  contratista: ["CONTRATISTA", "NOMBRE_CONTRATISTA", "NOMBRE CONTRATISTA"],
  procesoDeContratacion: ["PROCESO_DE_CONTRATACION", "PROCESO DE CONTRATACION", "TIPO_PROCESO", "PROCESO"],
  sectorDelProyecto: ["SECTOR_DEL_PROYECTO", "SECTOR DEL PROYECTO", "SECTOR", "SECTOR_PROYECTO"],
  valorContratado: ["VALOR_CONTRATADO", "VALOR CONTRATADO", "MONTO", "VALOR"],
  fecha: ["FECHA", "FECHA_CONTRATO", "FECHA CONTRATO"],
  evento: ["EVENTO", "TIPO_EVENTO", "TIPO EVENTO"]
};

function resolver(headers) {
  return Object.fromEntries(
    Object.entries(CAMPOS).map(([k, v]) => [k, buscarHeader(headers, v)])
  );
}

export default {
  version: "CONTRATACION-v0.1",
  validar({ headers, filas }) {
    const campos = resolver(headers);
    const errores = [];
    const advertencias = [];

    // INFERIDA_DESDE_PBIX: Campos críticos requeridos
    const camposCriticos = ["sujetoDeControl", "contratista", "procesoDeContratacion", "sectorDelProyecto", "valorContratado"];

    for (const campo of camposCriticos) {
      if (!campos[campo]) {
        errores.push({
          regla: "CONTRATACION-ESTRUCTURA",
          campo,
          mensaje: `No se encontró columna compatible para ${campo}.`
        });
      }
    }

    if (!campos.fecha) {
      advertencias.push({
        regla: "CONTRATACION-FECHA-FALTANTE",
        mensaje: "No se encontró columna FECHA (recomendada para análisis temporal)."
      });
    }

    if (!campos.evento) {
      advertencias.push({
        regla: "CONTRATACION-EVENTO-FALTANTE",
        mensaje: "No se encontró columna EVENTO (requerida para filtrar evento 1-Principal)."
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

    let filasSinValor = 0;
    let valoresInvalidos = 0;
    const categoriasDetectadas = {
      sujetosDeControl: new Set(),
      contratistas: new Set(),
      procesosDeContratacion: new Set(),
      sectoresDelProyecto: new Set()
    };

    filas.forEach((fila, i) => {
      // Validar valor contratado
      const valor = fila[campos.valorContratado];
      if (valor == null || String(valor).trim() === "") {
        filasSinValor++;
        advertencias.push({
          regla: "CONTRATACION-VALOR-VACIO",
          fila: i + 2,
          mensaje: "Registro sin VALOR_CONTRATADO."
        });
      } else if (isNaN(Number(valor))) {
        valoresInvalidos++;
        advertencias.push({
          regla: "CONTRATACION-VALOR-INVALIDO",
          fila: i + 2,
          mensaje: `Valor no numérico: "${valor}"`
        });
      }

      // Detectar categorías
      const detecciones = [
        ["sujetosDeControl", campos.sujetoDeControl],
        ["contratistas", campos.contratista],
        ["procesosDeContratacion", campos.procesoDeContratacion],
        ["sectoresDelProyecto", campos.sectorDelProyecto]
      ];

      for (const [categoria, campo] of detecciones) {
        const v = fila[campo];
        if (v != null && String(v).trim() !== "") {
          categoriasDetectadas[categoria].add(canon(v));
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
        filasSinValor,
        valoresInvalidos,
        categoriasDetectadas: Object.fromEntries(
          Object.entries(categoriasDetectadas).map(([k, s]) => [k, [...s].sort()])
        )
      }
    };
  }
};
