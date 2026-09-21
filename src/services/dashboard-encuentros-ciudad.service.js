import { canon } from "../validators/utils.js";

function contarPorCampo(filas, campo, opciones = {}) {
  if (!campo) return [];
  const excluir = new Set((opciones.excluir || []).map(canon));
  const conteo = new Map();

  for (const fila of filas) {
    const valor = fila[campo];
    const etiqueta = valor == null || String(valor).trim() === "" ? "(VACIO)" : String(valor).trim();
    if (excluir.has(canon(etiqueta))) continue;
    conteo.set(etiqueta, (conteo.get(etiqueta) || 0) + 1);
  }

  return [...conteo.entries()]
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total || a.categoria.localeCompare(b.categoria));
}

function calcularPorcentaje(conDato, totalDatos) {
  if (!totalDatos) return 0;
  return Number(((conDato / totalDatos) * 100).toFixed(1));
}

function normalizarSiNo(valor) {
  const c = canon(valor);
  if (c === "SI" || c === "S") return "SI";
  if (c === "NO") return "NO";
  return "NO_INFORMADO";
}

function analizarSiNo(filas, campo) {
  const resultado = { si: 0, no: 0, noInformado: 0, total: 0, porcentajeSi: 0 };

  if (!campo) {
    resultado.noInformado = filas.length;
    return resultado;
  }

  for (const fila of filas) {
    const valor = normalizarSiNo(fila[campo]);
    if (valor === "SI") resultado.si++;
    else if (valor === "NO") resultado.no++;
    else resultado.noInformado++;
  }

  resultado.total = resultado.si + resultado.no;
  resultado.porcentajeSi = calcularPorcentaje(resultado.si, resultado.total);
  return resultado;
}

function valorTexto(fila, campo) {
  return campo && fila[campo] != null ? String(fila[campo]).trim() : "";
}

function normalizarAnoDosDigitos(ano) {
  return ano >= 0 && ano < 100 ? 2000 + ano : ano;
}

function fechaValida(ano, mes, dia) {
  const fecha = new Date(Date.UTC(ano, mes - 1, dia));
  return fecha.getUTCFullYear() === ano && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function obtenerAnoDetallado(fecha) {
  if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
    return { ano: fecha.getFullYear(), interpretacion: "Date JS" };
  }

  if (typeof fecha === "number" && fecha > 30000 && fecha < 60000) {
    const dt = new Date((fecha - 25569) * 86400000);
    return { ano: dt.getUTCFullYear(), interpretacion: "serial Excel" };
  }

  const texto = String(fecha ?? "").trim();
  if (!texto) return { ano: null, interpretacion: "vacio" };

  const ymd = texto.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+.*)?$/);
  if (ymd) {
    const ano = Number(ymd[1]);
    const mes = Number(ymd[2]);
    const dia = Number(ymd[3]);
    if (fechaValida(ano, mes, dia)) return { ano, interpretacion: "texto yyyy-MM-dd" };
  }

  const dmyOmdy = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+.*)?$/);
  if (dmyOmdy) {
    const a = Number(dmyOmdy[1]);
    const b = Number(dmyOmdy[2]);
    const ano = normalizarAnoDosDigitos(Number(dmyOmdy[3]));
    const ddmmyyyy = fechaValida(ano, b, a);
    const mmddyyyy = fechaValida(ano, a, b);

    if (ddmmyyyy && !mmddyyyy) return { ano, interpretacion: "texto dd/MM/yyyy inequivoco" };
    if (mmddyyyy && !ddmmyyyy) return { ano, interpretacion: "texto MM/dd/yyyy inequivoco" };
    if (ddmmyyyy && mmddyyyy) {
      return { ano, interpretacion: "año inequivoco con dia/mes ambiguo" };
    }
  }

  const parsed = new Date(texto);
  if (!Number.isNaN(parsed.getTime())) {
    return { ano: parsed.getFullYear(), interpretacion: "Date.parse texto" };
  }

  return { ano: null, interpretacion: "formato no reconocido" };
}

function contarPorAno(filas, campoFecha) {
  const conteo = { SIN_AÑO_RECONOCIDO: 0 };
  const noReconocidas = new Map();

  filas.forEach((fila, index) => {
    const valor = fila[campoFecha];
    const resultado = obtenerAnoDetallado(valor);

    if (!resultado.ano) {
      conteo.SIN_AÑO_RECONOCIDO++;
      const key = `${String(valor ?? "").trim()}||${typeof valor}||${resultado.interpretacion}`;
      const actual = noReconocidas.get(key) || {
        valorOriginal: valor ?? null,
        cantidad: 0,
        typeof: typeof valor,
        ejemploFilas: [],
        interpretacionPosible: resultado.interpretacion
      };
      actual.cantidad++;
      if (actual.ejemploFilas.length < 5) actual.ejemploFilas.push(index + 2);
      noReconocidas.set(key, actual);
    } else {
      conteo[resultado.ano] = (conteo[resultado.ano] || 0) + 1;
    }
  });

  if (conteo.SIN_AÑO_RECONOCIDO === 0) delete conteo.SIN_AÑO_RECONOCIDO;

  return {
    conteo,
    serie: Object.entries(conteo)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => {
        if (a.categoria === "SIN_AÑO_RECONOCIDO") return 1;
        if (b.categoria === "SIN_AÑO_RECONOCIDO") return -1;
        return Number(a.categoria) - Number(b.categoria);
      }),
    totalConAno: filas.length - (conteo.SIN_AÑO_RECONOCIDO || 0),
    totalSinAno: conteo.SIN_AÑO_RECONOCIDO || 0,
    diagnosticoFechasNoReconocidas: Array.from(noReconocidas.values())
  };
}

function calcularEventos(filas, campos) {
  const candidatos = {
    fecha_lugar: new Set(),
    fecha_lugar_comunaEvento: new Set(),
    comunaEvento: new Set(),
    fecha: new Set(),
    fecha_lugar_comunaRaw: new Set()
  };

  for (const fila of filas) {
    const fecha = valorTexto(fila, campos.fechaEvento);
    const lugar = valorTexto(fila, campos.lugarEvento);
    const comunaEvento = valorTexto(fila, campos.comunaEvento);
    const comuna = valorTexto(fila, campos.comuna);

    if (fecha && lugar) candidatos.fecha_lugar.add(`${fecha}|${lugar}`);
    if (fecha && lugar && comunaEvento) candidatos.fecha_lugar_comunaEvento.add(`${fecha}|${lugar}|${comunaEvento}`);
    if (comunaEvento) candidatos.comunaEvento.add(comunaEvento);
    if (fecha) candidatos.fecha.add(fecha);
    if (fecha && lugar && comuna) candidatos.fecha_lugar_comunaRaw.add(`${fecha}|${lugar}|${comuna}`);
  }

  const totalA = candidatos.fecha_lugar.size;
  const totalB = candidatos.fecha_lugar_comunaEvento.size;

  return {
    definicion_fecha_lugar: totalA,
    definicion_fecha_lugar_comuna: totalB,
    promedioAsistentes_A: totalA ? Number((filas.length / totalA).toFixed(1)) : 0,
    promedioAsistentes_B: totalB ? Number((filas.length / totalB).toFixed(1)) : 0,
    candidatos: {
      A_FECHA_LUGAR: totalA,
      B_FECHA_LUGAR_COMUNA_EVENTO: totalB,
      C_DISTINCT_COMUNA_EVENTO: candidatos.comunaEvento.size,
      D_DISTINCT_FECHA: candidatos.fecha.size,
      E_FECHA_LUGAR_COMUNA_RAW: candidatos.fecha_lugar_comunaRaw.size
    }
  };
}

function calcularSexo(filas, campoSexoNormalizado, campoSexoOriginal) {
  let mujeres = 0;
  let hombres = 0;
  let noInforma = 0;

  for (const fila of filas) {
    const valor = canon(fila[campoSexoNormalizado] ?? fila[campoSexoOriginal]);
    if (valor === "FEMENINO" || valor === "F") mujeres++;
    else if (valor === "MASCULINO" || valor === "M") hombres++;
    else noInforma++;
  }

  const totalSexoInformado = mujeres + hombres;
  return {
    femenino: mujeres,
    masculino: hombres,
    noInformado: noInforma,
    mujeres,
    hombres,
    noInforma,
    totalSexoInformado,
    totalSexoNoInformado: noInforma,
    porcentajeMujeresSobreTotal: calcularPorcentaje(mujeres, filas.length),
    porcentajeHombresSobreTotal: calcularPorcentaje(hombres, filas.length),
    porcentajeMujeresSobreSexoInformado: calcularPorcentaje(mujeres, totalSexoInformado),
    porcentajeHombresSobreSexoInformado: calcularPorcentaje(hombres, totalSexoInformado)
  };
}

function compararMetrica(nombre, pbix, cargador) {
  return {
    metrica: nombre,
    pbix,
    cargador,
    diferencia: typeof pbix === "number" && typeof cargador === "number" ? Number((cargador - pbix).toFixed(1)) : null,
    estado: pbix == null ? "PBIX_SIN_VALOR_RENDERIZADO_EXTRAIBLE" : pbix === cargador ? "COINCIDE" : "DIFIERE"
  };
}

function totalCategoria(items, categoria) {
  return items.find(item => item.categoria === categoria)?.total || 0;
}

export function crearDashboardEncuentrosCiudad({ filas, campos, validacion }) {
  const totalRegistros = filas.length;
  const eventos = calcularEventos(filas, campos);
  const registrosPorAno = contarPorAno(filas, campos.fechaEvento);
  const sexo = calcularSexo(filas, "Sexo Normalizado", campos.sexo);

  const tieneCelular = analizarSiNo(filas, campos.tieneCelular);
  const tieneCorreo = analizarSiNo(filas, campos.tieneCorreo);
  const conoceContraloria = analizarSiNo(filas, campos.conoceContraloria);
  const interesVolver = analizarSiNo(filas, campos.interesVolver);

  const porSexo = contarPorCampo(filas, "Sexo Normalizado");
  const porRangoEdad = contarPorCampo(filas, campos.rangoEdad);
  const porComunaOriginal = contarPorCampo(filas, "_COMUNA_ORIGINAL");
  const porComuna = contarPorCampo(filas, "COMUNA_NORMALIZADA");
  const porSatisfaccion = contarPorCampo(filas, "Nivel de Satisfacción Normalizado", {
    excluir: ["N/A", "No Encuestado", "No informa"]
  });
  const porConoceContraloria = contarPorCampo(filas, "Conoce la Contraloría Normalizado", {
    excluir: ["No informa"]
  });
  const porCanalAtencion = contarPorCampo(filas, campos.canalAtencion);

  const totalEncuentros = eventos.definicion_fecha_lugar;
  const promedioAsistentes = eventos.promedioAsistentes_A;

  const kpisInstitucionales = {
    totalAsistentes: totalRegistros,
    criterioPorcentajeMujeres: "SEXO_INFORMADO_POR_COMPATIBILIDAD_CON_MEDIDA_PBIX_NO_EXTRAIBLE",
    porcentajeMujeres: sexo.porcentajeMujeresSobreSexoInformado,
    porcentajeHombres: sexo.porcentajeHombresSobreSexoInformado,
    totalSexoInformado: sexo.totalSexoInformado,
    totalSexoNoInformado: sexo.totalSexoNoInformado,
    totalEncuentros,
    promedioAsistentesPorEncuentro: promedioAsistentes
  };

  const tablaComparacionPbix = [
    compararMetrica("% Mujeres", null, sexo.porcentajeMujeresSobreSexoInformado),
    compararMetrica("Asistentes por año", null, registrosPorAno.conteo),
    compararMetrica("Asistentes por comuna normalizada", null, porComuna),
    compararMetrica("8 VILLAHERMOSA", null, totalCategoria(porComuna, "8 VILLAHERMOSA")),
    compararMetrica("9 BUENOS AIRES", null, totalCategoria(porComuna, "9 BUENOS AIRES")),
    compararMetrica("80 SAN ANTONIO DE PRADO", null, totalCategoria(porComuna, "80 SAN ANTONIO DE PRADO")),
    compararMetrica("5 CASTILLA", null, totalCategoria(porComuna, "5 CASTILLA")),
    compararMetrica("1 POPULAR", null, totalCategoria(porComuna, "1 POPULAR"))
  ];

  const dashboardInstitucional = {
    pagina: "Encuentros de Ciudad",
    pageId: "fe75146cb079345ede3a",
    fuente: "referencias/OBSERVATORIO.pbix",
    estadoDax: "NO_EXTRAIBLE_DESDE_PBIX_LOCAL",
    kpis: kpisInstitucionales,
    graficas: {
      satisfaccionEvento: porSatisfaccion,
      conoceContraloria: porConoceContraloria,
      filtroAno: registrosPorAno.serie,
      filtroComuna: porComuna,
      asistentesPorComuna: porComuna,
      asistentesPorAno: registrosPorAno.serie
    },
    visualesPbix: [
      { id: "827b37260a9e953de546", tipo: "cardVisual", medida: "Total Asistentes", valorLocal: totalRegistros },
      { id: "97ad86ae0da59c9349d5", tipo: "cardVisual", medida: "% Mujeres Asistentes", valorLocal: sexo.porcentajeMujeresSobreSexoInformado },
      { id: "a7cd624f6698b0fa0280", tipo: "cardVisual", medida: "% Hombres Asistentes", valorLocal: sexo.porcentajeHombresSobreSexoInformado },
      { id: "kp1EncTotalEnc0nt", tipo: "cardVisual", medida: "Total Encuentros", valorLocal: totalEncuentros },
      { id: "kp1EncPr0medi0As1", tipo: "cardVisual", medida: "Promedio Asistentes por Encuentro", valorLocal: promedioAsistentes },
      { id: "chtEncSat1sfacc10n", tipo: "barChart", categoria: "Nivel de Satisfacción Normalizado", valor: "Total Asistentes" },
      { id: "chtEncC0n0ceCtrl1a", tipo: "donutChart", categoria: "Conoce la Contraloría Normalizado", valor: "Total Asistentes" }
    ]
  };

  return {
    proceso: "ENCUENTROS_DE_CIUDAD",
    totalRegistros,
    totalEventosProvisional: totalEncuentros,
    totalEventosAlternativa: eventos.definicion_fecha_lugar_comuna,
    promedioAsistentesProvisional: promedioAsistentes,
    promedioAsistentesAlternativa: eventos.promedioAsistentes_B,
    notaDefinicionEvento:
      "PBIX usa medidas para Total Encuentros y % Mujeres, pero el DAX no es extraible desde el PBIX local. % Mujeres institucional queda calculado sobre sexo informado hasta confirmar el DAX.",

    tieneCelular: { ...tieneCelular, porcentajeSobreRespondidos: tieneCelular.porcentajeSi },
    tieneCorreo: { ...tieneCorreo, porcentajeSobreRespondidos: tieneCorreo.porcentajeSi },
    conoceContraloria: { ...conoceContraloria, porcentajeSobreRespondidos: conoceContraloria.porcentajeSi },
    interesVolver: { ...interesVolver, porcentajeSobreRespondidos: interesVolver.porcentajeSi },

    sexo,
    satisfaccionEvento: {
      conDato: porSatisfaccion.reduce((sum, item) => sum + item.total, 0),
      sinDato: totalRegistros - porSatisfaccion.reduce((sum, item) => sum + item.total, 0),
      distribucion: porSatisfaccion
    },

    porSexo,
    porRangoEdad,
    porComunaOriginal,
    porComuna,
    porComunaNormalizada: porComuna,
    porCanalAtencion,
    registrosPorAño: registrosPorAno.conteo,
    registrosPorAno: registrosPorAno.conteo,
    totalConAño: registrosPorAno.totalConAno,
    totalSinAño: registrosPorAno.totalSinAno,
    diagnosticoFechasNoReconocidas: registrosPorAno.diagnosticoFechasNoReconocidas,

    dashboardInstitucional,
    dashboardNormalizado: {
      kpis: {
        ...kpisInstitucionales,
        sexo,
        femenino: sexo.femenino,
        masculino: sexo.masculino,
        noInformado: sexo.noInformado,
        porcentajeMujeresSobreTotal: sexo.porcentajeMujeresSobreTotal,
        porcentajeMujeresSobreSexoInformado: sexo.porcentajeMujeresSobreSexoInformado,
        totalSexoInformado: sexo.totalSexoInformado,
        totalSexoNoInformado: sexo.totalSexoNoInformado
      },
      graficas: {
        asistentesPorAno: registrosPorAno.serie,
        asistentesPorComuna: porComuna,
        asistentesPorComunaOriginal: porComunaOriginal,
        asistentesPorSexo: porSexo,
        satisfaccionEvento: porSatisfaccion,
        conoceContraloria: porConoceContraloria,
        canalAtencion: porCanalAtencion
      }
    },

    comparacionPbix: {
      pagina: "Encuentros de Ciudad",
      pageId: "fe75146cb079345ede3a",
      valoresRenderizadosPbix: "NO_DISPONIBLES_EN_JSON_EXTRAIDO",
      tabla: tablaComparacionPbix,
      metricas: tablaComparacionPbix,
      candidatosDefinicionEvento: eventos.candidatos
    },

    diagnostico: {
      totalFilas: totalRegistros,
      filasConAñoReconocido: registrosPorAno.totalConAno,
      filasSinAño: registrosPorAno.totalSinAno,
      registrosPorAno,
      diagnosticoFechasNoReconocidas: registrosPorAno.diagnosticoFechasNoReconocidas,
      categoriasDetectadas: validacion?.categoriasDetectadas || {}
    }
  };
}
