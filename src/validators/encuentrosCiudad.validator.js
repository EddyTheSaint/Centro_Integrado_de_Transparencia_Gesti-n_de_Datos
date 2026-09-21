import { buscarHeader, canon } from "./utils.js";

// Campos esperados en Encuentros de Ciudad
const CAMPOS = {
  fechaEvento: ["FECHA DEL EVENTO", "FECHA DEL EVENTO"],
  lugarEvento: ["LUGAR DEL EVENTO", "LUGAR DEL EVENTO"],
  comunaEvento: ["Comuna/Evento", "COMUNA EVENTO", "EVENTO"],
  comuna: ["COMUNA", "COMUNAS"],
  tieneCelular: ["TIENE CELULAR", "TIENE CELULAR ", "CELULAR"],
  tieneCorreo: ["TIENE CORREO ELECTRONICO", "CORREO ELECTRONICO", "CORREO"],
  sexo: ["SEXO", "GÉNERO", "GENDER"],
  barrio: ["barrio", "BARRIO", "NEIGHBORHOOD"],
  rangoEdad: ["rango de edad", "RANGO DE EDAD", "EDAD", "AGE_RANGE"]
};

// Campos opcionales pero informativos
const CAMPOS_OPCIONALES = {
  escolaridad: ["escolaridad", "ESCOLARIDAD", "EDUCATION"],
  actividadEconomica: ["actividad económica", "ACTIVIDAD ECONOMICA"],
  organizacionSocial: ["¿hace parte de alguna organización social?", "ORGANIZACION"],
  conoceContraloria: ["¿conoce la contraloría distrital de Medellín y sabe que hace?"],
  temasInteres: ["¿en que temas le gustaría participar?"],
  satisfaccionEvento: ["Cual es su Nivel de satisfacción frente al evento que participo?", "SATISFACCION"],
  canalAtencion: ["a través de que canal de atención dispuesto por la contraloría distrital de Medellín se entero del evento?"],
  satisfaccionCanal: ["cual es el nivel de satisfacción del medio del cual se entero del evento?"],
  aportarFormacion: ["considera usted que la contraloría general de Medellín , además de hacer control fiscal, debe aportar en procesos de formación en participación ciudadana?"],
  evaluacionCapacitacion: ["para usted, los espacios de capacitación, realizados por la contraloría general de Medellín son?"],
  metodologiaFacilitador: ["la metodología utilizada por el facilitador de la Contraloría General de Medellín le pareció:"],
  capacidadPedagogica: ["la persona que dirigió la capacitación evidencia manejo del tema y capacidad pedológica para transmitir su conocimiento?"],
  interesVolver: ["Le interesaría participar en otro taller de formación en participación ciudadana realizado por la Contraloría General de Medellín?"],
  otrosTemas: ["En que otros temas considera usted, que la Contraloría General de Medellín podría apoyar el proceso de formación ?"],
  sugerencias: ["Tiene alguna sugerencia para mejorar los eventos de participación ciudadana de la contraloría distrital de Medellín?"]
};

function resolver(headers, filas = []) {
  const headersReales = [];
  const vistos = new Set();
  for (const header of [...Object.keys(filas?.[0] || {}), ...headers].filter(Boolean)) {
    const clave = canon(header);
    if (!vistos.has(clave)) {
      headersReales.push(header);
      vistos.add(clave);
    }
  }
  const campos = {};

  // Campos críticos
  for (const [k, v] of Object.entries(CAMPOS)) {
    campos[k] = buscarHeader(headersReales, v);
  }

  // Campos opcionales
  for (const [k, v] of Object.entries(CAMPOS_OPCIONALES)) {
    campos[k] = buscarHeader(headersReales, v);
  }

  return campos;
}

function diagnosticarFechas(filas, campoFecha) {
  const diagnostico = {
    totalFilas: filas.length,
    filasConAñoReconocido: 0,
    filasSinFecha: 0,
    filasFechaInvalida: 0,
    porAño: {},
    variantes: new Map()
  };

  filas.forEach((fila, i) => {
    const fecha = fila[campoFecha];

    if (!fecha || String(fecha).trim() === "") {
      diagnostico.filasSinFecha++;
      return;
    }

    try {
      // Intentar parsear fecha en formato dd/MM/yyyy
      const partes = String(fecha).trim().split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]);
        let año = parseInt(partes[2]);
        if (año >= 0 && año < 100) año += 2000;

        if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12 && año >= 1900 && año <= 2100) {
          diagnostico.filasConAñoReconocido++;
          diagnostico.porAño[año] = (diagnostico.porAño[año] || 0) + 1;
          return;
        }
      }

      // Intentar parsear como número serial Excel
      const num = Number(fecha);
      if (!isNaN(num) && num > 30000 && num < 50000) {
        const dt = new Date((num - 25569) * 86400000);
        const año = dt.getFullYear();
        diagnostico.filasConAñoReconocido++;
        diagnostico.porAño[año] = (diagnostico.porAño[año] || 0) + 1;

        const variante = String(fecha);
        diagnostico.variantes.set(variante, (diagnostico.variantes.get(variante) || 0) + 1);
        return;
      }
    } catch (e) {
      // No es parseable
    }

    diagnostico.filasFechaInvalida++;
    const variante = String(fecha).substring(0, 30);
    diagnostico.variantes.set(variante, (diagnostico.variantes.get(variante) || 0) + 1);
  });

  diagnostico.diferencia = diagnostico.totalFilas - diagnostico.filasConAñoReconocido;
  diagnostico.variantes = Array.from(diagnostico.variantes).map(([v, c]) => ({ variante: v, cantidad: c }));

  return diagnostico;
}

export default {
  version: "ENCUENTROS_CIUDAD-v0.1",

  validar({ headers, filas }) {
    const campos = resolver(headers, filas);
    const errores = [];
    const advertencias = [];

    // Validar campos críticos
    const camposCriticos = ["fechaEvento", "lugarEvento", "comunaEvento", "comuna", "sexo", "barrio", "rangoEdad"];

    for (const campo of camposCriticos) {
      if (!campos[campo]) {
        errores.push({
          regla: "EC-ESTRUCTURA",
          campo,
          mensaje: `No se encontró columna compatible para ${campo}.`
        });
      }
    }

    // Advertencias por campos opcionales
    if (!campos.escolaridad) {
      advertencias.push({
        regla: "EC-ESCOLARIDAD-FALTANTE",
        mensaje: "No se encontró columna ESCOLARIDAD."
      });
    }

    if (!campos.actividadEconomica) {
      advertencias.push({
        regla: "EC-ACTIVIDAD-FALTANTE",
        mensaje: "No se encontró columna ACTIVIDAD ECONOMICA."
      });
    }

    if (errores.length) {
      return {
        valido: false,
        errores,
        advertencias,
        campos,
        resumen: { totalFilas: filas.length, headersDetectados: headers }
      };
    }

    // Diagnóstico de fechas
    const diagnosticoFechas = diagnosticarFechas(filas, campos.fechaEvento);
    if (diagnosticoFechas.diferencia > 0) {
      advertencias.push({
        regla: "EC-FECHAS-SIN-AÑO",
        mensaje: `${diagnosticoFechas.diferencia} registros con fechas no reconocidas o vacías.`
      });
    }

    // Análisis de variantes
    const categoriasDetectadas = {
      años: Object.keys(diagnosticoFechas.porAño),
      sexos: new Set(),
      rangosEdad: new Set(),
      comunas: new Set(),
      barrios: new Set(),
      eventos_fecha_lugar: new Set(),
      eventos_fecha_lugar_comuna: new Set()
    };

    const variantes = {
      sexos: new Map(),
      rangosEdad: new Map(),
      comunas: new Map(),
      barrios: new Map(),
      tieneCelular: new Map(),
      tieneCorreo: new Map(),
      interesVolver: new Map(),
      canalAtencion: new Map(),
      satisfaccionEvento: new Map()
    };

    let filasValidas = 0;
    let filasConSexoVacio = 0;
    let filasConEdadVacio = 0;
    let filasConComunaVacio = 0;

    filas.forEach((fila, i) => {
      // Contar registros válidos
      if (fila[campos.fechaEvento]) {
        filasValidas++;
      }

      // Detectar variantes de SEXO
      const sexo = fila[campos.sexo];
      if (sexo) {
        const limpio = String(sexo).trim();
        categoriasDetectadas.sexos.add(limpio);
        variantes.sexos.set(limpio, (variantes.sexos.get(limpio) || 0) + 1);
      } else {
        filasConSexoVacio++;
      }

      // Detectar variantes de RANGO DE EDAD
      const edad = fila[campos.rangoEdad];
      if (edad) {
        const limpio = String(edad).trim();
        categoriasDetectadas.rangosEdad.add(limpio);
        variantes.rangosEdad.set(limpio, (variantes.rangosEdad.get(limpio) || 0) + 1);
      } else {
        filasConEdadVacio++;
      }

      // Detectar variantes de COMUNA
      const comuna = fila[campos.comuna];
      if (comuna) {
        const limpio = String(comuna).trim();
        categoriasDetectadas.comunas.add(limpio);
        variantes.comunas.set(limpio, (variantes.comunas.get(limpio) || 0) + 1);
      } else {
        filasConComunaVacio++;
      }

      // Detectar variantes de BARRIO
      const barrio = fila[campos.barrio];
      if (barrio) {
        const limpio = String(barrio).trim();
        variantes.barrios.set(limpio, (variantes.barrios.get(limpio) || 0) + 1);
      }

      // Detectar variantes de TIENE CELULAR
      if (campos.tieneCelular && fila[campos.tieneCelular]) {
        const val = String(fila[campos.tieneCelular]).trim();
        variantes.tieneCelular.set(val, (variantes.tieneCelular.get(val) || 0) + 1);
      }

      // Detectar variantes de TIENE CORREO
      if (campos.tieneCorreo && fila[campos.tieneCorreo]) {
        const val = String(fila[campos.tieneCorreo]).trim();
        variantes.tieneCorreo.set(val, (variantes.tieneCorreo.get(val) || 0) + 1);
      }

      if (campos.interesVolver && fila[campos.interesVolver]) {
        const val = String(fila[campos.interesVolver]).trim();
        variantes.interesVolver.set(val, (variantes.interesVolver.get(val) || 0) + 1);
      }

      if (campos.canalAtencion && fila[campos.canalAtencion]) {
        const val = String(fila[campos.canalAtencion]).trim();
        variantes.canalAtencion.set(val, (variantes.canalAtencion.get(val) || 0) + 1);
      }

      if (campos.satisfaccionEvento && fila[campos.satisfaccionEvento]) {
        const val = String(fila[campos.satisfaccionEvento]).trim();
        variantes.satisfaccionEvento.set(val, (variantes.satisfaccionEvento.get(val) || 0) + 1);
      }

      // Detectar eventos (dos definiciones)
      if (fila[campos.fechaEvento] && fila[campos.lugarEvento]) {
        const evento_A = fila[campos.fechaEvento] + "|" + fila[campos.lugarEvento];
        categoriasDetectadas.eventos_fecha_lugar.add(evento_A);

        if (fila[campos.comunaEvento]) {
          const evento_B = evento_A + "|" + fila[campos.comunaEvento];
          categoriasDetectadas.eventos_fecha_lugar_comuna.add(evento_B);
        }
      }
    });

    // Advertencias de datos faltantes altos
    if (filasConEdadVacio > filas.length * 0.6) {
      advertencias.push({
        regla: "EC-EDAD-FALTANTE-ALTO",
        mensaje: `${filasConEdadVacio} registros sin datos de rango de edad (${((filasConEdadVacio / filas.length) * 100).toFixed(1)}%).`
      });
    }

    if (filasConSexoVacio > filas.length * 0.1) {
      advertencias.push({
        regla: "EC-SEXO-FALTANTE",
        mensaje: `${filasConSexoVacio} registros sin datos de sexo.`
      });
    }

    // Detectar valores sospechosos
    const comunasSospechosas = Array.from(categoriasDetectadas.comunas).filter(c =>
      c === "varias" || c === "8"
    );
    if (comunasSospechosas.length > 0) {
      advertencias.push({
        regla: "EC-COMUNA-SOSPECHOSA",
        mensaje: `Se detectaron comunas con valores problemáticos: ${comunasSospechosas.join(", ")}`
      });
    }

    return {
      valido: !errores.length,
      errores,
      advertencias,
      campos,
      resumen: {
        totalFilas: filas.length,
        filasValidas,
        filasConEdadVacio,
        filasConSexoVacio,
        filasConComunaVacio,
        headersDetectados: headers,
        diagnosticoFechas
      },
      categoriasDetectadas: {
        años: diagnosticoFechas.porAño,
        sexos: Array.from(categoriasDetectadas.sexos),
        rangosEdad: Array.from(categoriasDetectadas.rangosEdad),
        comunas: Array.from(categoriasDetectadas.comunas),
        eventosDefinicion_A: categoriasDetectadas.eventos_fecha_lugar.size,
        eventosDefinicion_B: categoriasDetectadas.eventos_fecha_lugar_comuna.size
      },
      variantes: {
        sexos: Array.from(variantes.sexos).map(([k, v]) => ({ valor: k, cantidad: v })),
        rangosEdad: Array.from(variantes.rangosEdad).map(([k, v]) => ({ valor: k, cantidad: v })),
        comunas: Array.from(variantes.comunas).map(([k, v]) => ({ valor: k, cantidad: v })),
        tieneCelular: Array.from(variantes.tieneCelular).map(([k, v]) => ({ valor: k, cantidad: v })),
        tieneCorreo: Array.from(variantes.tieneCorreo).map(([k, v]) => ({ valor: k, cantidad: v })),
        interesVolver: Array.from(variantes.interesVolver).map(([k, v]) => ({ valor: k, cantidad: v })),
        canalAtencion: Array.from(variantes.canalAtencion).map(([k, v]) => ({ valor: k, cantidad: v })),
        satisfaccionEvento: Array.from(variantes.satisfaccionEvento).map(([k, v]) => ({ valor: k, cantidad: v }))
      }
    };
  }
};
