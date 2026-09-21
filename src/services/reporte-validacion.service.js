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
  const campos=validacion.campos || (validacion.hojas?.beneficiarios?.campos);
  return {
    total_registros:excel.filas?.length||0,
    errores:validacion.errores||[],
    advertencias:validacion.advertencias||[],
    campos_vacios:campos ? contarVaciosPorCampo(excel.filas||[],campos) : {},
    reglas_aplicadas:reglasAplicadas||[],
    categorias_detectadas:validacion.resumen?.categoriasDetectadas || validacion.hojas?.beneficiarios?.resumen?.categoriasDetectadas||{},
    dashboard
  };
}
