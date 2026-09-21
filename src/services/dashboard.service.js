import { crearDashboardBuenComienzo } from "./dashboard-buen-comienzo.service.js";
import { crearDashboardContratacion } from "./dashboard-contratacion.service.js";
import { crearDashboardHabitantesCalle } from "./dashboard-habitantes-calle.service.js";

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

export function crearDashboard({proceso,filas,campos,validacion}){
  const procesoNormalizado=String(proceso||"").toUpperCase();
  if(procesoNormalizado==="PQRSD") return crearDashboardPqrsd({filas,campos});
  if(procesoNormalizado==="BUEN_COMIENZO") return crearDashboardBuenComienzo({filas,campos});
  if(procesoNormalizado==="CONTRATACION") return crearDashboardContratacion({filas,campos});
  if(procesoNormalizado==="HABITANTES_CALLE") return crearDashboardHabitantesCalle({filas,campos,validacion});
  return {totalRegistros:filas.length};
}
