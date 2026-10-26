import process from "node:process";
import { reconstruirRegistroCargas } from "../services/registro-cargas.service.js";

reconstruirRegistroCargas()
  .then(cargas => {
    console.log(`Registro de cargas reconstruido: ${cargas.length} fila(s).`);
  })
  .catch(error => {
    console.error(`No se pudo reconstruir el registro de cargas: ${error.message}`);
    process.exitCode = 1;
  });
