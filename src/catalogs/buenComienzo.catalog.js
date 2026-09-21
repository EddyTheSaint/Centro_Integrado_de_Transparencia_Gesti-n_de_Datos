export const BUEN_COMIENZO_CATALOGOS = {
  campos: {
    id: "ID",
    comuna: "COMUNA",
    corregimiento: "CORREGIMIENTO",
    niñas: "NIÑAS",
    niños: "NIÑOS",
    total: "TOTAL",
    modalidad: "MODALIDAD",
    presupuestoAsignado: "PRESUPUESTO_ASIGNADO",
    presupuestoEjecutado: "PRESUPUESTO_EJECUTADO",
    mes: "MES",
    fechaCorte: "FECHA_CORTE"
  },
  normalizaciones: {
    modalidad: [
      {
        original: "CENTRO INFANTIL",
        normalizado: "CENTRO INFANTIL",
        regla: "BC-MODALIDAD-CENTRO-INFANTIL"
      },
      {
        original: "JARDIN INFANTIL",
        normalizado: "JARDÍN INFANTIL",
        regla: "BC-MODALIDAD-JARDIN-INFANTIL"
      },
      {
        original: "INSTITUCIONAL FLEXIBLE",
        normalizado: "INSTITUCIONAL FLEXIBLE",
        regla: "BC-MODALIDAD-INSTITUCIONAL-FLEXIBLE"
      },
      {
        original: "ENTORNO FAMILIAR",
        normalizado: "ENTORNO FAMILIAR",
        regla: "BC-MODALIDAD-ENTORNO-FAMILIAR"
      }
    ],
    comuna: [
      // Comunas de Medellín
      {
        original: "POPULAR",
        normalizado: "COMUNA 01 POPULAR",
        regla: "BC-COMUNA-01-POPULAR"
      },
      {
        original: "SANTA CRUZ",
        normalizado: "COMUNA 02 SANTA CRUZ",
        regla: "BC-COMUNA-02-SANTA-CRUZ"
      },
      {
        original: "MANRIQUE",
        normalizado: "COMUNA 03 MANRIQUE",
        regla: "BC-COMUNA-03-MANRIQUE"
      },
      {
        original: "ARANDA",
        normalizado: "COMUNA 04 ARANDA",
        regla: "BC-COMUNA-04-ARANDA"
      },
      {
        original: "CASTILLA",
        normalizado: "COMUNA 05 CASTILLA",
        regla: "BC-COMUNA-05-CASTILLA"
      },
      {
        original: "DOCE DE OCTUBRE",
        normalizado: "COMUNA 06 DOCE DE OCTUBRE",
        regla: "BC-COMUNA-06-DOCE-DE-OCTUBRE"
      },
      {
        original: "ROBLEDO",
        normalizado: "COMUNA 07 ROBLEDO",
        regla: "BC-COMUNA-07-ROBLEDO"
      },
      {
        original: "VILLA HERMOSA",
        normalizado: "COMUNA 08 VILLA HERMOSA",
        regla: "BC-COMUNA-08-VILLA-HERMOSA"
      },
      {
        original: "BUENOS AIRES",
        normalizado: "COMUNA 09 BUENOS AIRES",
        regla: "BC-COMUNA-09-BUENOS-AIRES"
      },
      {
        original: "LA CANDELARIA",
        normalizado: "COMUNA 10 LA CANDELARIA",
        regla: "BC-COMUNA-10-LA-CANDELARIA"
      },
      {
        original: "LAURELES",
        normalizado: "COMUNA 11 LAURELES",
        regla: "BC-COMUNA-11-LAURELES"
      },
      {
        original: "LA AMÉRICA",
        normalizado: "COMUNA 12 LA AMÉRICA",
        regla: "BC-COMUNA-12-LA-AMERICA"
      },
      {
        original: "SAN ALEJO",
        normalizado: "COMUNA 13 SAN ALEJO",
        regla: "BC-COMUNA-13-SAN-ALEJO"
      },
      {
        original: "ALTAVISTA",
        normalizado: "COMUNA 14 ALTAVISTA",
        regla: "BC-COMUNA-14-ALTAVISTA"
      },
      {
        original: "GUAYABAL",
        normalizado: "COMUNA 15 GUAYABAL",
        regla: "BC-COMUNA-15-GUAYABAL"
      },
      {
        original: "BELÉN",
        normalizado: "COMUNA 16 BELÉN",
        regla: "BC-COMUNA-16-BELEN"
      }
    ]
  }
};
