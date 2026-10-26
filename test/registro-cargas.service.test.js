import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as XLSX from "xlsx";
import { crearExcelBuffer } from "../src/services/excel.service.js";
import { procesarCargasLocales } from "../src/services/cargas-locales.service.js";
import {
  actualizarRegistroCarga,
  COLUMNAS_REGISTRO_CARGAS,
  convertirRegistroACsv,
  reconstruirRegistroCargas,
  resumirRegistroCargas
} from "../src/services/registro-cargas.service.js";
import cargasLocalesRouter from "../src/routes/cargas-locales.routes.js";

const loggerSilencioso = { log() {}, error() {} };

async function entornoTemporal() {
  const raiz = await fs.mkdtemp(path.join(os.tmpdir(), "cit-registro-cargas-"));
  const data = path.join(raiz, "data");
  return {
    raiz,
    procesados: path.join(data, "processed-files.json"),
    csv: path.join(data, "registro-cargas.csv"),
    json: path.join(data, "registro-cargas.json")
  };
}

function excelPqrsd() {
  return crearExcelBuffer([{
    "No. PQRSD": "P-1",
    "MEDIO DE LLEGADA": "WEB",
    "TIPO DE REQUERIMIENTO": "PETICION",
    COMUNA: "COMUNA 01 POPULAR",
    "ESTADO DEL TRAMITE": "EN TRAMITE"
  }], "Datos");
}

test("actualiza por idCarga sin duplicar y resume los estados soportados", async t => {
  const entorno = await entornoTemporal();
  t.after(() => fs.rm(entorno.raiz, { recursive: true, force: true }));
  const opciones = { rutaCsv: entorno.csv, rutaJson: entorno.json };
  const base = {
    idCarga: "PQRSD-1",
    proceso: "PQRSD",
    archivoOriginal: "archivo, con \"comillas\".xlsx",
    fechaProcesamiento: "2026-10-08T10:00:00.000Z",
    estado: "PENDIENTE_VALIDACION",
    procesado: true
  };

  await actualizarRegistroCarga(base, opciones);
  const cargas = await actualizarRegistroCarga({ ...base, estado: "VALIDADO", totalFilas: 7 }, opciones);
  assert.equal(cargas.length, 1);
  assert.equal(cargas[0].estado, "VALIDADO");
  assert.equal(cargas[0].totalFilas, 7);
  assert.deepEqual(
    await fs.readFile(path.join(path.dirname(entorno.csv), "CONTROL", "registro-cargas.csv")),
    await fs.readFile(entorno.csv)
  );
  assert.deepEqual(
    await fs.readFile(path.join(path.dirname(entorno.json), "CONTROL", "registro-cargas.json")),
    await fs.readFile(entorno.json)
  );
  assert.deepEqual(resumirRegistroCargas(cargas), {
    totalCargas: 1,
    validadas: 1,
    observadas: 0,
    pendientes: 0,
    errores: 0
  });
});

test("genera CSV UTF-8 válido con BOM, CRLF y escape de comas, comillas y saltos", () => {
  const archivoOriginal = "línea 1, \"dato\"\nlínea 2.xlsx";
  const csv = convertirRegistroACsv([{
    idCarga: "ID-1",
    proceso: "PQRSD",
    archivoOriginal,
    estado: "VALIDADO",
    procesado: true
  }]);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.match(csv, /\r\n/);
  assert.match(csv, /"línea 1, ""dato""\nlínea 2\.xlsx"/);

  const libro = XLSX.read(csv.slice(1), { type: "string" });
  const filas = XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { defval: null });
  assert.deepEqual(Object.keys(filas[0]), COLUMNAS_REGISTRO_CARGAS);
  assert.equal(filas[0].archivoOriginal, archivoOriginal);
});

test("reconstruye desde processed-files, validación e histórico sin leer ni reprocesar RAW", async t => {
  const entorno = await entornoTemporal();
  t.after(() => fs.rm(entorno.raiz, { recursive: true, force: true }));
  const raw = path.join(entorno.raiz, "PQRSD", "01_RAW");
  await fs.mkdir(raw, { recursive: true });
  await fs.writeFile(path.join(raw, "entrada.xlsx"), excelPqrsd());
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const ejecucion = await procesarCargasLocales({
    raiz: entorno.raiz,
    rutaRegistro: entorno.procesados,
    rutaRegistroCargasCsv: entorno.csv,
    rutaRegistroCargasJson: entorno.json,
    procesos,
    logger: loggerSilencioso
  });
  const rawAntes = await fs.readFile(path.join(raw, "entrada.xlsx"));
  const historicoAntiguo = path.join(entorno.raiz, "storage", "cargas", "ANTIGUA-1");
  await fs.mkdir(historicoAntiguo, { recursive: true });
  await fs.writeFile(path.join(historicoAntiguo, "historico.json"), JSON.stringify({
    idCarga: "ANTIGUA-1",
    proceso: "PQRSD",
    archivo: "antigua.xlsx",
    estado: "VALIDADO",
    total_registros: 99,
    registrado_en: "2025-01-01T00:00:00.000Z"
  }));
  await fs.rm(entorno.csv);
  await fs.rm(entorno.json);

  const cargas = await reconstruirRegistroCargas({
    raiz: entorno.raiz,
    rutaProcesados: entorno.procesados,
    procesos,
    rutaCsv: entorno.csv,
    rutaJson: entorno.json
  });
  assert.equal(cargas.length, 1);
  assert.ok(!cargas.some(carga => carga.idCarga === "ANTIGUA-1"));
  assert.equal(cargas[0].idCarga, ejecucion.resultados[0].idCarga);
  assert.equal(cargas[0].totalFilas, 1);
  assert.equal(cargas[0].estado, "VALIDADO");
  assert.ok(cargas[0].rutaValidacion);
  assert.ok(cargas[0].rutaHistorico);
  assert.deepEqual(await fs.readFile(path.join(raw, "entrada.xlsx")), rawAntes);
  assert.deepEqual(
    await fs.readFile(path.join(path.dirname(entorno.csv), "CONTROL", "registro-cargas.csv")),
    await fs.readFile(entorno.csv)
  );
});

test("un fallo del consolidado no elimina ni invalida las salidas generadas", async t => {
  const entorno = await entornoTemporal();
  t.after(() => fs.rm(entorno.raiz, { recursive: true, force: true }));
  const raw = path.join(entorno.raiz, "PQRSD", "01_RAW");
  await fs.mkdir(raw, { recursive: true });
  await fs.writeFile(path.join(raw, "entrada.xlsx"), excelPqrsd());
  const bloqueo = path.join(entorno.raiz, "no-es-directorio");
  await fs.writeFile(bloqueo, "bloqueo");
  const procesos = [{ folderName: "PQRSD", internalProcessName: "PQRSD", automaticValidationEnabled: true }];

  const ejecucion = await procesarCargasLocales({
    raiz: entorno.raiz,
    rutaRegistro: entorno.procesados,
    rutaRegistroCargasCsv: path.join(bloqueo, "registro.csv"),
    rutaRegistroCargasJson: path.join(bloqueo, "registro.json"),
    procesos,
    logger: loggerSilencioso
  });
  assert.equal(ejecucion.procesados, 1);
  assert.equal(ejecucion.resultados[0].estado, "VALIDADO");
  assert.equal((await fs.readdir(path.join(entorno.raiz, "PQRSD", "03_VALIDACION"))).length, 1);
  assert.equal((await fs.readdir(path.join(entorno.raiz, "PQRSD", "04_HISTORICO"))).length, 1);
});

test("expone GET /registro y la interfaz contiene resumen y últimas cargas", async () => {
  const rutas = cargasLocalesRouter.stack
    .filter(capa => capa.route)
    .map(capa => ({ path: capa.route.path, methods: capa.route.methods }));
  assert.ok(rutas.some(ruta => ruta.path === "/registro" && ruta.methods.get));

  const html = await fs.readFile(path.resolve("public", "index.html"), "utf8");
  for (const texto of ["Total cargas", "Validadas", "Observadas", "Pendientes", "Errores", "&Uacute;ltimas cargas"]) {
    assert.ok(html.includes(texto), `Falta ${texto} en la interfaz`);
  }
  assert.ok(html.includes("/api/cargas-locales/registro"));
});
