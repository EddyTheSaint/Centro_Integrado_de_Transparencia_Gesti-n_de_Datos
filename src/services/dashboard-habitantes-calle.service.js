// Dashboard de Habitantes de Calle basado en RAW real
// BD_HABITANTE_CALLE_MAYO.xlsx

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

// Agrupa por una o dos categorías y suma valores
function sumarPorCategoria(filas, campoCategoría, campoValor, limite = 999) {
  if (!campoCategoría || !campoValor) return [];

  const conteo = new Map();
  for (const fila of filas) {
    const categoria = fila[campoCategoría];
    const etiqueta = categoria == null || String(categoria).trim() === "" ? "(VACÍO)" : String(categoria).trim();
    const valor = Number(fila[campoValor]) || 0;
    conteo.set(etiqueta, (conteo.get(etiqueta) || 0) + valor);
  }

  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria))
    .slice(0, limite);
}

// Agrupa por dos categorías y suma cantidades
function agruparPorDosCategoriasYSumar(filas, campo1, campo2, campoValor) {
  if (!campo1 || !campo2 || !campoValor) return [];

  const datos = new Map();
  for (const fila of filas) {
    const cat1 = fila[campo1] == null ? "(VACÍO)" : String(fila[campo1]).trim();
    const cat2 = fila[campo2] == null ? "(VACÍO)" : String(fila[campo2]).trim();
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
      advertencias: []
    };
  }

  // KPIs
  const totalPersonasAtendidas = sumarPorCampo(filas, campos.cantidad);
  const presupuestoTotal = sumarPorCampo(filas, campos.presupuesto);

  // Validación contra valores de control
  const advertencias = [];

  // ASSERT: Verificar totales por rango de edad
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

  // Valores esperados (para verificar integridad de datos)
  const valoresEsperadosPorRango = {
    "18 A 28 AÑOS": 41925,
    "29 A 59 AÑOS": 150668,
    "60 AÑOS O MAS": 20362,
    "EDAD DESCONOCIDA": 16114,
    "NO SE SABE": 11891
  };

  // Verificar que sumen exactamente 240960
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

  // Diferencia total contra tablero institucional
  const cantidadEsperada = 240960;
  const diferencia = totalPersonasAtendidas - cantidadEsperada;

  if (Math.abs(diferencia) > 0) {
    advertencias.push({
      regla: "HC-DIFERENCIA-TABLERO",
      tipo: "información",
      mensaje: `Diferencia contra tablero institucional: ${Math.abs(diferencia)} registros concentrada en categoría NO SE SABE. Esperado: ${cantidadEsperada.toLocaleString('es-ES')}, Obtenido: ${totalPersonasAtendidas.toLocaleString('es-ES')}.`
    });
  }

  // Reportar discrepancias en rangos si las hay
  if (discrepanciasRangos.length > 0) {
    for (const disc of discrepanciasRangos) {
      advertencias.push({
        regla: "HC-RANGO-DISCREPANCIA",
        tipo: "error",
        mensaje: `Rango "${disc.rango}": esperado ${disc.esperado}, obtenido ${disc.actual} (diferencia: ${disc.diferencia > 0 ? '+' : ''}${disc.diferencia})`
      });
    }
  }

  // Presupuesto por año
  const presupuestoPorAño = sumarPorCategoria(filas, campos.año, campos.presupuesto);

  // Presupuesto por proyecto (Top 20)
  const presupuestoPorProyecto = sumarPorCategoria(
    filas,
    campos.nombreProyecto,
    campos.presupuesto,
    20
  );

  // Personas atendidas por componente y sede
  const personasPorComponenteYSede = agruparPorDosCategoriasYSumar(
    filas,
    campos.componente,
    campos.sedeDeAtencion,
    campos.cantidad
  ).slice(0, 30); // Top 30 combinaciones

  // Personas atendidas por rango de edades y sexo
  const personasPorEdadYSexo = agruparPorDosCategoriasYSumar(
    filas,
    campos.rangosDeEdades,
    campos.sexo,
    campos.cantidad
  );

  // Detección de valores en categoría NO SE SABE
  if (campos.rangosDeEdades) {
    const noSabeValues = filas.filter(f => {
      const rango = String(f[campos.rangosDeEdades] || "").trim();
      return rango === "NO SE SABE" || rango === "No se sabe";
    });

    if (noSabeValues.length > 0) {
      const cantidadNoSabe = sumarPorCampo(noSabeValues, campos.cantidad);
      advertencias.push({
        regla: "HC-RANGO-NO-SABE-DETECTADO",
        tipo: "información",
        mensaje: `Registros en categoría "NO SE SABE": ${noSabeValues.length} filas, ${cantidadNoSabe.toLocaleString('es-ES')} personas.`
      });
    }
  }

  // DASHBOARD NORMALIZADO (con normalizaciones aplicadas)
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

  // DASHBOARD INSTITUCIONAL (usando valores originales, sin normalizar)
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
      presupuestoPorProyecto: sumarPorCategoria(filas, '_PROYECTO_ORIGINAL', campos.presupuesto, 20),
      personasPorComponenteYSede: agruparPorDosCategoriasYSumar(filas, '_COMPONENTE_ORIGINAL', '_SEDE_ORIGINAL', campos.cantidad).slice(0, 30),
      personasPorEdadYSexo: agruparPorDosCategoriasYSumar(filas, '_RANGOS_EDADES_ORIGINAL', '_SEXO_ORIGINAL', campos.cantidad)
    }
  };

  return {
    estado: "VALIDADO",
    dashboardNormalizado,
    dashboardInstitucional,
    advertencias,
    diagnostico: {
      diferencia: diferencia,
      diferenciaPorcentaje: parseFloat((Math.abs(diferencia) / cantidadEsperada * 100).toFixed(2)),
      mensaje: Math.abs(diferencia) > 0
        ? `${Math.abs(diferencia)} personas faltantes (concentradas en NO SE SABE)`
        : "Datos completos"
    }
  };
}
