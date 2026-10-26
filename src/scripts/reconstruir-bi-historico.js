import process from "node:process";
import { reconstruirBiHistorico } from "../services/bi-publicacion.service.js";

reconstruirBiHistorico()
  .then(resultados => {
    const publicadas = resultados.filter(resultado => resultado.publicado);
    for (const resultado of publicadas) {
      console.log(
        `[${resultado.proceso}] ${resultado.cargasIncluidas} carga(s), ` +
        `${resultado.totalFilas} fila(s), periodos: ${resultado.periodos.join(", ") || "ninguno"}`
      );
      console.log(`Ruta: ${resultado.destino}`);
    }
    const fallidas = resultados.filter(resultado => !resultado.publicado && resultado.error);
    if (fallidas.length) {
      for (const resultado of fallidas) console.error(`[${resultado.proceso}] ${resultado.error}`);
      process.exitCode = 1;
    }
  })
  .catch(error => {
    console.error(`No se pudo reconstruir BI histórico: ${error.message}`);
    process.exitCode = 1;
  });
