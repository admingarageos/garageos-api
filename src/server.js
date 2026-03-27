import express from "express"
import path from "path"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import { rateLimit } from "express-rate-limit"

dotenv.config()

/* =========================
   VALIDACIÓN DE VARIABLES
   CRÍTICAS AL ARRANCAR
========================= */

if (!process.env.JWT_SECRET) {
  console.error("❌ FATAL: JWT_SECRET no está definido en .env")
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error("❌ FATAL: DATABASE_URL no está definido en .env")
  process.exit(1)
}

import authRoutes from "./auth/auth.routes.js"
import invitacionesRoutes from "./routes/invitaciones.routes.js"
import stripeRoutes from "./routes/stripe.routes.js"
import { handleWebhook } from "./controllers/stripe.controller.js"
import usuariosRoutes from "./routes/usuarios.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js"
import ordenesRoutes from "./routes/ordenes.routes.js"
import clientesRoutes from "./routes/clientes.routes.js"
import vehiculosRoutes from "./routes/vehiculos.routes.js"
import serviciosRoutes from "./routes/servicios.routes.js"
import tallerRoutes from "./routes/taller.routes.js"
import citasRoutes from "./routes/citas.routes.js"
import pushRoutes from "./routes/push.routes.js"
import superAdminRoutes from "./routes/superAdmin.routes.js"
import refaccionesRoutes  from "./routes/refacciones.routes.js"
import contabilidadRoutes from "./routes/contabilidad.routes.js"

import { requireAuth } from "./auth/auth.middleware.js"
import { tallerMiddleware } from "./middleware/taller.middleware.js"
import { requireRol } from "./middleware/roleMiddleware.js"
import { requireSuperAdmin } from "./middleware/superAdminMiddleware.js"
import { requirePlan } from "./middleware/planMiddleware.js"

const app = express()
const PORT = process.env.PORT || 3000

app.set("trust proxy", 1)

/* =========================
   SEGURIDAD — HEADERS
========================= */

app.use(helmet())

/* =========================
   CORS
========================= */

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173"]


app.use(cors({
  origin: allowedOrigins
}))

/* =========================
   WEBHOOK STRIPE — raw body, ANTES del json parser
========================= */

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleWebhook)

/* =========================
   BODY PARSER (con límite)
========================= */

app.use(express.json({ limit: "1mb" }))

/* =========================
   RATE LIMITING — AUTH
   Protección contra brute-force
========================= */

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." }
})

/* =========================
   ARCHIVOS ESTÁTICOS
========================= */

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")))

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

/* =========================
   RUTAS PÚBLICAS
========================= */

app.get("/", (req, res) => {
  res.json({ message: "GarageOS API", version: "1.0.0" })
})

app.use("/api/auth", authLimiter, authRoutes)

// Rutas públicas de invitaciones (validar y aceptar no requieren auth)
app.use("/api/invitaciones", authLimiter, invitacionesRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth)
========================= */

app.use("/api/usuarios",  requireAuth, tallerMiddleware, requireRol("admin"), usuariosRoutes)
app.use("/api/talleres",  requireAuth, tallerRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth + taller) — todos los roles
========================= */

app.use("/api/clientes",  requireAuth, tallerMiddleware, clientesRoutes)
app.use("/api/vehiculos", requireAuth, tallerMiddleware, vehiculosRoutes)
app.use("/api/ordenes",   requireAuth, tallerMiddleware, ordenesRoutes)
app.use("/api/citas",     requireAuth, tallerMiddleware, citasRoutes)
app.use("/api/push",     requireAuth, tallerMiddleware, pushRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth + taller) — todos los roles
   ✅ FIX: servicios ya NO bloquea aquí con requireRol("admin").
   El control de quién puede escribir/eliminar se hace
   dentro de servicios.routes.js ruta por ruta.
   Así los mecánicos pueden hacer GET /api/servicios
   para ver el catálogo al agregar servicios a una orden.
========================= */

app.use("/api/servicios", requireAuth, tallerMiddleware, serviciosRoutes)

/* =========================
   RUTAS PROTEGIDAS (auth + taller) — solo admin
========================= */

app.use("/api/refacciones",   requireAuth, tallerMiddleware, requireRol("admin"), requirePlan("estandar", "pro", "manual"), refaccionesRoutes)
app.use("/api/contabilidad",  requireAuth, tallerMiddleware, requireRol("admin"), requirePlan("estandar", "pro", "manual"), contabilidadRoutes)
app.use("/api/dashboard",     requireAuth, tallerMiddleware, requireRol("admin"), dashboardRoutes)
app.use("/api/super-admin", requireAuth, requireSuperAdmin, superAdminRoutes)
app.use("/api/stripe",     requireAuth, tallerMiddleware, stripeRoutes)

/* =========================
   MANEJADOR GLOBAL DE ERRORES
   Evita exponer stack traces al cliente
========================= */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err)

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload demasiado grande" })
  }

  res.status(500).json({ error: "Error interno del servidor" })
})

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log(`🚗 GarageOS API corriendo en http://localhost:${PORT}`)
  console.log(`   Ambiente: ${process.env.NODE_ENV || "development"}`)
})