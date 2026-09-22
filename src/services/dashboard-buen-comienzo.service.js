import { BUEN_COMIENZO_CATALOGOS } from "../catalogs/buenComienzo.catalog.js";

const REFERENCIA_OBSERVATORIO = {
  totalBeneficiarios: 221000,
  totalNinas: 110000,
  totalNinos: 112000,
  cobertura: 100,
  presupuestoAsignado: 3000000000000,
  tasaEjecucion: 52.1
};

function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function sumarPorCampo(filas, campo) {
  if (!campo) return 0;
  return filas.reduce((total, fila) => total + numero(fila[campo]), 0);
}

function etiqueta(valor) {
  return valor == null || String(valor).trim() === "" ? "(VACIO)" : String(valor).trim();
}

function sumarPorCategoria(filas, campoCategoria, campoValor, limite = 999) {
  if (!campoCategoria || !campoValor) return [];
  const conteo = new Map();
  for (const fila of filas) {
    const cat = etiqueta(fila[campoCategoria]);
    conteo.set(cat, (conteo.get(cat) || 0) + numero(fila[campoValor]));
  }
  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria))
    .slice(0, limite);
}

function sumarPresupuestoPorAnio(filas) {
  const datos = new Map();
  for (const fila of filas) {
    const anio = etiqueta(fila["AÑO"]);
    const actual = datos.get(anio) || { categoria: anio, asignado: 0, ejecutado: 0 };
    actual.asignado += numero(fila.VALOR_NORMALIZADO);
    actual.ejecutado += numero(fila.EJECUTADO_NORMALIZADO);
    datos.set(anio, actual);
  }
  return [...datos.values()].sort((a, b) => Number(a.categoria) - Number(b.categoria));
}

function crearComparacionObservatorio(kpis) {
  const comparar = (valorRaw, valorReferencia) => ({
    tipo: "REFERENCIA_OBSERVATORIO",
    valorRaw,
    valorReferencia,
    diferencia: valorRaw - valorReferencia,
    estado: Math.abs(valorRaw - valorReferencia) < 1 ? "COINCIDE" : "NO_COINCIDE"
  });

  return {
    totalBeneficiarios: comparar(kpis.totalBeneficiarios, REFERENCIA_OBSERVATORIO.totalBeneficiarios),
    totalNinas: comparar(kpis.totalNinas, REFERENCIA_OBSERVATORIO.totalNinas),
    totalNinos: comparar(kpis.totalNinos, REFERENCIA_OBSERVATORIO.totalNinos),
    cobertura: comparar(kpis.porcentajeComunasCubiertas, REFERENCIA_OBSERVATORIO.cobertura),
    presupuestoAsignado: comparar(kpis.presupuestoAsignado, REFERENCIA_OBSERVATORIO.presupuestoAsignado),
    tasaEjecucion: comparar(kpis.tasaEjecucion, REFERENCIA_OBSERVATORIO.tasaEjecucion),
    nota: "Referencia visual del observatorio. No se usa para forzar ni ajustar valores calculados desde el RAW."
  };
}

function resumenPorAnio(filas) {
  const datos = new Map();
  for (const fila of filas) {
    const anio = etiqueta(fila["AÑO"]);
    const actual = datos.get(anio) || {
      anio,
      filas: 0,
      total: 0,
      ninas: 0,
      ninos: 0,
      modalidades: new Set(),
      territorios: new Set(),
      sedes: new Set()
    };
    actual.filas++;
    actual.total += numero(fila.TOTAL_NORMALIZADO);
    actual.ninas += numero(fila["NIÑA_NORMALIZADA"]);
    actual.ninos += numero(fila["NIÑO_NORMALIZADO"]);
    if (fila.NOMBRE_MODALIDAD_NORMALIZADA) actual.modalidades.add(fila.NOMBRE_MODALIDAD_NORMALIZADA);
    if (fila.COMUNA_NORMALIZADA) actual.territorios.add(fila.COMUNA_NORMALIZADA);
    if (fila["NOMBRE_SEDE"]) actual.sedes.add(fila["NOMBRE_SEDE"]);
    datos.set(anio, actual);
  }

  return [...datos.values()].map(item => ({
    anio: item.anio,
    filas: item.filas,
    total: item.total,
    ninas: item.ninas,
    ninos: item.ninos,
    modalidades: [...item.modalidades].sort(),
    territorios: [...item.territorios].sort(),
    sedes: item.sedes.size
  })).sort((a, b) => Number(a.anio) - Number(b.anio));
}

function resumenPresupuestoPorAnio(filas) {
  const datos = new Map();
  for (const fila of filas) {
    const anio = etiqueta(fila["AÑO"]);
    const actual = datos.get(anio) || { anio, filas: 0, valor: 0, ejecutado: 0 };
    actual.filas++;
    actual.valor += numero(fila.VALOR_NORMALIZADO);
    actual.ejecutado += numero(fila.EJECUTADO_NORMALIZADO);
    datos.set(anio, actual);
  }
  return [...datos.values()].sort((a, b) => Number(a.anio) - Number(b.anio));
}

export function crearDashboardBuenComienzo({ hojas, validacion }) {
  const filasBenef = hojas.beneficiarios?.datosNormalizados || [];
  const filasPresup = hojas.presupuesto?.datosNormalizados || [];

  const totalNinas = sumarPorCampo(filasBenef, "NIÑA_NORMALIZADA");
  const totalNinos = sumarPorCampo(filasBenef, "NIÑO_NORMALIZADO");
  const totalBeneficiarios = sumarPorCampo(filasBenef, "TOTAL_NORMALIZADO");

  const comunas = new Set();
  const corregimientos = new Set();
  const sinTerritorio = [];

  for (const fila of filasBenef) {
    if (numero(fila.TOTAL_NORMALIZADO) <= 0) continue;
    if (fila.TIPO_TERRITORIO === "COMUNA") comunas.add(fila.COMUNA_NORMALIZADA);
    else if (fila.TIPO_TERRITORIO === "CORREGIMIENTO") corregimientos.add(fila.COMUNA_NORMALIZADA);
    else if (!fila.COMUNA_NORMALIZADA) sinTerritorio.push(fila);
  }

  const territoriosCubiertos = comunas.size + corregimientos.size;
  const universo = BUEN_COMIENZO_CATALOGOS.universoTerritorial;
  const porcentajeComunasCubiertas = universo.total
    ? parseFloat(((territoriosCubiertos / universo.total) * 100).toFixed(2))
    : 0;

  const presupuestoAsignado = sumarPorCampo(filasPresup, "VALOR_NORMALIZADO");
  const presupuestoEjecutado = sumarPorCampo(filasPresup, "EJECUTADO_NORMALIZADO");
  const tasaEjecucion = presupuestoAsignado > 0
    ? parseFloat(((presupuestoEjecutado / presupuestoAsignado) * 100).toFixed(2))
    : 0;

  const kpis = {
    totalBeneficiarios,
    totalNinas,
    totalNinos,
    totalNiñas: totalNinas,
    totalNiños: totalNinos,
    comunasCubiertas: comunas.size,
    corregimientosCubiertos: corregimientos.size,
    territoriosCubiertos,
    registrosSinTerritorio: sinTerritorio.length,
    denominadorTerritorial: universo.total,
    porcentajeComunasCubiertas,
    porcentajeComunas: porcentajeComunasCubiertas,
    presupuestoAsignado,
    presupuestoEjecutado,
    tasaEjecucion
  };

  const beneficiariosPorAnio = sumarPorCategoria(filasBenef, "AÑO", "TOTAL_NORMALIZADO");
  const presupuestoPorAnio = sumarPresupuestoPorAnio(filasPresup);

  return {
    kpis,
    graficas: {
      beneficiariosPorModalidad: sumarPorCategoria(filasBenef, "NOMBRE_MODALIDAD_NORMALIZADA", "TOTAL_NORMALIZADO"),
      beneficiariosPorComuna: sumarPorCategoria(filasBenef, "COMUNA_NORMALIZADA", "TOTAL_NORMALIZADO"),
      beneficiariosPorSexo: [
        { categoria: "Niñas", total: totalNinas },
        { categoria: "Niños", total: totalNinos }
      ],
      beneficiariosPorAño: beneficiariosPorAnio,
      beneficiariosPorSede: sumarPorCategoria(filasBenef, "NOMBRE_SEDE", "TOTAL_NORMALIZADO", 30),
      presupuestoPorAño: presupuestoPorAnio,
      presupuestoPorProyecto: sumarPorCategoria(filasPresup, "PROYECTO_NORMALIZADO", "VALOR_NORMALIZADO", 30)
    },
    integridad: {
      beneficiariosPorAnio: resumenPorAnio(filasBenef),
      presupuestoPorAnio: resumenPresupuestoPorAnio(filasPresup),
      sumaModalidades: sumarPorCategoria(filasBenef, "NOMBRE_MODALIDAD_NORMALIZADA", "TOTAL_NORMALIZADO")
        .reduce((acc, item) => acc + item.total, 0),
      sumaTerritorios: sumarPorCategoria(filasBenef, "COMUNA_NORMALIZADA", "TOTAL_NORMALIZADO")
        .reduce((acc, item) => acc + item.total, 0),
      notaTotalSexo: "No se fuerza TOTAL = NIÑA + NIÑO; se reportan ambas sumas desde el RAW."
    },
    territorio: {
      comunasCubiertas: [...comunas].sort(),
      corregimientosCubiertos: [...corregimientos].sort(),
      territoriosCubiertos,
      denominador: universo.total,
      denominadorDetalle: universo.nota,
      registrosSinTerritorio: sinTerritorio.length
    },
    comparacionObservatorio: crearComparacionObservatorio(kpis),
    notaCorte: "Los valores calculados salen del RAW cargado. Este archivo contiene beneficiarios 2024-2026 y presupuesto 2019-2026."
  };
}
