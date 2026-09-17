import { leerPrimerHoja } from "../services/excel.service.js";
import { obtenerValidador } from "../validators/index.js";
import { obtenerNormalizador } from "../normalizers/index.js";
import { crearDashboard } from "../services/dashboard.service.js";
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

    const excel=leerPrimerHoja(archivo.buffer);
    const validacion=validador.validar(excel);
    const idCarga=`${String(proceso).toUpperCase()}-${periodo}-${Date.now()}`;
    const estado=validacion.errores.length ? "OBSERVADO" : "VALIDADO";
    const rutas={raw:await guardarRaw({idCarga,archivo})};
    let normalizacion={datosNormalizados:[],reglasAplicadas:[]};
    let dashboard=null;

    if(!validacion.errores.length){
      const normalizador=obtenerNormalizador(proceso);
      normalizacion=normalizador
        ? normalizador({filas:excel.filas,campos:validacion.campos})
        : {datosNormalizados:excel.filas.map(fila=>({...fila})),reglasAplicadas:[]};

      dashboard=crearDashboard({
        proceso,
        filas:normalizacion.datosNormalizados,
        campos:validacion.campos
      });
      rutas.normalizado=await guardarNormalizado({idCarga,filas:normalizacion.datosNormalizados});
    }

    const reporteValidacion=crearReporteValidacion({
      excel,
      validacion,
      reglasAplicadas:normalizacion.reglasAplicadas,
      dashboard
    });
    rutas.validacion=await guardarValidacion({
      idCarga,
      reporte:reporteValidacion,
      reglasAplicadas:normalizacion.reglasAplicadas
    });
    rutas.historico=await registrarHistorico({
      idCarga,
      metadata:{
        idCarga,
        estado,
        proceso:String(proceso).toUpperCase(),
        periodo,
        archivo:archivo.originalname,
        hoja:excel.hojaNombre,
        total_registros:excel.filas.length,
        total_errores:validacion.errores.length,
        total_advertencias:validacion.advertencias.length
      }
    });

    return res.status(validacion.errores.length?422:200).json({
      ok:validacion.errores.length===0,idCarga,estado,proceso:String(proceso).toUpperCase(),
      periodo,
      archivo:archivo.originalname,
      hoja:excel.hojaNombre,
      versionReglas:validador.version,
      ...validacion,
      normalizacion:{
        reglasAplicadas:normalizacion.reglasAplicadas
      },
      reporteValidacion,
      dashboard,
      rutas
    });
  }catch(error){
    console.error(error);
    return res.status(500).json({ok:false,mensaje:error.message});
  }
}
