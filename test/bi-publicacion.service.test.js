import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { crearExcelBuffer } from "../src/services/excel.service.js";
import { procesarCargasLocales } from "../src/services/cargas-locales.service.js";
import { reconstruirBi } from "../src/services/bi-publicacion.service.js";

const loggerSilencioso = { log() {}, error() {} };
const procesos = [
  { folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true },
  { folderName: "HABITANTE_DE_CALLE", internalProcessName: "HABITANTES_CALLE", automaticValidationEnabled: true }
];

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function crearCarga({ raiz, proceso, idCarga, estado, fechaProcesamiento, filas }) {
  const base = path.join(raiz, proceso);
  const normalizado = path.join(base, "02_NORMALIZADO", `${idCarga}-normalizado.xlsx`);
  const validacion = path.join(base, "03_VALIDACION", `${idCarga}-validacion.json`);
  const historico = path.join(base, "04_HISTORICO", `${idCarga}-historico.json`);
  await Promise.all([
    fs.mkdir(path.dirname(normalizado), { recursive: true }),
    fs.mkdir(path.dirname(validacion), { recursive: true }),
    fs.mkdir(path.dirname(historico), { recursive: true })
  ]);
  const contenido = crearExcelBuffer(filas, "Normalizado");
  await fs.writeFile(normalizado, contenido);
  await fs.writeFile(validacion, JSON.stringify({ idCarga, estado, fechaProcesamiento, totalFilas: filas.length }));
  await fs.writeFile(historico, JSON.stringify({ idCarga, estado, fechaProcesamiento, totalFilas: filas.length }));
  return { normalizado, validacion, historico, contenido };
}

function filasPqrsd(total = 1) {
  return Array.from({ length: total }, (_, indice) => ({
    "No. PQRSD": `P-${indice + 1}`,
    "MEDIO DE LLEGADA": "WEB",
    "TIPO DE REQUERIMIENTO": "PETICION",
    COMUNA: "COMUNA 01 POPULAR",
    "ESTADO DEL TRAMITE": "EN TRAMITE"
  }));
}

test("reconstruye BI desde el normalizado VALIDADO más reciente y es repetible", async t => {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), "cit-bi-reconstruccion-"));
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const directorioBi = path.join(raiz, "CONTROL", "BI");

  const pqrsd = await crearCarga({
    raiz,
    proceso: "PQRSD",
    idCarga: "PQRSD-reciente",
    estado: "VALIDADO",
    fechaProcesamiento: "2026-10-08T19:04:05.899Z",
    filas: filasPqrsd(3)
  });
  await crearCarga({
    raiz,
    proceso: "PQRSD",
    idCarga: "PQRSD-observada-posterior",
    estado: "OBSERVADO",
    fechaProcesamiento: "2026-10-09T19:04:05.899Z",
    filas: [{ RAW: "no debe publicarse" }]
  });
  const habitantes = await crearCarga({
    raiz,
    proceso: "HABITANTE_DE_CALLE",
    idCarga: "HABITANTES_CALLE-reciente",
    estado: "VALIDADO",
    fechaProcesamiento: "2026-10-07T14:56:48.957Z",
    filas: [{ PERSONAS: 10 }, { PERSONAS: 20 }]
  });
  const historicosAntes = await Promise.all(
    [pqrsd.historico, habitantes.historico].map(async ruta => hash(await fs.readFile(ruta)))
  );

  const primera = await reconstruirBi({ raiz, directorioBi, procesos, logger: loggerSilencioso });
  assert.ok(primera.every(resultado => resultado.publicado));
  const destinos = [
    path.join(directorioBi, "PQRSD_actual.xlsx"),
    path.join(directorioBi, "HABITANTE_DE_CALLE_actual.xlsx")
  ];
  assert.deepEqual(await fs.readFile(destinos[0]), await fs.readFile(pqrsd.normalizado));
  assert.deepEqual(await fs.readFile(destinos[1]), await fs.readFile(habitantes.normalizado));
  const hashesPrimera = await Promise.all(destinos.map(async ruta => hash(await fs.readFile(ruta))));

  const segunda = await reconstruirBi({ raiz, directorioBi, procesos, logger: loggerSilencioso });
  assert.ok(segunda.every(resultado => resultado.publicado));
  assert.deepEqual(
    await Promise.all(destinos.map(async ruta => hash(await fs.readFile(ruta)))),
    hashesPrimera
  );
  assert.deepEqual(
    await Promise.all([pqrsd.historico, habitantes.historico].map(async ruta => hash(await fs.readFile(ruta)))),
    historicosAntes
  );
  assert.equal((await fs.readdir(directorioBi)).filter(nombre => nombre.endsWith(".tmp")).length, 0);
});

test("el procesamiento publica solo VALIDADO y nunca usa ni modifica el RAW", async t => {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), "cit-bi-proceso-"));
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = path.join(raiz, "PQRSD", "01_RAW");
  const directorioBi = path.join(raiz, "CONTROL", "BI");
  const rutaRegistro = path.join(raiz, "data", "processed-files.json");
  await fs.mkdir(raw, { recursive: true });
  const rutaRaw = path.join(raw, "01-valida.xlsx");
  await fs.writeFile(rutaRaw, crearExcelBuffer(filasPqrsd(2), "Datos"));
  const rawAntes = await fs.readFile(rutaRaw);

  const valida = await procesarCargasLocales({
    raiz,
    rutaRegistro,
    directorioBi,
    procesos: [procesos[0]],
    logger: loggerSilencioso
  });
  const destino = path.join(directorioBi, "PQRSD_actual.xlsx");
  assert.equal(valida.resultados[0].estado, "VALIDADO");
  assert.deepEqual(await fs.readFile(destino), await fs.readFile(valida.resultados[0].rutaNormalizado));
  assert.notDeepEqual(await fs.readFile(destino), await fs.readFile(rutaRaw));
  assert.deepEqual(await fs.readFile(rutaRaw), rawAntes);
  const biAntes = await fs.readFile(destino);

  await fs.writeFile(
    path.join(raw, "02-observada.xlsx"),
    crearExcelBuffer([{ COLUMNA_INCORRECTA: "dato" }], "Datos")
  );
  const observada = await procesarCargasLocales({
    raiz,
    rutaRegistro,
    directorioBi,
    procesos: [procesos[0]],
    logger: loggerSilencioso
  });
  assert.equal(observada.resultados[0].estado, "OBSERVADO");
  assert.deepEqual(await fs.readFile(destino), biAntes);
});

test("un fallo al publicar BI conserva VALIDADO y registra el error", async t => {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), "cit-bi-bloqueo-"));
  t.after(() => fs.rm(raiz, { recursive: true, force: true }));
  const raw = path.join(raiz, "PQRSD", "01_RAW");
  const bloqueo = path.join(raiz, "bloqueo");
  await fs.mkdir(raw, { recursive: true });
  await fs.writeFile(path.join(raw, "entrada.xlsx"), crearExcelBuffer(filasPqrsd(), "Datos"));
  await fs.writeFile(bloqueo, "impide crear el directorio BI");

  const ejecucion = await procesarCargasLocales({
    raiz,
    rutaRegistro: path.join(raiz, "data", "processed-files.json"),
    directorioBi: path.join(bloqueo, "BI"),
    procesos: [procesos[0]],
    logger: loggerSilencioso
  });
  assert.equal(ejecucion.resultados[0].estado, "VALIDADO");
  assert.ok(ejecucion.resultados[0].rutaNormalizado);
  const reporte = JSON.parse(await fs.readFile(ejecucion.resultados[0].rutaReporte, "utf8"));
  assert.equal(reporte.estado, "VALIDADO");
  assert.equal(reporte.detalle.publicacionBi.publicado, false);
  assert.ok(reporte.detalle.publicacionBi.error);
});
