import express from "express"
import path from "path"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

import authRoutes from "./auth/auth.routes.js"
import usuariosRoutes from "./routes/usuarios.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import ordenesRoutes from "./routes/ordenes.routes.js"
import clientesRoutes from "./routes/clientes.routes.js"
import vehiculosRoutes from "./routes/vehiculos.routes.js"
import serviciosRoutes from "./routes/servicios.routes.js"
import tallerRoutes from "./routes/taller.routes.js"
import citasRoutes from "./routes/citas.routes.js"

import { requireAuth } from "./auth/auth.middleware.js"
import { tallerMiddleware } from "./middleware/taller.middleware.js"
import { requireRol } from "./middleware/roleMiddleware.js"


const app = express()
const PORT = process.env.PORT || 3000

/* =========================
   MIDDLEWARES GLOBALES
========================= */

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}))

app.use(express.json())

/* =========================
   ARCHIVOS ESTÁTICOS
========================= */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

/* =========================
   RUTAS PÚBLICAS
========================= */

app.get("/", (req, res) => {
  res.send("🚗 GarageOS API funcionando")
})

app.use("/api/auth", authRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth)
========================= */

app.use("/api/usuarios", requireAuth, tallerMiddleware, requireRol("admin"), usuariosRoutes)
app.use("/api/talleres", requireAuth, tallerRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth + taller) — todos los roles
========================= */

app.use("/api/clientes",  requireAuth, tallerMiddleware, clientesRoutes)
app.use("/api/vehiculos", requireAuth, tallerMiddleware, vehiculosRoutes)
app.use("/api/ordenes",   requireAuth, tallerMiddleware, ordenesRoutes)
app.use("/api/citas", requireAuth, tallerMiddleware, citasRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth + taller) — solo admin
========================= */

app.use("/api/servicios", requireAuth, tallerMiddleware, requireRol("admin"), serviciosRoutes)
app.use("/api/dashboard", requireAuth, tallerMiddleware, requireRol("admin"), dashboardRoutes)

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚗 GarageOS API corriendo en http://localhost:${PORT}`)
})