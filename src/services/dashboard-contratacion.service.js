// INFERIDA_DESDE_PBIX: Dashboard de Contratación basado en análisis del tablero OBSERVATORIO.pbix

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

function contarPorCampo(filas, campo) {
  if (!campo) return 0;
  const valores = new Set();
  for (const fila of filas) {
    const valor = fila[campo];
    if (valor != null && String(valor).trim() !== "") {
      valores.add(String(valor).trim());
    }
  }
  return valores.size;
}

// INFERIDA_DESDE_PBIX: Agrupa por categoría y suma valores (Top 15)
function sumarPorCategoria(filas, campoCategoría, campoValor, limite = 15) {
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

// INFERIDA_DESDE_PBIX: Agrupa por categoría y cuenta registros (Top 15)
function contarPorCategoria(filas, campoCategoría, limite = 15) {
  if (!campoCategoría) return [];

  const conteo = new Map();
  for (const fila of filas) {
    const categoria = fila[campoCategoría];
    const etiqueta = categoria == null || String(categoria).trim() === "" ? "(VACÍO)" : String(categoria).trim();
    conteo.set(etiqueta, (conteo.get(etiqueta) || 0) + 1);
  }

  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria))
    .slice(0, limite);
}

export function crearDashboardContratacion({ filas, campos, sujetoDeControlSeleccionado = null }) {
  // INFERIDA_DESDE_PBIX: Si no hay filas, mostrar estado PENDIENTE
  if (!filas || filas.length === 0) {
    return {
      estado: "PENDIENTE",
      mensaje: "Pendiente cargar Excel RAW de Contratación",
      kpis: {
        numeroDeContratos: 0,
        valorTotalContratado: 0,
        valorPromedioPorContrato: 0
      },
      graficas: {
        topContratistas: [],
        topProcesoDeContratacion: [],
        topSujetoDeControl: [],
        topSectorDelProyecto: []
      },
      filtros: {
        sujetoDeControlDisponibles: []
      }
    };
  }

  // Aplicar filtro de Sujeto de Control si está seleccionado
  let filasFiltradasPorSujeto = filas;
  if (sujetoDeControlSeleccionado && campos.sujetoDeControl) {
    filasFiltradasPorSujeto = filas.filter(fila => {
      const valor = fila[campos.sujetoDeControl];
      return valor && String(valor).trim() === sujetoDeControlSeleccionado;
    });
  }

  // INFERIDA_DESDE_PBIX: KPI 1 - Número de Contratos (COUNT)
  const numeroDeContratos = filasFiltradasPorSujeto.length;

  // INFERIDA_DESDE_PBIX: KPI 2 - Valor Total Contratado (SUM)
  const valorTotalContratado = sumarPorCampo(filasFiltradasPorSujeto, campos.valorContratado);

  // INFERIDA_DESDE_PBIX: KPI 3 - Valor Promedio por Contrato (AVERAGE)
  const valorPromedioPorContrato = numeroDeContratos > 0
    ? parseFloat((valorTotalContratado / numeroDeContratos).toFixed(2))
    : 0;

  // INFERIDA_DESDE_PBIX: Obtener lista de Sujetos de Control disponibles (para filtro)
  const sujetosDeControlDisponibles = contarPorCategoria(filas, campos.sujetoDeControl, 999)
    .map(item => ({ valor: item.categoria, cantidad: item.total }))
    .sort((a, b) => a.valor.localeCompare(b.valor));

  return {
    estado: "VALIDADO",
    kpis: {
      numeroDeContratos,
      valorTotalContratado: parseFloat(valorTotalContratado.toFixed(2)),
      valorPromedioPorContrato,
      totalRegistrosEnFuente: filas.length
    },
    graficas: {
      // INFERIDA_DESDE_PBIX: Top 15 Contratistas (valor)
      topContratistas: sumarPorCategoria(filasFiltradasPorSujeto, campos.contratista, campos.valorContratado, 15),

      // INFERIDA_DESDE_PBIX: Top 15 Proceso de Contratación (valor)
      topProcesoDeContratacion: sumarPorCategoria(
        filasFiltradasPorSujeto,
        campos.procesoDeContratacion,
        campos.valorContratado,
        15
      ),

      // INFERIDA_DESDE_PBIX: Top 15 Sujeto de Control (valor + cantidad)
      topSujetoDeControl: filasFiltradasPorSujeto.length > 0
        ? sumarPorCategoria(filasFiltradasPorSujeto, campos.sujetoDeControl, campos.valorContratado, 15)
        : sumarPorCategoria(filas, campos.sujetoDeControl, campos.valorContratado, 15),

      // INFERIDA_DESDE_PBIX: Top 15 Sector del Proyecto (valor)
      topSectorDelProyecto: sumarPorCategoria(
        filasFiltradasPorSujeto,
        campos.sectorDelProyecto,
        campos.valorContratado,
        15
      )
    },
    filtros: {
      sujetoDeControlDisponibles,
      sujetoDeControlSeleccionado: sujetoDeControlSeleccionado || null
    }
  };
}
