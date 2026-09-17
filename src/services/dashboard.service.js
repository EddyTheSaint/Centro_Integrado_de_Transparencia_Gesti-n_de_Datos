function contarPorCampo(filas,campo){
  if(!campo) return [];
  const conteo=new Map();
  for(const fila of filas){
    const valor=fila[campo];
    const etiqueta=valor==null||String(valor).trim()==="" ? "(VACÍO)" : String(valor).trim();
    conteo.set(etiqueta,(conteo.get(etiqueta)||0)+1);
  }
  return [...conteo.entries()]
    .map(([categoria,total])=>({categoria,total}))
    .sort((a,b)=>b.total-a.total||a.categoria.localeCompare(b.categoria));
}

export function crearDashboardPqrsd({filas,campos}){
  return {
    totalRegistros:filas.length,
    porTipoRequerimiento:contarPorCampo(filas,campos.tipo),
    porMedioLlegada:contarPorCampo(filas,campos.medio),
    porComuna:contarPorCampo(filas,campos.comuna),
    porEstadoTramite:contarPorCampo(filas,campos.estado)
  };
}

export function crearDashboard({proceso,filas,campos}){
  if(String(proceso||"").toUpperCase()==="PQRSD") return crearDashboardPqrsd({filas,campos});
  return {totalRegistros:filas.length};
}
