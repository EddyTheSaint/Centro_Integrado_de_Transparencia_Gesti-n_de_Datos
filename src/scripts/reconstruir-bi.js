import process from "node:process";
import { reconstruirBi } from "../services/bi-publicacion.service.js";

reconstruirBi()
  .then(resultados => {
    const fallidas = resultados.filter(resultado => !resultado.publicado);
    console.log(`BI reconstruido: ${resultados.length - fallidas.length} de ${resultados.length} archivo(s).`);
    if (fallidas.length) process.exitCode = 1;
  })
  .catch(error => {
    console.error(`No se pudo reconstruir BI: ${error.message}`);
    process.exitCode = 1;
  });
