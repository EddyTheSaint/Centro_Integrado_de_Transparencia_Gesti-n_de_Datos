// Catálogo de Encuentros de Ciudad basado en RAW real
// ENCUENTRO DE CIUDAD MAYO.xlsx - 4478 registros
// Diagnóstico: DIAGNOSTICO_ENCUENTROS_CIUDAD.md

export const ENCUENTROS_CIUDAD_CATALOGOS = {
  campos: {
    fechaEvento: "FECHA DEL EVENTO",
    lugarEvento: "LUGAR DEL EVENTO",
    comunaEvento: "Comuna/Evento",
    comuna: "COMUNA",
    tieneCelular: "TIENE CELULAR ",
    tieneCorreo: "TIENE CORREO ELECTRONICO",
    sexo: "SEXO",
    barrio: "barrio",
    rangoEdad: "rango de edad",
    escolaridad: "escolaridad",
    actividadEconomica: "actividad económica",
    organizacionSocial: "¿hace parte de alguna organización social?",
    conoceContraloria: "¿conoce la contraloría distrital de Medellín y sabe que hace?",
    temasInteres: "¿en que temas le gustaría participar?",
    satisfaccionEvento: "Cual es su Nivel de satisfacción frente al evento que participo?",
    canalAtencion: "a través de que canal de atención dispuesto por la contraloría distrital de Medellín se entero del evento?",
    satisfaccionCanal: "cual es el nivel de satisfacción del medio del cual se entero del evento?",
    aportarFormacion: "considera usted que la contraloría general de Medellín , además de hacer control fiscal, debe aportar en procesos de formación en participación ciudadana?",
    evaluacionCapacitacion: "para usted, los espacios de capacitación, realizados por la contraloría general de Medellín son?",
    metodologiaFacilitador: "la metodología utilizada por el facilitador de la Contraloría General de Medellín le pareció:",
    capacidadPedagogica: "la persona que dirigió la capacitación evidencia manejo del tema y capacidad pedológica para transmitir su conocimiento?",
    interesVolver: "Le interesaría participar en otro taller de formación en participación ciudadana realizado por la Contraloría General de Medellín?",
    otrosTemas: "En que otros temas considera usted, que la Contraloría General de Medellín podría apoyar el proceso de formación ?",
    sugerencias: "Tiene alguna sugerencia para mejorar los eventos de participación ciudadana de la contraloría distrital de Medellín?"
  },

  normalizaciones: {
    sexo: [
      { original: "FEMENINO", normalizado: "FEMENINO", regla: "EC-SEXO-FEMENINO" },
      { original: "F", normalizado: "FEMENINO", regla: "EC-SEXO-F" },
      { original: "MASCULINO", normalizado: "MASCULINO", regla: "EC-SEXO-MASCULINO" },
      { original: "M", normalizado: "MASCULINO", regla: "EC-SEXO-M" },
      { original: "N/A", normalizado: "NO_INFORMADO", regla: "EC-SEXO-NA" },
      { original: "NO RESPONDE", normalizado: "NO_INFORMADO", regla: "EC-SEXO-NO-RESPONDE" },
      { original: "no encuestado", normalizado: "NO_INFORMADO", regla: "EC-SEXO-NO-ENCUESTADO" },
      { original: "sin información", normalizado: "NO_INFORMADO", regla: "EC-SEXO-SIN-INFORMACION" }
    ],

    rangoEdad: [
      { original: "menor de 18 años", normalizado: "MENOR_18", regla: "EC-EDAD-MENOR-18" },
      { original: "menor de 18", normalizado: "MENOR_18", regla: "EC-EDAD-MENOR-18-CORTA" },
      { original: "entre 18 y 26 años", normalizado: "18_A_26", regla: "EC-EDAD-18-26" },
      { original: "entre 27 y 55 años", normalizado: "27_A_55", regla: "EC-EDAD-27-55" },
      { original: "mayor de 55 años", normalizado: "MAYOR_55", regla: "EC-EDAD-MAYOR-55" },
      { original: "mayor de 55", normalizado: "MAYOR_55", regla: "EC-EDAD-MAYOR-55-CORTA" },
      { original: "Mayor de 55 años", normalizado: "MAYOR_55", regla: "EC-EDAD-MAYOR-55-MAYUSCULA" },
      { original: "N/A", normalizado: "NO_INFORMADO", regla: "EC-EDAD-NA" },
      { original: "no encuestado", normalizado: "NO_INFORMADO", regla: "EC-EDAD-NO-ENCUESTADO" },
      { original: "sin información", normalizado: "NO_INFORMADO", regla: "EC-EDAD-SIN-INFORMACION" }
    ],

    escolaridad: [
      { original: "primaria", normalizado: "PRIMARIA", regla: "EC-ESCO-PRIMARIA" },
      { original: "secundaria", normalizado: "SECUNDARIA", regla: "EC-ESCO-SECUNDARIA" },
      { original: "técnico", normalizado: "TECNICO", regla: "EC-ESCO-TECNICO" },
      { original: "tecnico", normalizado: "TECNICO", regla: "EC-ESCO-TECNICO-MINUSCULA" },
      { original: "Técnico", normalizado: "TECNICO", regla: "EC-ESCO-TECNICO-MAYUSCULA" },
      { original: "tecnológico", normalizado: "TECNOLOGICO", regla: "EC-ESCO-TECNOLOGICO" },
      { original: "tecnologico", normalizado: "TECNOLOGICO", regla: "EC-ESCO-TECNOLOGICO-MINUSCULA" },
      { original: "Tecnológico", normalizado: "TECNOLOGICO", regla: "EC-ESCO-TECNOLOGICO-MAYUSCULA" },
      { original: "pregrado", normalizado: "PREGRADO", regla: "EC-ESCO-PREGRADO" },
      { original: "Universitario", normalizado: "PREGRADO", regla: "EC-ESCO-UNIVERSITARIO" },
      { original: "posgrado", normalizado: "POSGRADO", regla: "EC-ESCO-POSGRADO" },
      { original: "ninguna", normalizado: "NINGUNA", regla: "EC-ESCO-NINGUNA" },
      { original: "ninguno", normalizado: "NINGUNA", regla: "EC-ESCO-NINGUNO" },
      { original: "N/A", normalizado: "NO_INFORMADO", regla: "EC-ESCO-NA" },
      { original: "no encuestado", normalizado: "NO_INFORMADO", regla: "EC-ESCO-NO-ENCUESTADO" },
      { original: "sin información", normalizado: "NO_INFORMADO", regla: "EC-ESCO-SIN-INFORMACION" }
    ],

    siNo: [
      { original: "SI", normalizado: "SI", regla: "EC-SINO-SI" },
      { original: "SI ", normalizado: "SI", regla: "EC-SINO-SI-ESPACIO" },
      { original: "S", normalizado: "SI", regla: "EC-SINO-S" },
      { original: "s", normalizado: "SI", regla: "EC-SINO-s" },
      { original: "si", normalizado: "SI", regla: "EC-SINO-si" },
      { original: "si ", normalizado: "SI", regla: "EC-SINO-si-ESPACIO" },
      { original: "NO", normalizado: "NO", regla: "EC-SINO-NO" },
      { original: "NO ", normalizado: "NO", regla: "EC-SINO-NO-ESPACIO" },
      { original: "no", normalizado: "NO", regla: "EC-SINO-no" },
      { original: "no ", normalizado: "NO", regla: "EC-SINO-no-ESPACIO" }
    ]
  },

  // Definiciones provisionales de evento
  definicionesEvento: {
    provisional_fecha_lugar: {
      nombre: "PROVISIONAL: FECHA + LUGAR",
      descripcion: "Combinación de FECHA DEL EVENTO + LUGAR DEL EVENTO",
      campos: ["FECHA DEL EVENTO", "LUGAR DEL EVENTO"],
      estado: "PROVISIONAL",
      esperado: 39
    },
    alternativa_fecha_lugar_comuna: {
      nombre: "ALTERNATIVA: FECHA + LUGAR + Comuna/Evento",
      descripcion: "Combinación de FECHA DEL EVENTO + LUGAR DEL EVENTO + Comuna/Evento",
      campos: ["FECHA DEL EVENTO", "LUGAR DEL EVENTO", "Comuna/Evento"],
      estado: "INFORMATIVO",
      esperado: 60
    }
  },

  // Valores sospechosos que no se normalizan automáticamente
  valoresSospechosos: {
    comuna: ["varias", "8"],
    fechas: ["mayo de 55 años"],
    canalesAtencion: ["aceptable", "bueno", "excelente"] // Valores de satisfacción errados
  }
};
