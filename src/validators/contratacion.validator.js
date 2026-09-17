export default {
  version:"CONTRATACION-v0.1",
  validar({headers,filas}){
    return {valido:true,errores:[],advertencias:[{
      regla:"CONTRATACION-CONTRATO-PENDIENTE",
      mensaje:"Validador base. Falta cerrar columnas exactas contra el Excel bruto de contratación."
    }],campos:{},resumen:{totalFilas:filas.length,headersDetectados:headers}};
  },
  normalizar({filas}){ return filas; }
};
