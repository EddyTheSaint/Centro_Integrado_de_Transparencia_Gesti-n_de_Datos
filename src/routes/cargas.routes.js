import { Router } from "express";
import multer from "multer";
import { procesarCarga } from "../controllers/cargas.controller.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req,file,cb)=>{
    const n=file.originalname.toLowerCase();
    cb(n.endsWith(".xlsx")||n.endsWith(".xls") ? null : new Error("Solo .xlsx o .xls"),
       n.endsWith(".xlsx")||n.endsWith(".xls"));
  }
});
router.post("/", upload.single("archivo"), procesarCarga);
export default router;
