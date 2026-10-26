import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import XLSX from "xlsx";

const GRAPH = "https://graph.microsoft.com/v1.0";
const HEADER_ALIASES = {
  id: ["ID"],
  proceso: ["PROCESO / OBSERVATORIO", "PROCESO", "OBSERVATORIO"],
  periodo: ["PERIODO REPORTADO", "PERIODO"],
  adjuntos: ["CARGA DE ARCHIVOS", "ARCHIVOS", "ARCHIVO"],
  fechaCorte: ["FECHA DE CORTE"],
  correo: ["CORREO ELECTRONICO"],
  nombre: ["NOMBRE"],
  observaciones: ["OBSERVACIONES"]
};

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function nombreSeguro(valor, alternativa = "SIN_DATO") {
  const limpio = normalizarTexto(valor)
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return limpio || alternativa;
}

function nombreArchivoSeguro(nombre) {
  const limpio = String(nombre || "archivo")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();
  return limpio || "archivo";
}

function obtenerArgumento(nombre) {
  const prefijo = `--${nombre}=`;
  return process.argv.find(argumento => argumento.startsWith(prefijo))?.slice(prefijo.length);
}

function esDryRun() {
  return process.argv.includes("--dry-run");
}

async function leerConfiguracion() {
  const ruta = path.resolve(obtenerArgumento("config") || "config/forms-sync.json");
  let configuracion;
  try {
    configuracion = JSON.parse(await fs.readFile(ruta, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer ${ruta}. Copie config/forms-sync.example.json como config/forms-sync.json. ${error.message}`);
  }

  for (const campo of ["responsesWorkbookUrl", "destinationRoot"]) {
    if (!configuracion[campo]) throw new Error(`Falta "${campo}" en ${ruta}.`);
  }
  return { ...configuracion, ruta };
}

async function obtenerTokenGraph() {
  if (process.env.MS_GRAPH_ACCESS_TOKEN) return process.env.MS_GRAPH_ACCESS_TOKEN;

  const { MS_TENANT_ID: tenant, MS_CLIENT_ID: clientId, MS_CLIENT_SECRET: clientSecret } = process.env;
  if (!tenant || !clientId || !clientSecret) {
    throw new Error("Faltan credenciales de Microsoft Graph. Configure MS_TENANT_ID, MS_CLIENT_ID y MS_CLIENT_SECRET (o, solo para una ejecución manual, MS_GRAPH_ACCESS_TOKEN).");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });
  const respuesta = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  if (!respuesta.ok) throw new Error(`No fue posible obtener el token de Microsoft Graph (${respuesta.status}): ${await respuesta.text()}`);
  return (await respuesta.json()).access_token;
}

function idCompartido(url) {
  return `u!${Buffer.from(url).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
}

async function obtenerArchivo(token, url) {
  const id = idCompartido(url);
  const cabeceras = { authorization: `Bearer ${token}` };
  const metadataRespuesta = await fetch(`${GRAPH}/shares/${id}/driveItem`, { headers: cabeceras });
  if (!metadataRespuesta.ok) {
    throw new Error(`No se pudo abrir el archivo de Forms (${metadataRespuesta.status}): ${await metadataRespuesta.text()}`);
  }
  const metadata = await metadataRespuesta.json();
  const descarga = await fetch(`${GRAPH}/shares/${id}/driveItem/content`, { headers: cabeceras });
  if (!descarga.ok) throw new Error(`No se pudo descargar "${metadata.name}" (${descarga.status}).`);
  return { nombre: metadata.name || "archivo", buffer: Buffer.from(await descarga.arrayBuffer()) };
}

function encontrarCampo(fila, alias) {
  const claves = Object.keys(fila);
  const clave = claves.find(candidata => alias.includes(normalizarTexto(candidata)));
  return clave ? fila[clave] : null;
}

function obtenerCampo(fila, nombre) {
  return encontrarCampo(fila, HEADER_ALIASES[nombre]);
}

function extraerUrls(valor) {
  if (valor == null) return [];
  if (Array.isArray(valor)) return valor.flatMap(extraerUrls);
  if (typeof valor === "object") {
    return [valor.link, valor.webUrl, valor.url, valor.downloadUrl].filter(Boolean).flatMap(extraerUrls);
  }
  const texto = String(valor).trim();
  if (!texto) return [];
  try {
    return extraerUrls(JSON.parse(texto));
  } catch {
    return (texto.match(/https?:\/\/[^\s,;]+/g) || []).map(url => url.replace(/[\])}>.,]+$/, ""));
  }
}

function normalizarPeriodo(valor) {
  const texto = String(valor ?? "").trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(texto) ? texto : nombreSeguro(texto, "SIN_PERIODO");
}

async function escribirJsonAtomico(ruta, contenido) {
  const temporal = `${ruta}.tmp`;
  await fs.writeFile(temporal, JSON.stringify(contenido, null, 2), "utf8");
  await fs.rename(temporal, ruta);
}

async function leerRegistro(ruta) {
  try {
    return JSON.parse(await fs.readFile(ruta, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { version: 1, respuestas: {} };
    throw error;
  }
}

function filasDeLibro(buffer) {
  const libro = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const primeraHoja = libro.SheetNames[0];
  if (!primeraHoja) throw new Error("El libro de respuestas no tiene hojas.");
  return XLSX.utils.sheet_to_json(libro.Sheets[primeraHoja], { defval: null, raw: false });
}

async function sincronizar() {
  const configuracion = await leerConfiguracion();
  const token = await obtenerTokenGraph();
  const { buffer } = await obtenerArchivo(token, configuracion.responsesWorkbookUrl);
  const filas = filasDeLibro(buffer);
  const raiz = path.resolve(configuracion.destinationRoot);
  const directorioControl = path.join(raiz, "00_CONTROL");
  const rutaRegistro = path.join(directorioControl, "registro_respuestas_forms.json");

  if (!esDryRun()) await fs.mkdir(directorioControl, { recursive: true });
  const registro = esDryRun() ? { version: 1, respuestas: {} } : await leerRegistro(rutaRegistro);
  const resumen = { leidas: filas.length, guardadas: 0, omitidas: 0, errores: [] };

  for (let indice = 0; indice < filas.length; indice += 1) {
    const fila = filas[indice];
    const idForms = String(obtenerCampo(fila, "id") ?? indice + 1).trim();
    const urls = [...new Set(extraerUrls(obtenerCampo(fila, "adjuntos")))];
    if (!urls.length) {
      resumen.omitidas += 1;
      continue;
    }

    const proceso = nombreSeguro(obtenerCampo(fila, "proceso"), "SIN_PROCESO");
    const periodo = normalizarPeriodo(obtenerCampo(fila, "periodo"));
    const idCarpeta = `FORMS_${nombreSeguro(idForms, String(indice + 1))}`;
    const destino = path.join(raiz, proceso, periodo, idCarpeta, "01_RAW");
    const clave = idForms;
    const previo = registro.respuestas[clave];
    if (previo?.estado === "COMPLETADO" && previo.urls?.join("|") === urls.join("|")) {
      resumen.omitidas += 1;
      continue;
    }

    try {
      const archivos = [];
      if (!esDryRun()) await fs.mkdir(destino, { recursive: true });
      for (const url of urls) {
        const archivo = await obtenerArchivo(token, url);
        const nombre = nombreArchivoSeguro(archivo.nombre);
        const rutaArchivo = path.join(destino, nombre);
        if (!esDryRun()) await fs.writeFile(rutaArchivo, archivo.buffer, { flag: "wx" }).catch(error => {
          if (error.code !== "EEXIST") throw error;
        });
        archivos.push(path.relative(raiz, rutaArchivo).replace(/\\/g, "/"));
      }

      if (!esDryRun()) {
        registro.respuestas[clave] = {
          estado: "COMPLETADO",
          id_forms: idForms,
          proceso,
          periodo,
          fecha_corte: obtenerCampo(fila, "fechaCorte"),
          correo: obtenerCampo(fila, "correo"),
          nombre: obtenerCampo(fila, "nombre"),
          observaciones: obtenerCampo(fila, "observaciones"),
          urls,
          archivos,
          sincronizado_en: new Date().toISOString()
        };
        await escribirJsonAtomico(rutaRegistro, registro);
      }
      resumen.guardadas += 1;
    } catch (error) {
      resumen.errores.push({ id_forms: idForms, mensaje: error.message });
      if (!esDryRun()) {
        registro.respuestas[clave] = { estado: "ERROR", id_forms: idForms, urls, error: error.message, actualizado_en: new Date().toISOString() };
        await escribirJsonAtomico(rutaRegistro, registro);
      }
    }
  }

  console.log(JSON.stringify({ ...resumen, modo: esDryRun() ? "SIMULACION" : "EJECUTADO", destino: raiz }, null, 2));
  if (resumen.errores.length) process.exitCode = 1;
}

sincronizar().catch(error => {
  console.error(`Error de sincronización: ${error.message}`);
  process.exitCode = 1;
});
