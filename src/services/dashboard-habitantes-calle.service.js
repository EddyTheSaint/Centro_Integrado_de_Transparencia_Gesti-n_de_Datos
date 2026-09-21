// Dashboard de Habitantes de Calle basado en RAW real
// BD_HABITANTE_CALLE_MAYO.xlsx

const TOTAL_RAW_CONTROL = 240960;
const TOTAL_TABLERO_INSTITUCIONAL = 242986;
const RAW_NO_SE_SABE = 11891;
const TABLERO_NO_SE_SABE = 13917;

function sumarPorCampo(filas, campo) {
  if (!campo) return 0;
  let suma = 0;
  for (const fila of filas) {
    const valor = fila[campo];
    if (valor != null) {
      const numerico = Number(valor);
      if (!isNaN(numerico)) suma += numerico;
    }
  }
  return suma;
}

function sumarPorCategoria(filas, campoCategoria, campoValor, limite = 999) {
  if (!campoCategoria || !campoValor) return [];

  const conteo = new Map();
  for (const fila of filas) {
    const categoria = fila[campoCategoria];
    const etiqueta = categoria == null || String(categoria).trim() === "" ? "(VACIO)" : String(categoria).trim();
    const valor = Number(fila[campoValor]) || 0;
    conteo.set(etiqueta, (conteo.get(etiqueta) || 0) + valor);
  }

  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria))
    .slice(0, limite);
}

function agruparPorDosCategoriasYSumar(filas, campo1, campo2, campoValor) {
  if (!campo1 || !campo2 || !campoValor) return [];

  const datos = new Map();
  for (const fila of filas) {
    const cat1 = fila[campo1] == null ? "(VACIO)" : String(fila[campo1]).trim();
    const cat2 = fila[campo2] == null ? "(VACIO)" : String(fila[campo2]).trim();
    const clave = `${cat1}|||${cat2}`;
    const valor = Number(fila[campoValor]) || 0;
    datos.set(clave, (datos.get(clave) || 0) + valor);
  }

  return [...datos.entries()]
    .map(([clave, total]) => {
      const [cat1, cat2] = clave.split("|||");
      return { categoria1: cat1, categoria2: cat2, total };
    })
    .sort((a, b) => b.total - a.total);
}

export function crearDashboardHabitantesCalle({ filas, campos, validacion }) {
  if (!filas || filas.length === 0) {
    return {
      estado: "PENDIENTE",
      mensaje: "Pendiente cargar Excel RAW de Habitantes de Calle",
      dashboardNormalizado: {
        kpis: {
          totalPersonasAtendidas: 0,
          presupuestoTotal: 0
        },
        graficas: {
          presupuestoPorAño: [],
          presupuestoPorProyecto: [],
          personasPorComponenteYSede: [],
          personasPorEdadYSexo: []
        }
      },
      dashboardInstitucional: {
        kpis: {
          totalPersonasAtendidas: 0,
          presupuestoTotal: 0
        },
        graficas: {
          presupuestoPorAño: [],
          presupuestoPorProyecto: [],
          personasPorComponenteYSede: [],
          personasPorEdadYSexo: []
        }
      },
      advertencias: [],
      validacionIntegridadRaw: {
        actual: 0,
        esperado: TOTAL_RAW_CONTROL,
        estado: "PENDIENTE"
      },
      comparacionInstitucional: {
        actual: 0,
        referencia: TOTAL_TABLERO_INSTITUCIONAL,
        diferencia: -TOTAL_TABLERO_INSTITUCIONAL,
        noSeSabe: {
          raw: 0,
          tablero: TABLERO_NO_SE_SABE,
          diferencia: -TABLERO_NO_SE_SABE
        }
      }
    };
  }

  const totalPersonasAtendidas = sumarPorCampo(filas, campos.cantidad);
  const presupuestoTotal = sumarPorCampo(filas, campos.presupuesto);
  const advertencias = [];

  const rangosTotales = {
    "18 A 28 AÑOS": 0,
    "29 A 59 AÑOS": 0,
    "60 AÑOS O MAS": 0,
    "EDAD DESCONOCIDA": 0,
    "NO SE SABE": 0
  };

  if (campos.rangosDeEdades) {
    for (const fila of filas) {
      const rango = String(fila[campos.rangosDeEdades] || "").trim();
      const cantidad = Number(fila[campos.cantidad]) || 0;

      if (rango in rangosTotales) {
        rangosTotales[rango] += cantidad;
      }
    }
  }

  const valoresEsperadosPorRango = {
    "18 A 28 AÑOS": 41925,
    "29 A 59 AÑOS": 150668,
    "60 AÑOS O MAS": 20362,
    "EDAD DESCONOCIDA": 16114,
    "NO SE SABE": RAW_NO_SE_SABE
  };

  let sumaRangos = 0;
  let discrepanciasRangos = [];
  for (const [rango, esperado] of Object.entries(valoresEsperadosPorRango)) {
    const actual = rangosTotales[rango] || 0;
    sumaRangos += actual;
    if (actual !== esperado) {
      discrepanciasRangos.push({
        rango,
        esperado,
        actual,
        diferencia: actual - esperado
      });
    }
  }

  const validacionIntegridadRaw = {
    actual: totalPersonasAtendidas,
    esperado: TOTAL_RAW_CONTROL,
    estado: totalPersonasAtendidas === TOTAL_RAW_CONTROL ? "COINCIDE" : "NO_COINCIDE",
    diferencia: totalPersonasAtendidas - TOTAL_RAW_CONTROL
  };

  const comparacionInstitucional = {
    actual: totalPersonasAtendidas,
    referencia: TOTAL_TABLERO_INSTITUCIONAL,
    diferencia: totalPersonasAtendidas - TOTAL_TABLERO_INSTITUCIONAL,
    noSeSabe: {
      raw: RAW_NO_SE_SABE,
      tablero: TABLERO_NO_SE_SABE,
      diferencia: RAW_NO_SE_SABE - TABLERO_NO_SE_SABE
    }
  };

  if (validacionIntegridadRaw.estado !== "COINCIDE") {
    advertencias.push({
      regla: "HC-INTEGRIDAD-RAW",
      tipo: "error",
      mensaje: `Integridad del archivo RAW no coincide: esperado ${TOTAL_RAW_CONTROL.toLocaleString("es-ES")}, obtenido ${totalPersonasAtendidas.toLocaleString("es-ES")}.`
    });
  }

  if (comparacionInstitucional.diferencia !== 0) {
    advertencias.push({
      regla: "HC-COMPARACION-INSTITUCIONAL",
      tipo: "informacion",
      mensaje: `Comparacion institucional: referencia ${TOTAL_TABLERO_INSTITUCIONAL.toLocaleString("es-ES")}, RAW actual ${totalPersonasAtendidas.toLocaleString("es-ES")}, diferencia ${comparacionInstitucional.diferencia.toLocaleString("es-ES")}.`
    });
  }

  if (discrepanciasRangos.length > 0) {
    for (const disc of discrepanciasRangos) {
      advertencias.push({
        regla: "HC-RANGO-DISCREPANCIA",
        tipo: "error",
        mensaje: `Rango "${disc.rango}": esperado ${disc.esperado}, obtenido ${disc.actual} (diferencia: ${disc.diferencia > 0 ? "+" : ""}${disc.diferencia})`
      });
    }
  }

  const presupuestoPorAño = sumarPorCategoria(filas, campos.año, campos.presupuesto);
  const presupuestoPorProyecto = sumarPorCategoria(
    filas,
    campos.nombreProyecto,
    campos.presupuesto,
    20
  );

  const personasPorComponenteYSede = agruparPorDosCategoriasYSumar(
    filas,
    campos.componente,
    campos.sedeDeAtencion,
    campos.cantidad
  ).slice(0, 30);

  const personasPorEdadYSexo = agruparPorDosCategoriasYSumar(
    filas,
    campos.rangosDeEdades,
    campos.sexo,
    campos.cantidad
  );

  if (campos.rangosDeEdades) {
    const noSabeValues = filas.filter(f => {
      const rango = String(f[campos.rangosDeEdades] || "").trim();
      return rango === "NO SE SABE" || rango === "No se sabe";
    });

    if (noSabeValues.length > 0) {
      const cantidadNoSabe = sumarPorCampo(noSabeValues, campos.cantidad);
      advertencias.push({
        regla: "HC-RANGO-NO-SABE-DETECTADO",
        tipo: "informacion",
        mensaje: `Registros en categoria "NO SE SABE": ${noSabeValues.length} filas, ${cantidadNoSabe.toLocaleString("es-ES")} personas.`
      });
    }
  }

  const dashboardNormalizado = {
    kpis: {
      totalPersonasAtendidas,
      presupuestoTotal: parseFloat(presupuestoTotal.toFixed(2)),
      totalRegistrosEnFuente: filas.length
    },
    graficas: {
      presupuestoPorAño: presupuestoPorAño.sort((a, b) => {
        const aNum = Number(a.categoria);
        const bNum = Number(b.categoria);
        return aNum - bNum;
      }),
      presupuestoPorProyecto,
      personasPorComponenteYSede,
      personasPorEdadYSexo
    }
  };

  const dashboardInstitucional = {
    kpis: {
      totalPersonasAtendidas,
      presupuestoTotal: parseFloat(presupuestoTotal.toFixed(2)),
      totalRegistrosEnFuente: filas.length
    },
    graficas: {
      presupuestoPorAño: presupuestoPorAño.sort((a, b) => {
        const aNum = Number(a.categoria);
        const bNum = Number(b.categoria);
        return aNum - bNum;
      }),
      presupuestoPorProyecto: sumarPorCategoria(filas, "_PROYECTO_ORIGINAL", campos.presupuesto, 20),
      personasPorComponenteYSede: agruparPorDosCategoriasYSumar(filas, "_COMPONENTE_ORIGINAL", "_SEDE_ORIGINAL", campos.cantidad).slice(0, 30),
      personasPorEdadYSexo: agruparPorDosCategoriasYSumar(filas, "_RANGOS_EDADES_ORIGINAL", "_SEXO_ORIGINAL", campos.cantidad)
    }
  };

  return {
    estado: "VALIDADO",
    dashboardNormalizado,
    dashboardInstitucional,
    advertencias,
    validacionIntegridadRaw,
    comparacionInstitucional,
    diagnostico: {
      diferencia: comparacionInstitucional.diferencia,
      diferenciaPorcentaje: parseFloat((Math.abs(comparacionInstitucional.diferencia) / TOTAL_TABLERO_INSTITUCIONAL * 100).toFixed(2)),
      mensaje: comparacionInstitucional.diferencia !== 0
        ? `${Math.abs(comparacionInstitucional.diferencia)} personas de diferencia frente a referencia institucional (concentradas en NO SE SABE)`
        : "Datos coinciden con referencia institucional"
    }
  };
}
