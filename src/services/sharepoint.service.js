import fs from "node:fs/promises";
import path from "node:path";
import { crearExcelBuffer, crearExcelMultiHojaBuffer } from "./excel.service.js";

const RAIZ_LOCAL=path.join(process.cwd(),"storage","cargas");

function nombreSeguro(nombre){
  return String(nombre||"archivo").replace(/[^\w.\-]+/g,"_");
}

async function asegurarDirectorio(idCarga){
  const directorio=path.join(RAIZ_LOCAL,nombreSeguro(idCarga));
  await fs.mkdir(directorio,{recursive:true});
  return directorio;
}

function rutaPublica(rutaAbsoluta){
  return path.relative(process.cwd(),rutaAbsoluta).replace(/\\/g,"/");
}

async function escribirJson(rutaAbsoluta,contenido){
  await fs.writeFile(rutaAbsoluta,JSON.stringify(contenido,null,2),"utf8");
  return rutaPublica(rutaAbsoluta);
}

export async function guardarRaw({idCarga,archivo}){
  const directorio=await asegurarDirectorio(idCarga);
  const ruta=path.join(directorio,`raw-${nombreSeguro(archivo.originalname)}`);
  await fs.writeFile(ruta,archivo.buffer);
  return rutaPublica(ruta);
}

export async function guardarNormalizado({idCarga,filas}){
  const directorio=await asegurarDirectorio(idCarga);
  const ruta=path.join(directorio,"normalizado.xlsx");
  await fs.writeFile(ruta,crearExcelBuffer(filas,"Normalizado"));
  return rutaPublica(ruta);
}

export async function guardarValidacion({idCarga,reporte,reglasAplicadas}){
  const directorio=await asegurarDirectorio(idCarga);
  const json=path.join(directorio,"validacion.json");
  const excel=path.join(directorio,"validacion.xlsx");

  await escribirJson(json,reporte);
  await fs.writeFile(excel,crearExcelMultiHojaBuffer([
    {nombre:"Errores",filas:reporte.errores},
    {nombre:"Advertencias",filas:reporte.advertencias},
    {nombre:"Campos vacios",filas:Object.entries(reporte.campos_vacios||{}).map(([campo,cantidad])=>({campo,cantidad}))},
    {nombre:"Reglas",filas:reglasAplicadas||[]}
  ]));

  return {
    json:rutaPublica(json),
    excel:rutaPublica(excel)
  };
}

export async function registrarHistorico({idCarga,metadata}){
  const directorio=await asegurarDirectorio(idCarga);
  const ruta=path.join(directorio,"historico.json");
  return escribirJson(ruta,{
    ...metadata,
    registrado_en:new Date().toISOString()
  });
}
