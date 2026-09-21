function sumarPorCampo(filas, campo) {
  let suma = 0;
  for (const fila of filas) {
    let valor = fila[campo];
    if (valor != null) {
      valor = String(valor).replace(/[$ ,]/g, '').trim();
      valor = Number(valor);
      if (!isNaN(valor)) suma += valor;
    }
  }
  return suma;
}

function sumarPorCategoría(filas, campoCategoría, campoValor) {
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
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria));
}

export function crearDashboardBuenComienzo({ hojas, validacion }) {
  const filasbenef = hojas.beneficiarios?.datosNormalizados || [];
  const filasPresup = hojas.presupuesto?.datosNormalizados || [];

  const camposBenef = validacion.hojas.beneficiarios?.campos || {};
  const camposPresup = validacion.hojas.presupuesto?.campos || {};

  // KPIs de Beneficiarios
  const totalNiñas = sumarPorCampo(filasbenef, camposBenef.niña);
  const totalNiños = sumarPorCampo(filasbenef, camposBenef.niño);
  const totalBeneficiarios = sumarPorCampo(filasbenef, camposBenef.total);

  let comunasCubiertas = 0;
  if (camposBenef.comuna) {
    const comunasConBenef = new Set();
    for (const fila of filasbenef) {
      const comuna = fila[camposBenef.comuna];
      if (comuna != null && String(comuna).trim() !== "") {
        const total = Number(fila[camposBenef.total]) || 0;
        if (total > 0) {
          comunasConBenef.add(String(comuna).trim());
        }
      }
    }
    comunasCubiertas = comunasConBenef.size;
  }

  const porcentajeComunas = comunasCubiertas > 0 ? parseFloat(((comunasCubiertas / 16) * 100).toFixed(2)) : 0;

  // KPIs de Presupuesto
  const presupuestoAsignado = sumarPorCampo(filasPresup, camposPresup.valor);
  const presupuestoEjecutado = sumarPorCampo(filasPresup, camposPresup.ejecutado);
  const tasaEjecucion = presupuestoAsignado > 0
    ? parseFloat(((presupuestoEjecutado / presupuestoAsignado) * 100).toFixed(2))
    : 0;

  return {
    kpis: {
      totalBeneficiarios,
      totalNiñas,
      totalNiños,
      comunasCubiertas,
      porcentajeComunas,
      presupuestoAsignado,
      presupuestoEjecutado,
      tasaEjecucion
    },
    graficas: {
      beneficiariosPorModalidad: camposBenef.modalidad
        ? sumarPorCategoría(filasbenef, camposBenef.modalidad, camposBenef.total)
        : [],
      beneficiariosPorComuna: camposBenef.comuna
        ? sumarPorCategoría(filasbenef, camposBenef.comuna, camposBenef.total)
        : [],
      beneficiariosPorSexo: [
        { categoria: "Niñas", total: totalNiñas },
        { categoria: "Niños", total: totalNiños }
      ]
    }
  };
}
