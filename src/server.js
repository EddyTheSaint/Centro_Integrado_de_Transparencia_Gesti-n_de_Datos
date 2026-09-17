import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cargasRouter from "./routes/cargas.routes.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/archivos", express.static(path.join(__dirname, "..", "storage", "cargas")));
app.use("/api/cargas", cargasRouter);
app.get("/api/health", (_req,res)=>res.json({ok:true,servicio:"CIT Cargador",version:"0.3.0"}));

app.listen(PORT, ()=>console.log(`CIT Cargador listo en http://localhost:${PORT}`));
