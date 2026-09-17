export const PQRSD_CATALOGOS={
  campos:{
    medio:"MEDIO DE LLEGADA",
    tipo:"TIPO DE REQUERIMIENTO",
    comuna:"COMUNA",
    estado:"ESTADO DEL TRAMITE"
  },
  normalizaciones:{
    medio:[
      {
        original:"CORREO ELECT.",
        normalizado:"CORREO ELECTRÓNICO",
        regla:"PQRSD-MEDIO-CORREO-ELECTRONICO"
      }
    ],
    tipo:[],
    comuna:[
      {
        original:"COMUNA 01 POPULAR",
        normalizado:"COMUNA 01 POPULAR",
        regla:"PQRSD-COMUNA-01-POPULAR"
      }
    ],
    estado:[
      {
        original:"EN TRAMITE",
        normalizado:"EN TRÁMITE",
        regla:"PQRSD-ESTADO-EN-TRAMITE"
      }
    ]
  }
};
