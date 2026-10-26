import path from "node:path";

export const CARGAS_LOCALES_ROOT = path.resolve(
  process.env.CARGAS_LOCALES_ROOT ||
    "C:\\Users\\user\\itm.edu.co\\Centro integrado de transparencia - gestión de datos. - General"
);

export const PROCESOS_CARGAS_LOCALES = [
  {
    folderName: "PQRSD",
    internalProcessName: "PQRSD",
    automaticValidationEnabled: true
  },
  {
    folderName: "ENCUENTROS_DE_CIUDAD",
    internalProcessName: "ENCUENTROS_DE_CIUDAD",
    automaticValidationEnabled: false
  },
  {
    folderName: "BUEN_COMIENZO",
    internalProcessName: "BUEN_COMIENZO",
    automaticValidationEnabled: false
  },
  {
    folderName: "HABITANTE_DE_CALLE",
    internalProcessName: "HABITANTES_CALLE",
    automaticValidationEnabled: true
  },
  {
    folderName: "ENVEJECIMIENTO_Y_VEJEZ",
    internalProcessName: "ENVEJECIMIENTO_Y_VEJEZ",
    automaticValidationEnabled: false
  },
  {
    folderName: "CONTRATACION",
    internalProcessName: "CONTRATACION",
    automaticValidationEnabled: false
  }
];

export const PROCESSED_FILES_PATH = path.resolve(
  process.env.CARGAS_LOCALES_REGISTRY || path.join(process.cwd(), "data", "processed-files.json")
);

export const REGISTRO_CARGAS_CSV_PATH = path.resolve(
  process.env.REGISTRO_CARGAS_CSV || path.join(process.cwd(), "data", "registro-cargas.csv")
);

export const REGISTRO_CARGAS_JSON_PATH = path.resolve(
  process.env.REGISTRO_CARGAS_JSON || path.join(process.cwd(), "data", "registro-cargas.json")
);

export const REGISTRO_CARGAS_PUBLICACION_DIR = path.resolve(
  process.env.REGISTRO_CARGAS_PUBLICACION_DIR ||
    "C:\\Users\\user\\itm.edu.co\\Centro integrado de transparencia - gestión de datos. - General\\CARGAS_OBSERVATORIOS\\CONTROL"
);

export const BI_PUBLICACION_DIR = path.resolve(
  process.env.BI_PUBLICACION_DIR || path.join(REGISTRO_CARGAS_PUBLICACION_DIR, "BI")
);
