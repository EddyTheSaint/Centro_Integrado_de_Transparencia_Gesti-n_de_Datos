function contarPorCampo(filas, campo) {
  if (!campo) return [];
  const conteo = new Map();
  for (const fila of filas) {
    const valor = fila[campo];
    const etiqueta = valor == null || String(valor).trim() === "" ? "(VACÍO)" : String(valor).trim();
    conteo.set(etiqueta, (conteo.get(etiqueta) || 0) + 1);
  }
  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria));
}

function calcularPorcentaje(conDato, totalDatos) {
  if (totalDatos === 0) return 0;
  return ((conDato / totalDatos) * 100).toFixed(1);
}

function analizarSiNo(filas, campo) {
  const resultado = {
    si: 0,
    no: 0,
    noInformado: 0,
    total: 0,
    porcentajeSi: 0
  };

  for (const fila of filas) {
    const valor = String(fila[campo] || "").trim().toUpperCase();
    if (valor === "SI") {
      resultado.si++;
    } else if (valor === "NO") {
      resultado.no++;
    } else if (valor !== "") {
      resultado.noInformado++;
    } else {
      resultado.noInformado++;
    }
  }

  resultado.total = resultado.si + resultado.no;
  resultado.porcentajeSi = resultado.total > 0
    ? calcularPorcentaje(resultado.si, resultado.total)
    : 0;

  return resultado;
}

function calcularEventos(filas, campoFecha, campoLugar, campoComuna) {
  // Definición A: FECHA + LUGAR
  const eventosA = new Set();
  // Definición B: FECHA + LUGAR + Comuna/Evento
  const eventosB = new Set();

  for (const fila of filas) {
    const fecha = fila[campoFecha];
    const lugar = fila[campoLugar];
    const comuna = fila[campoComuna];

    if (fecha && lugar) {
      const claveA = fecha + "|" + lugar;
      eventosA.add(claveA);

      if (comuna) {
        const claveB = claveA + "|" + comuna;
        eventosB.add(claveB);
      }
    }
  }

  return {
    definicion_fecha_lugar: eventosA.size,
    definicion_fecha_lugar_comuna: eventosB.size,
    promedioAsistentes_A: filas.length > 0 ? (filas.length / eventosA.size).toFixed(1) : 0,
    promedioAsistentes_B: filas.length > 0 && eventosB.size > 0 ? (filas.length / eventosB.size).toFixed(1) : 0
  };
}

export function crearDashboardEncuentrosCiudad({ filas, campos, validacion }) {
  // KPIs principales
  const totalRegistros = filas.length;
  const eventos = calcularEventos(
    filas,
    campos.fechaEvento,
    campos.lugarEvento,
    campos.comunaEvento
  );

  // Análisis de contacto
  const tieneCelular = analizarSiNo(filas, campos.tieneCelular);
  const tieneCorreo = analizarSiNo(filas, campos.tieneCorreo);

  // Análisis de conocimiento de la contraloría
  const conoceContraloria = analizarSiNo(filas, campos.conoceContraloria);

  // Análisis de interés en volver
  const interesVolver = analizarSiNo(filas, campos.interesVolver);

  // Distribuciones
  const porSexo = contarPorCampo(filas, campos.sexo);
  const porRangoEdad = contarPorCampo(filas, campos.rangoEdad);
  const porComuna = contarPorCampo(filas, campos.comuna);
  const porSatisfaccion = contarPorCampo(filas, campos.satisfaccionEvento);

  // Análisis temporal (por año)
  const registrosPorAño = {};
  if (campos.fechaEvento) {
    for (const fila of filas) {
      const fecha = fila[campos.fechaEvento];
      if (fecha && String(fecha).trim() !== "") {
        try {
          const partes = String(fecha).trim().split('/');
          if (partes.length === 3) {
            const año = parseInt(partes[2]);
            if (año >= 1900 && año <= 2100) {
              registrosPorAño[año] = (registrosPorAño[año] || 0) + 1;
            }
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
    }
  }

  // Preparar datos de satisfacción (excluyendo no informados)
  const satisfaccionConDato = porSatisfaccion.filter(
    item => !["(VACÍO)", "no encuestado", "N/A", "sin información", "no responde"].includes(item.categoria)
  );

  // Calcular métricas de satisfacción
  let excelenteMasbueno = 0;
  for (const item of satisfaccionConDato) {
    if (["excelente", "exe", "Excelente ", "excelente", "bueno", "buena"].includes(item.categoria.toLowerCase())) {
      excelenteMasbueno += item.total;
    }
  }
  const satisfaccionPositiva = satisfaccionConDato.length > 0
    ? calcularPorcentaje(excelenteMasbueno, satisfaccionConDato.reduce((sum, item) => sum + item.total, 0))
    : 0;

  return {
    // KPIs principales
    totalRegistros,
    totalEventosProvisional: eventos.definicion_fecha_lugar,
    totalEventosAlternativa: eventos.definicion_fecha_lugar_comuna,
    promedioAsistentesProvisional: eventos.promedioAsistentes_A,
    promedioAsistentesAlternativa: eventos.promedioAsistentes_B,

    // Nota sobre definición provisional de evento
    notaDefinicionEvento:
      "PROVISIONAL: Usa FECHA + LUGAR como clave de evento. Pendiente confirmar definición institucional.",

    // Contacto
    tieneCelular: {
      ...tieneCelular,
      porcentajeSobreRespondidos: calcularPorcentaje(tieneCelular.si, tieneCelular.total)
    },

    tieneCorreo: {
      ...tieneCorreo,
      porcentajeSobreRespondidos: calcularPorcentaje(tieneCorreo.si, tieneCorreo.total)
    },

    // Conocimiento institucional
    conoceContraloria: {
      ...conoceContraloria,
      porcentajeSobreRespondidos: calcularPorcentaje(conoceContraloria.si, conoceContraloria.total)
    },

    // Interés en participar nuevamente
    interesVolver: {
      ...interesVolver,
      porcentajeSobreRespondidos: calcularPorcentaje(interesVolver.si, interesVolver.total)
    },

    // Satisfacción
    satisfaccionEvento: {
      conDato: satisfaccionConDato.length > 0 ? satisfaccionConDato.reduce((sum, item) => sum + item.total, 0) : 0,
      sinDato: filas.length - (satisfaccionConDato.length > 0 ? satisfaccionConDato.reduce((sum, item) => sum + item.total, 0) : 0),
      porcentajePositivo: satisfaccionPositiva,
      distribucion: porSatisfaccion
    },

    // Distribuciones demográficas
    porSexo,
    porRangoEdad,
    porComuna,

    // Series temporales
    registrosPorAño,

    // Metadata comparación con PBIX
    comparacionPbix: {
      pagina: "Encuentros de Ciudad",
      pageId: "fe75146cb079345ede3a",
      metricas: [
        {
          nombre: "Total Encuentros",
          rawValue: eventos.definicion_fecha_lugar,
          estado: "PENDIENTE_CONFIRMACION_DAX"
        },
        {
          nombre: "Promedio Asistentes por Encuentro",
          rawValue: eventos.promedioAsistentes_A,
          estado: "PENDIENTE_CONFIRMACION_DAX"
        }
      ]
    },

    // Información de diagnóstico
    diagnostico: {
      totalFilas: filas.length,
      filasConAñoReconocido: validacion?.resumen?.diagnosticoFechas?.filasConAñoReconocido || 0,
      filasSinAño: validacion?.resumen?.diagnosticoFechas?.diferencia || 0,
      categoriasDetectadas: validacion?.categoriasDetectadas || {}
    }
  };
}
