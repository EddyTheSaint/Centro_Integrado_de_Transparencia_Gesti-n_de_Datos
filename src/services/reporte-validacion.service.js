function contarVaciosPorCampo(filas,campos){
  const vacios={};
  for(const [campo,columna] of Object.entries(campos||{})){
    if(!columna) continue;
    vacios[columna]=filas.filter(fila=>{
      const valor=fila[columna];
      return valor==null||String(valor).trim()==="";
    }).length;
  }
  return vacios;
}

export function crearReporteValidacion({excel,validacion,reglasAplicadas,dashboard}){
  return {
    total_registros:excel.filas.length,
    errores:validacion.errores||[],
    advertencias:validacion.advertencias||[],
    campos_vacios:contarVaciosPorCampo(excel.filas,validacion.campos),
    reglas_aplicadas:reglasAplicadas||[],
    categorias_detectadas:validacion.resumen?.categoriasDetectadas||{},
    dashboard
  };
}
