import { buscarHeader, canon } from "./utils.js";

const CAMPOS={
  id:["No. PQRSD","NO. PQRSD","No. SPC/PQRSD","NO. SPC/PQRSD","SPC/PQRSD"],
  medio:["MEDIO DE LLEGADA","MEDIO LLEGADA"],
  tipo:["TIPO DE REQUERIMIENTO","TIPO REQUERIMIENTO"],
  comuna:["COMUNA","NOMBRE COMUNA"],
  estado:["ESTADO DEL TRAMITE","ESTADO DEL TRÁMITE","ESTADO TRAMITE"],
  entidad:["ENTIDAD 1","ENTIDAD"]
};

function resolver(headers){
  return Object.fromEntries(Object.entries(CAMPOS).map(([k,v])=>[k,buscarHeader(headers,v)]));
}

export default {
  version:"PQRSD-v0.3",
  validar({headers,filas}){
    const campos=resolver(headers), errores=[], advertencias=[];
    for(const c of ["id","medio","tipo","comuna","estado"]){
      if(!campos[c]) errores.push({regla:"PQRSD-ESTRUCTURA",campo:c,mensaje:`No se encontró columna compatible para ${c}.`});
    }
    if(errores.length) return {valido:false,errores,advertencias,campos,resumen:{totalFilas:filas.length,headersDetectados:headers}};

    let filasSinId=0, comunasVacias=0, estadosVacios=0, tiposVacios=0, mediosVacios=0;
    const cats={comunas:new Set(),estados:new Set(),tipos:new Set(),medios:new Set()};

    filas.forEach((fila,i)=>{
      if(!fila[campos.id]){ filasSinId++; advertencias.push({regla:"PQRSD-ID-VACIO",fila:i+2,mensaje:"Registro sin identificador PQRSD."}); }
      for(const [g,col] of [["comunas",campos.comuna],["estados",campos.estado],["tipos",campos.tipo],["medios",campos.medio]]){
        const v=fila[col];
        if(v==null||String(v).trim()===""){
          if(g==="comunas") comunasVacias++;
          if(g==="estados") estadosVacios++;
          if(g==="tipos") tiposVacios++;
          if(g==="medios") mediosVacios++;
        } else cats[g].add(canon(v));
      }
    });

    return {valido:true,errores,advertencias,campos,resumen:{
      totalFilas:filas.length,filasSinId,comunasVacias,estadosVacios,tiposVacios,mediosVacios,
      categoriasDetectadas:Object.fromEntries(Object.entries(cats).map(([k,s])=>[k,[...s].sort()]))
    }};
  }
};
