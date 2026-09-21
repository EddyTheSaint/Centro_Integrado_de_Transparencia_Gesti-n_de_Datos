// Catálogo de Habitantes de Calle basado en RAW real
// BD_HABITANTE_CALLE_MAYO.xlsx - 2187 registros

export const HABITANTES_CALLE_CATALOGOS = {
  campos: {
    año: "AÑO",
    numeroProyecto: "No. PROYECTO",
    nombreProyecto: "Nombre del proyecto",
    sedeDeAtencion: "SEDE DE ATENCION",
    programa: "PROGRAMA",
    componente: "COMPONENTE",
    sexo: "SEXO",
    rangosDeEdades: "RANGOS DE EDADES",
    cantidad: "CANTIDAD",
    presupuesto: "PRESUPUESTO"
  },
  normalizaciones: {
    sexo: [
      {
        original: "HOMBRE",
        normalizado: "HOMBRE",
        regla: "HC-SEXO-HOMBRE"
      },
      {
        original: "HOMBRES",
        normalizado: "HOMBRE",
        regla: "HC-SEXO-HOMBRES-A-HOMBRE"
      },
      {
        original: "MUJER",
        normalizado: "MUJER",
        regla: "HC-SEXO-MUJER"
      },
      {
        original: "MUJERES",
        normalizado: "MUJER",
        regla: "HC-SEXO-MUJERES-A-MUJER"
      }
    ],
    rangosDeEdades: [
      // 18-28 años
      {
        original: "18 A 28 AÑOS",
        normalizado: "18 A 28 AÑOS",
        regla: "HC-RANGO-18-28"
      },
      {
        original: "18 a 28 AÑOS",
        normalizado: "18 A 28 AÑOS",
        regla: "HC-RANGO-18-28-MINUSCULAS"
      },
      // 29-59 años
      {
        original: "29 A 59 AÑOS",
        normalizado: "29 A 59 AÑOS",
        regla: "HC-RANGO-29-59"
      },
      {
        original: "29 a 59 años",
        normalizado: "29 A 59 AÑOS",
        regla: "HC-RANGO-29-59-MINUSCULAS"
      },
      // 60+ años
      {
        original: "60 AÑOS O MAS",
        normalizado: "60 AÑOS O MAS",
        regla: "HC-RANGO-60-MAS"
      },
      {
        original: "60 años o mas",
        normalizado: "60 AÑOS O MAS",
        regla: "HC-RANGO-60-MAS-MINUSCULAS"
      },
      // Edad desconocida
      {
        original: "EDAD DESCONOCIDA",
        normalizado: "EDAD DESCONOCIDA",
        regla: "HC-RANGO-EDAD-DESCONOCIDA"
      },
      // No se sabe
      {
        original: "NO SE SABE",
        normalizado: "NO SE SABE",
        regla: "HC-RANGO-NO-SE-SABE"
      },
      {
        original: "No se sabe",
        normalizado: "NO SE SABE",
        regla: "HC-RANGO-NO-SE-SABE-MINUSCULAS"
      }
    ]
  },
  // Proyectos detectados en RAW (para referencia, no fusionar automáticamente)
  proyectosEnRaw: {
    // Se completarán al procesar el archivo
  }
};
