import fs from 'fs';
import { leerPrimerHoja } from "../services/excel.service.js";
import { obtenerValidador } from "../validators/index.js";
import { obtenerNormalizador } from "../normalizers/index.js";
import { crearDashboard } from "../services/dashboard.service.js";
import { crearDashboardBuenComienzo } from "../services/dashboard-buen-comienzo.service.js";
import { crearReporteValidacion } from "../services/reporte-validacion.service.js";
import {
  guardarRaw,
  guardarNormalizado,
  guardarValidacion,
  registrarHistorico
} from "../services/sharepoint.service.js";

export async function procesarCarga(req,res){
  try{
    const {proceso,periodo}=req.body, archivo=req.file;
    if(!proceso) return res.status(400).json({ok:false,mensaje:"Seleccione un proceso."});
    if(!periodo) return res.status(400).json({ok:false,mensaje:"Seleccione el periodo."});
    if(!archivo) return res.status(400).json({ok:false,mensaje:"Seleccione un archivo Excel."});

    const validador=obtenerValidador(proceso);
    if(!validador) return res.status(400).json({ok:false,mensaje:`Proceso no soportado: ${proceso}`});

    const procesoNorm=String(proceso).toUpperCase();
    let validacion, hojas, excel, dashboard=null;
    let normalizacion={datosNormalizados:[],reglasAplicadas:[]};

    // Para BUEN_COMIENZO usar validación multi-hoja
    if(procesoNorm==="BUEN_COMIENZO" && validador.validarMultiHoja){
      validacion=validador.validarMultiHoja(archivo.buffer);
      hojas={
        beneficiarios:validacion.hojas.beneficiarios ? {
          nombre:validacion.hojas.beneficiarios.nombre,
          headers:validacion.hojas.beneficiarios.headers,
          filas:validacion.hojas.beneficiarios.filas,
          campos:validacion.hojas.beneficiarios.campos,
          datosNormalizados:validacion.hojas.beneficiarios.filas
        } : null,
        presupuesto:validacion.hojas.presupuesto ? {
          nombre:validacion.hojas.presupuesto.nombre,
          headers:validacion.hojas.presupuesto.headers,
          filas:validacion.hojas.presupuesto.filas,
          campos:validacion.hojas.presupuesto.campos,
          datosNormalizados:validacion.hojas.presupuesto.filas
        } : null
      };
      excel={hojaNombre:`${hojas.beneficiarios?.nombre||''} + ${hojas.presupuesto?.nombre||''}`,filas:hojas.beneficiarios?.filas||[]};
    }else{
      // Para otros procesos, usar lógica original
      excel=leerPrimerHoja(archivo.buffer);
      validacion=validador.validar(excel);
    }

    const idCarga=`${procesoNorm}-${periodo}-${Date.now()}`;
    const estado=validacion.errores.length ? "OBSERVADO" : "VALIDADO";
    const rutas={raw:await guardarRaw({idCarga,archivo})};

    if(!validacion.errores.length){
      const normalizador=obtenerNormalizador(proceso);

      if(procesoNorm==="BUEN_COMIENZO" && hojas && normalizador){
        // Normalización multi-hoja
        normalizacion=normalizador({hojas});
        if(hojas.beneficiarios) hojas.beneficiarios.datosNormalizados=normalizacion.hojas.beneficiarios;
        if(hojas.presupuesto) hojas.presupuesto.datosNormalizados=normalizacion.hojas.presupuesto;
        dashboard=crearDashboardBuenComienzo({hojas,validacion});
      }else if(procesoNorm!=="BUEN_COMIENZO"){
        // Normalización single-hoja (PQRSD, etc)
        normalizacion=normalizador
          ? normalizador({filas:excel.filas,campos:validacion.campos})
          : {datosNormalizados:excel.filas.map(fila=>({...fila})),reglasAplicadas:[]};

        dashboard=crearDashboard({
          proceso:procesoNorm,
          filas:normalizacion.datosNormalizados,
          campos:validacion.campos,
          validacion
        });
      }

      // Guardar datos normalizados
      if(normalizacion.datosNormalizados && normalizacion.datosNormalizados.length){
        rutas.normalizado=await guardarNormalizado({idCarga,filas:normalizacion.datosNormalizados});
      }else if(hojas.beneficiarios?.datosNormalizados){
        rutas.normalizado=await guardarNormalizado({idCarga,filas:hojas.beneficiarios.datosNormalizados});
      }
    }

    const reporteValidacion=crearReporteValidacion({
      excel,
      validacion,
      reglasAplicadas:normalizacion.reglasAplicadas||[],
      dashboard
    });

    rutas.validacion=await guardarValidacion({
      idCarga,
      reporte:reporteValidacion,
      reglasAplicadas:normalizacion.reglasAplicadas||[]
    });

    let metadataHojas={};
    if(hojas){
      metadataHojas={
        hojas:{
          beneficiarios:hojas.beneficiarios?.nombre,
          presupuesto:hojas.presupuesto?.nombre
        }
      };
    }

    rutas.historico=await registrarHistorico({
      idCarga,
      metadata:{
        idCarga,
        estado,
        proceso:procesoNorm,
        periodo,
        archivo:archivo.originalname,
        hoja:excel.hojaNombre,
        total_registros:excel.filas?.length||0,
        total_errores:validacion.errores.length,
        total_advertencias:validacion.advertencias.length,
        ...metadataHojas
      }
    });

    return res.status(validacion.errores.length?422:200).json({
      ok:validacion.errores.length===0,
      idCarga,
      estado,
      proceso:procesoNorm,
      periodo,
      archivo:archivo.originalname,
      hoja:excel.hojaNombre,
      versionReglas:validador.version,
      errores:validacion.errores||[],
      advertencias:validacion.advertencias||[],
      hojas:hojas?{
        beneficiarios:hojas.beneficiarios?{nombre:hojas.beneficiarios.nombre,totalFilas:hojas.beneficiarios.filas?.length||0}:null,
        presupuesto:hojas.presupuesto?{nombre:hojas.presupuesto.nombre,totalFilas:hojas.presupuesto.filas?.length||0}:null
      }:undefined,
      normalizacion:{
        reglasAplicadas:normalizacion.reglasAplicadas||[]
      },
      reporteValidacion,
      dashboard,
      rutas
    });
  }catch(error){
    const msg = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\n\n`;
    fs.appendFileSync('./debug.log', msg);
    console.error("Error en procesarCarga:", error.message);
    return res.status(500).json({ok:false,mensaje:error.message});
  }
}
