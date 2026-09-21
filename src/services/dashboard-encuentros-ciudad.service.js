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
  const resultado = {
    si: 0,
    no: 0,
    noInformado: 0,
    total: 0,
    porcentajeSi: 0
  };

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

function obtenerAno(fecha) {
  const texto = String(fecha ?? "").trim();
  if (!texto) return null;
  const partes = texto.split("/");
  if (partes.length === 3) {
    let ano = Number(partes[2]);
    if (ano >= 0 && ano < 100) ano += 2000;
    if (ano >= 1900 && ano <= 2100) return ano;
  }
  const parsed = new Date(texto);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

function contarPorAno(filas, campoFecha) {
  const conteo = {};
  let sinAno = 0;

  for (const fila of filas) {
    const ano = obtenerAno(fila[campoFecha]);
    if (!ano) sinAno++;
    else conteo[ano] = (conteo[ano] || 0) + 1;
  }

  return {
    conteo,
    serie: Object.entries(conteo)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => Number(a.categoria) - Number(b.categoria)),
    sinAno
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

  const respondidos = mujeres + hombres;
  return {
    mujeres,
    hombres,
    noInforma,
    respondidos,
    porcentajeMujeres: calcularPorcentaje(mujeres, respondidos),
    porcentajeHombres: calcularPorcentaje(hombres, respondidos)
  };
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
  const porComuna = contarPorCampo(filas, "Comuna Normalizada");
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
    porcentajeMujeres: sexo.porcentajeMujeres,
    porcentajeHombres: sexo.porcentajeHombres,
    totalEncuentros,
    promedioAsistentesPorEncuentro: promedioAsistentes
  };

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
      filtroComuna: porComuna
    },
    visualesPbix: [
      { id: "827b37260a9e953de546", tipo: "cardVisual", medida: "Total Asistentes", valorLocal: totalRegistros },
      { id: "97ad86ae0da59c9349d5", tipo: "cardVisual", medida: "% Mujeres Asistentes", valorLocal: sexo.porcentajeMujeres },
      { id: "a7cd624f6698b0fa0280", tipo: "cardVisual", medida: "% Hombres Asistentes", valorLocal: sexo.porcentajeHombres },
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
      "PBIX usa la medida Total Encuentros, pero el DAX no es extraible desde el PBIX local. El valor local usa FECHA DEL EVENTO + LUGAR DEL EVENTO.",

    tieneCelular: {
      ...tieneCelular,
      porcentajeSobreRespondidos: tieneCelular.porcentajeSi
    },
    tieneCorreo: {
      ...tieneCorreo,
      porcentajeSobreRespondidos: tieneCorreo.porcentajeSi
    },
    conoceContraloria: {
      ...conoceContraloria,
      porcentajeSobreRespondidos: conoceContraloria.porcentajeSi
    },
    interesVolver: {
      ...interesVolver,
      porcentajeSobreRespondidos: interesVolver.porcentajeSi
    },

    satisfaccionEvento: {
      conDato: porSatisfaccion.reduce((sum, item) => sum + item.total, 0),
      sinDato: totalRegistros - porSatisfaccion.reduce((sum, item) => sum + item.total, 0),
      distribucion: porSatisfaccion
    },

    porSexo,
    porRangoEdad,
    porComuna,
    porCanalAtencion,
    registrosPorAño: registrosPorAno.conteo,

    dashboardInstitucional,
    dashboardNormalizado: {
      kpis: kpisInstitucionales,
      graficas: {
        asistentesPorAno: registrosPorAno.serie,
        asistentesPorComuna: porComuna,
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
      metricas: [
        { nombre: "Total Asistentes", rawValue: totalRegistros, pbixValue: null, estado: "PBIX_DAX_NO_EXTRAIBLE" },
        { nombre: "Total Encuentros", rawValue: totalEncuentros, pbixValue: null, estado: "PBIX_DAX_NO_EXTRAIBLE" },
        { nombre: "Promedio Asistentes por Encuentro", rawValue: promedioAsistentes, pbixValue: null, estado: "PBIX_DAX_NO_EXTRAIBLE" }
      ],
      candidatosDefinicionEvento: eventos.candidatos
    },

    diagnostico: {
      totalFilas: totalRegistros,
      filasConAñoReconocido: validacion?.resumen?.diagnosticoFechas?.filasConAñoReconocido || 0,
      filasSinAño: validacion?.resumen?.diagnosticoFechas?.diferencia || 0,
      registrosPorAno,
      categoriasDetectadas: validacion?.categoriasDetectadas || {}
    }
  };
}
