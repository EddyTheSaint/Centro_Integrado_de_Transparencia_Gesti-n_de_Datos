import { Router } from "express";
import {
  descargarResultado,
  listarArchivos,
  obtenerRegistro,
  procesarArchivo
} from "../controllers/cargas-locales.controller.js";

const router = Router();

router.get("/registro", obtenerRegistro);
router.get("/:proceso/archivos", listarArchivos);
router.post("/:proceso/procesar", procesarArchivo);
router.get("/:proceso/resultados/:idCarga/:tipo", descargarResultado);

export default router;
