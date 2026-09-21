import { ENCUENTROS_CIUDAD_CATALOGOS } from "../catalogs/encuentrosCiudad.catalog.js";
import { canon } from "../validators/utils.js";

function indiceReglas(reglas) {
  return new Map((reglas || []).map(regla => [canon(regla.original), regla]));
}

function registrarAplicacion(registros, campo, valorOriginal, valorNormalizado, regla) {
  const clave = [campo, valorOriginal, valorNormalizado, regla].join("||");
  const actual = registros.get(clave) || {
    campo,
    valor_original: valorOriginal,
    valor_normalizado: valorNormalizado,
    regla,
    cantidad_afectada: 0
  };
  actual.cantidad_afectada++;
  registros.set(clave, actual);
}

function normalizarEtiqueta(valor) {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "No informa";
  const c = canon(limpio);
  if (["N/A", "NO ENCUESTADO", "SIN INFORMACION", "NO RESPONDE", "SIN RESPUESTA", "NO CONTESTA"].includes(c)) {
    return limpio.toUpperCase() === "N/A" ? "N/A" : "No Encuestado";
  }
  return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

function normalizarSiNoPbix(valor) {
  const c = canon(valor);
  if (c === "SI" || c === "S") return "Sí";
  if (c === "NO") return "No";
  return "No informa";
}

function normalizarSexoPbix(valor) {
  const c = canon(valor);
  if (c === "F" || c === "FEMENINO") return "Femenino";
  if (c === "M" || c === "MASCULINO") return "Masculino";
  return "No informa";
}

const CATALOGO_TERRITORIAL = {
  "1": "1 POPULAR",
  "2": "2 SANTA CRUZ",
  "3": "3 MANRIQUE",
  "4": "4 ARANJUEZ",
  "5": "5 CASTILLA",
  "6": "6 DOCE DE OCTUBRE",
  "7": "7 ROBLEDO",
  "8": "8 VILLAHERMOSA",
  "9": "9 BUENOS AIRES",
  "10": "10 LA CANDELARIA",
  "11": "11 LAURELES-ESTADIO",
  "12": "12 LA AMERICA",
  "13": "13 SAN JAVIER",
  "14": "14 EL POBLADO",
  "15": "15 GUAYABAL",
  "16": "16 BELEN",
  "50": "50 SAN SEBASTIAN DE PALMITAS",
  "60": "60 SAN CRISTOBAL",
  "70": "70 ALTAVISTA",
  "80": "80 SAN ANTONIO DE PRADO",
  "90": "90 SANTA ELENA"
};

function normalizarComunaPbix(valor) {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return "NO_INFORMADO";
  const c = canon(limpio);
  if (["N/A", "NO ENCUESTADO", "SIN INFORMACION", "NO RESPONDE", "SIN RESPUESTA", "NO CONTESTA"].includes(c)) {
    return "NO_INFORMADO";
  }
  if (c === "VARIAS") return "VARIAS";
  if (c === "VIRTUAL") return "VIRTUAL";
  const match = limpio.match(/^(\d{1,2})\b/);
  if (match && CATALOGO_TERRITORIAL[match[1]]) return CATALOGO_TERRITORIAL[match[1]];
  return limpio.toUpperCase();
}

export function normalizarEncuentrosCiudad({ filas, campos }) {
  const registros = new Map();
  const advertenciasDetectadas = [];

  // Preparar índices de normalización
  const indices = {
    sexo: indiceReglas(ENCUENTROS_CIUDAD_CATALOGOS.normalizaciones.sexo),
    rangoEdad: indiceReglas(ENCUENTROS_CIUDAD_CATALOGOS.normalizaciones.rangoEdad),
    escolaridad: indiceReglas(ENCUENTROS_CIUDAD_CATALOGOS.normalizaciones.escolaridad),
    siNo: indiceReglas(ENCUENTROS_CIUDAD_CATALOGOS.normalizaciones.siNo)
  };

  const datosNormalizados = filas.map(fila => {
    const normalizada = { ...fila };

    // Mantener valores originales para análisis institucional
    if (campos.sexo) {
      normalizada['_SEXO_ORIGINAL'] = fila[campos.sexo];
    }
    if (campos.rangoEdad) {
      normalizada['_RANGO_EDAD_ORIGINAL'] = fila[campos.rangoEdad];
    }
    if (campos.escolaridad) {
      normalizada['_ESCOLARIDAD_ORIGINAL'] = fila[campos.escolaridad];
    }
    if (campos.comuna) {
      normalizada['_COMUNA_ORIGINAL'] = fila[campos.comuna];
    }
    if (campos.barrio) {
      normalizada['_BARRIO_ORIGINAL'] = fila[campos.barrio];
    }
    if (campos.canalAtencion) {
      normalizada['_CANAL_ORIGINAL'] = fila[campos.canalAtencion];
    }

    if (campos.comuna) {
      normalizada["Comuna Normalizada"] = normalizarComunaPbix(fila[campos.comuna]);
      normalizada["COMUNA_NORMALIZADA"] = normalizada["Comuna Normalizada"];
    }
    if (campos.sexo) {
      normalizada["Sexo Normalizado"] = normalizarSexoPbix(fila[campos.sexo]);
    }
    if (campos.conoceContraloria) {
      normalizada["Conoce la Contraloría Normalizado"] = normalizarSiNoPbix(fila[campos.conoceContraloria]);
    }
    if (campos.satisfaccionEvento) {
      normalizada["Nivel de Satisfacción Normalizado"] = normalizarEtiqueta(fila[campos.satisfaccionEvento]);
    }

    // Normalizar SEXO
    if (campos.sexo) {
      const columna = campos.sexo;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.sexo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Normalizar RANGO DE EDAD
    if (campos.rangoEdad) {
      const columna = campos.rangoEdad;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.rangoEdad.get(canon(limpio));

        // Detectar valor sospechoso "mayo de 55 años" (error ortográfico de "mayor")
        if (limpio === "mayo de 55 años") {
          advertenciasDetectadas.push({
            regla: "EC-FECHA-SOSPECHOSA",
            columna,
            valor: limpio,
            fila: fila,
            mensaje: "Probable error ortográfico: 'mayo de 55 años' debería ser 'mayor de 55 años'"
          });
        }

        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Normalizar ESCOLARIDAD
    if (campos.escolaridad) {
      const columna = campos.escolaridad;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.escolaridad.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Normalizar TIENE CELULAR (SI/NO)
    if (campos.tieneCelular) {
      const columna = campos.tieneCelular;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.siNo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        } else if (!["SI", "NO"].includes(limpio)) {
          // Detectar variantes problemáticas que no se pueden normalizar
          if (["N0", "ino responde", "NO CONTESTA", "N/A", "no encuestado", "no responde"].includes(limpio)) {
            advertenciasDetectadas.push({
              regla: "EC-CELULAR-VARIANTE",
              columna,
              valor: limpio,
              fila: fila,
              mensaje: `Valor sospechoso en TIENE CELULAR: '${limpio}'`
            });
          }
        }
      }
    }

    // Normalizar TIENE CORREO (SI/NO)
    if (campos.tieneCorreo) {
      const columna = campos.tieneCorreo;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.siNo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        } else if (!["SI", "NO"].includes(limpio)) {
          // Detectar error "ino responde" en CORREO ELECTRONICO
          if (limpio === "ino responde") {
            advertenciasDetectadas.push({
              regla: "EC-CORREO-ERROR",
              columna,
              valor: limpio,
              fila: fila,
              mensaje: `Probable error ortográfico: 'ino responde' debería ser 'no responde'`
            });
          } else if (["N0", "N/A", "no encuestado", "NO CONTESTA"].includes(limpio)) {
            advertenciasDetectadas.push({
              regla: "EC-CORREO-VARIANTE",
              columna,
              valor: limpio,
              fila: fila,
              mensaje: `Valor sospechoso en TIENE CORREO: '${limpio}'`
            });
          }
        }
      }
    }

    // Normalizar CONOCE CONTRALORÍA (SI/NO)
    if (campos.conoceContraloria) {
      const columna = campos.conoceContraloria;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.siNo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // Normalizar INTERES VOLVER (SI/NO)
    if (campos.interesVolver) {
      const columna = campos.interesVolver;
      const valor = normalizada[columna];
      if (valor != null && String(valor).trim() !== "") {
        const limpio = String(valor).trim();
        const regla = indices.siNo.get(canon(limpio));
        if (regla) {
          normalizada[columna] = regla.normalizado;
          registrarAplicacion(registros, columna, limpio, regla.normalizado, regla.regla);
        }
      }
    }

    // NO normalizar automáticamente: canalesAtencion, satisfacción, respuestas abiertas
    // Estas requieren procesamiento más sofisticado

    return normalizada;
  });

  // Resumen de reglas aplicadas
  const reglasAplicadas = Array.from(registros.values());

  return {
    datosNormalizados,
    reglasAplicadas,
    advertencias: advertenciasDetectadas
  };
}
