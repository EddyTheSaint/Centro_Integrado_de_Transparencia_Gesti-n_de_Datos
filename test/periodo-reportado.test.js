import test from "node:test";
import assert from "node:assert/strict";
import { extraerPeriodoDesdeNombreArchivo } from "../src/utils/periodo-reportado.js";

test("extrae YYYY-MM de un nombre con fecha válida", () => {
  assert.equal(
    extraerPeriodoDesdeNombreArchivo("2026-10-15_BD_BUEN_COMIENZO_MAYO.xlsx"),
    "2026-10"
  );
});

test("devuelve null cuando el nombre no tiene fecha al inicio", () => {
  assert.equal(extraerPeriodoDesdeNombreArchivo("archivo.xlsx"), null);
});

test("devuelve null para una fecha calendario inválida", () => {
  assert.equal(extraerPeriodoDesdeNombreArchivo("2026-02-30_archivo.xlsx"), null);
});

test("requiere el formato exacto YYYY-MM-DD_", () => {
  assert.equal(extraerPeriodoDesdeNombreArchivo("2026-10-15-archivo.xlsx"), null);
  assert.equal(extraerPeriodoDesdeNombreArchivo("26-10-15_archivo.xlsx"), null);
});
