import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cargasRouter from "./routes/cargas.routes.js";

// Handlers para errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/archivos", express.static(path.join(__dirname, "..", "storage", "cargas")));
app.use("/api/cargas", cargasRouter);
app.get("/api/health", (_req,res)=>res.json({ok:true,servicio:"CIT Cargador",version:"0.3.0"}));

// Error handler global
app.use((err, _req, res, _next) => {
  console.error("ERROR GLOBAL:", err.message);
  console.error("Stack:", err.stack);
  res.status(500).json({ok:false, mensaje:err.message});
});

app.listen(PORT, ()=>console.log(`CIT Cargador listo en http://localhost:${PORT}`));
