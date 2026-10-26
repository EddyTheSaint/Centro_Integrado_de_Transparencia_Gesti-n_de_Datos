import process from "node:process";
import { procesarCargasLocales } from "../services/cargas-locales.service.js";

function obtenerArgumento(nombre) {
  const prefijo = `--${nombre}=`;
  return process.argv.find(argumento => argumento.startsWith(prefijo))?.slice(prefijo.length) || null;
}

const processFilter = obtenerArgumento("process");
const force = process.argv.includes("--force");

procesarCargasLocales({ processFilter, force })
  .then(resumen => {
    console.log(
      `Resumen: ${resumen.procesados} procesado(s), ${resumen.omitidos} omitido(s), ${resumen.detectados} detectado(s).`
    );
  })
  .catch(error => {
    console.error(`Error al procesar cargas locales: ${error.message}`);
    process.exitCode = 1;
  });
