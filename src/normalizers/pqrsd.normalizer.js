import { PQRSD_CATALOGOS } from "../catalogs/pqrsd.catalog.js";
import { canon } from "../validators/utils.js";

function indiceReglas(reglas){
  return new Map((reglas||[]).map(regla=>[canon(regla.original),regla]));
}

function registrarAplicacion(registros,campo,valorOriginal,valorNormalizado,regla){
  const clave=[campo,valorOriginal,valorNormalizado,regla].join("||");
  const actual=registros.get(clave)||{
    campo,
    valor_original:valorOriginal,
    valor_normalizado:valorNormalizado,
    regla,
    cantidad_afectada:0
  };
  actual.cantidad_afectada++;
  registros.set(clave,actual);
}

export function normalizarPqrsd({filas,campos}){
  const registros=new Map();
  const indices=Object.fromEntries(
    Object.entries(PQRSD_CATALOGOS.normalizaciones).map(([campo,reglas])=>[campo,indiceReglas(reglas)])
  );

  const datosNormalizados=filas.map(fila=>{
    const normalizada={...fila};

    for(const campo of Object.keys(PQRSD_CATALOGOS.normalizaciones)){
      const columna=campos[campo];
      if(!columna) continue;

      const valor=fila[columna];
      if(valor==null||String(valor).trim()==="") continue;

      const regla=indices[campo].get(canon(valor));
      if(!regla) continue;

      normalizada[columna]=regla.normalizado;
      registrarAplicacion(registros,columna,String(valor),regla.normalizado,regla.regla);
    }

    return normalizada;
  });

  return {
    datosNormalizados,
    reglasAplicadas:[...registros.values()].sort((a,b)=>a.campo.localeCompare(b.campo)||a.regla.localeCompare(b.regla))
  };
}
