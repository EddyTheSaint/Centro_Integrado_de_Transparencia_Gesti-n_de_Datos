import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { crearExcelBuffer } from "../src/services/excel.service.js";
import {
  listarArchivosLocales,
  procesarArchivoLocal,
  procesarCargasLocales,
  resolverResultadoCarga
} from "../src/services/cargas-locales.service.js";

const loggerSilencioso = { log() {}, error() {} };

async function entornoTemporal() {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), "cit-cargas-locales-"));
  return { raiz, registro: path.join(raiz, "control", "processed-files.json") };
}

async function crearProceso(raiz, nombre) {
  const raw = path.join(raiz, nombre, "01_RAW");
  await fs.mkdir(raw, { recursive: true });
  return raw;
}

function excelPqrsd(total = 2) {
  const filas = Array.from({ length: total }, (_, indice) => ({
    "No. PQRSD": `P-${indice + 1}`,
    "MEDIO DE LLEGADA": "WEB",
    "TIPO DE REQUERIMIENTO": "PETICION",
    COMUNA: "COMUNA 01 POPULAR",
    "ESTADO DEL TRAMITE": "EN TRAMITE"
  }));
  return crearExcelBuffer(filas, "Datos");
}

test("procesa un Excel nuevo, conserva el RAW y omite el mismo fingerprint", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "PQRSD");
  const archivo = path.join(raw, "entrada.xlsx");
  const contenido = excelPqrsd();
  await fs.writeFile(archivo, contenido);
  const statAntes = await fs.stat(archivo);
  const bytesAntes = await fs.readFile(archivo);
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const primera = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  assert.equal(primera.procesados, 1);
  assert.equal(primera.resultados[0].estado, "VALIDADO");
  assert.equal(primera.resultados[0].totalFilas, 2);
  assert.equal(primera.resultados[0].errores.length, 0);
  assert.ok(primera.resultados[0].rutaNormalizado);

  const statDespues = await fs.stat(archivo);
  assert.equal(statDespues.size, statAntes.size);
  assert.equal(statDespues.mtimeMs, statAntes.mtimeMs);
  assert.deepEqual(await fs.readFile(archivo), bytesAntes);

  const segunda = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  assert.equal(segunda.procesados, 0);
  assert.equal(segunda.omitidos, 1);
  const consolidado = JSON.parse(await fs.readFile(path.join(path.dirname(registro), "registro-cargas.json"), "utf8"));
  assert.equal(consolidado.length, 1);
  assert.equal(consolidado[0].estado, "VALIDADO");
});

test("un proceso deshabilitado genera PENDIENTE_VALIDACION sin normalizado", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "CONTRATACION");
  await fs.writeFile(path.join(raw, "pendiente.xlsx"), Buffer.from("no se debe abrir"));
  const procesos = [{
    folderName: "CONTRATACION",
    internalProcessName: "CONTRATACION",
    automaticValidationEnabled: false
  }];

  const resumen = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  assert.equal(resumen.resultados[0].estado, "PENDIENTE_VALIDACION");
  assert.equal((await fs.readdir(path.join(raiz, "CONTRATACION", "02_NORMALIZADO"))).length, 0);
  assert.equal((await fs.readdir(path.join(raiz, "CONTRATACION", "03_VALIDACION"))).length, 1);
  assert.equal((await fs.readdir(path.join(raiz, "CONTRATACION", "04_HISTORICO"))).length, 1);
});

test("registra un Excel con estructura inválida como observado y continúa con el siguiente", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "PQRSD");
  await fs.writeFile(path.join(raw, "01-invalido.xlsx"), Buffer.from("contenido inválido"));
  await fs.writeFile(path.join(raw, "02-valido.xlsx"), excelPqrsd(1));
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const resumen = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  assert.equal(resumen.procesados, 2);
  assert.deepEqual(resumen.resultados.map(item => item.estado), ["OBSERVADO", "VALIDADO"]);
  assert.equal((await fs.readdir(path.join(raiz, "PQRSD", "03_VALIDACION"))).length, 2);
  assert.equal((await fs.readdir(path.join(raiz, "PQRSD", "04_HISTORICO"))).length, 2);
});

test("procesa nuevamente un archivo cuando cambia su tamaño o fecha de modificación", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "PQRSD");
  const archivo = path.join(raw, "entrada.xlsx");
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];
  await fs.writeFile(archivo, excelPqrsd(1));

  await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  await fs.writeFile(archivo, excelPqrsd(3));
  const modificada = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });

  assert.equal(modificada.procesados, 1);
  assert.equal(modificada.resultados[0].totalFilas, 3);
});

test("--force reprocesa el mismo fingerprint con nombres de salida nuevos", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "PQRSD");
  await fs.writeFile(path.join(raw, "entrada.xlsx"), excelPqrsd(1));
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const inicial = await procesarCargasLocales({ raiz, rutaRegistro: registro, procesos, logger: loggerSilencioso });
  const forzada = await procesarCargasLocales({
    raiz,
    rutaRegistro: registro,
    procesos,
    force: true,
    logger: loggerSilencioso
  });
  assert.equal(forzada.procesados, 1);
  assert.notEqual(forzada.resultados[0].idCarga, inicial.resultados[0].idCarga);
  assert.equal((await fs.readdir(path.join(raiz, "PQRSD", "02_NORMALIZADO"))).length, 2);
  const consolidado = JSON.parse(await fs.readFile(path.join(path.dirname(registro), "registro-cargas.json"), "utf8"));
  assert.equal(consolidado.length, 2);
});

test("lista el estado y resuelve únicamente resultados autorizados", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = await crearProceso(raiz, "PQRSD");
  await fs.writeFile(path.join(raw, "entrada.xlsx"), excelPqrsd(2));
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const ejecucion = await procesarArchivoLocal({
    proceso: "PQRSD",
    archivo: "entrada.xlsx",
    raiz,
    rutaRegistro: registro,
    procesos,
    logger: loggerSilencioso
  });
  const listado = await listarArchivosLocales({ proceso: "PQRSD", raiz, rutaRegistro: registro, procesos });
  assert.equal(listado.archivos[0].estado, "VALIDADO");
  assert.equal(listado.archivos[0].totalFilas, 2);
  assert.deepEqual(listado.archivos[0].salidas, { validacion: true, normalizado: true, historico: true });

  const rutaReporte = await resolverResultadoCarga({
    proceso: "PQRSD",
    idCarga: ejecucion.archivo.idCarga,
    tipo: "validacion",
    raiz,
    procesos
  });
  assert.equal(path.basename(rutaReporte), `${ejecucion.archivo.idCarga}-validacion.json`);
  await assert.rejects(
    resolverResultadoCarga({ proceso: "PQRSD", idCarga: "../secreto", tipo: "validacion", raiz, procesos }),
    /no permitido/
  );
});

test("rechaza nombres arbitrarios al procesar un archivo individual", async t => {
  const { raiz, registro } = await entornoTemporal();
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  await crearProceso(raiz, "PQRSD");
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  await assert.rejects(
    procesarArchivoLocal({
      proceso: "PQRSD",
      archivo: "../entrada.xlsx",
      raiz,
      rutaRegistro: registro,
      procesos,
      logger: loggerSilencioso
    }),
    /no permitido/
  );
});
