function numero(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function sumarPorCampo(filas, campo) {
  if (!campo) return 0;
  return filas.reduce((total, fila) => total + numero(fila[campo]), 0);
}

function sumarPorCategoria(filas, campoCategoria, campoValor, limite = 999) {
  if (!campoCategoria || !campoValor) return [];
  const conteo = new Map();

  for (const fila of filas) {
    const categoria = fila[campoCategoria] == null || String(fila[campoCategoria]).trim() === ""
      ? "(VACIO)"
      : String(fila[campoCategoria]).trim();
    conteo.set(categoria, (conteo.get(categoria) || 0) + numero(fila[campoValor]));
  }

  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria, "es", { numeric: true }))
    .slice(0, limite);
}

function sumarPorDosCategorias(filas, campo1, campo2, campoValor) {
  if (!campo1 || !campo2 || !campoValor) return [];
  const conteo = new Map();

  for (const fila of filas) {
    const categoria1 = fila[campo1] == null || String(fila[campo1]).trim() === "" ? "(VACIO)" : String(fila[campo1]).trim();
    const categoria2 = fila[campo2] == null || String(fila[campo2]).trim() === "" ? "(VACIO)" : String(fila[campo2]).trim();
    const clave = `${categoria1}|||${categoria2}`;
    conteo.set(clave, (conteo.get(clave) || 0) + numero(fila[campoValor]));
  }

  return [...conteo.entries()]
    .map(([clave, total]) => {
      const [categoria1, categoria2] = clave.split("|||");
      return { categoria1, categoria2, total: Number(total.toFixed(2)) };
    })
    .sort((a, b) => b.total - a.total || a.categoria1.localeCompare(b.categoria1, "es", { numeric: true }));
}

export function crearDashboardEnvejecimientoVejez({ filas, campos }) {
  const totalPersonasAtendidas = sumarPorCampo(filas, campos.cantidad);
  const presupuestoTotal = sumarPorCampo(filas, campos.presupuesto);

  return {
    estado: "VALIDADO",
    kpis: {
      totalPersonasAtendidas,
      presupuestoTotal: Number(presupuestoTotal.toFixed(2)),
      totalRegistrosEnFuente: filas.length
    },
    graficas: {
      presupuestoPorAno: sumarPorCategoria(filas, campos.ano, campos.presupuesto),
      personasPorComuna: sumarPorCategoria(filas, campos.comuna, campos.cantidad),
      personasPorRangoEdadSexo: sumarPorDosCategorias(filas, campos.rangoDeEdades, campos.sexo, campos.cantidad),
      personasPorSexo: sumarPorCategoria(filas, campos.sexo, campos.cantidad)
    }
  };
}
