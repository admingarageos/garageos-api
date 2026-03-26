import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error("JWT_SECRET no definido")

/* =============================
   REQUIRE AUTH
============================= */

export const requireAuth = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token requerido" })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Token inválido" })
    }

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      // Diferenciar token expirado de token inválido
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expirado" })
      }
      return res.status(401).json({ error: "Token inválido" })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, nombre: true, email: true, superAdmin: true }
    })

    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" })
    }

    req.user = user

    // Validar taller si viene el header
    const tallerIdRaw = req.headers["x-taller-id"]
    const tallerId = tallerIdRaw ? parseInt(tallerIdRaw) : null

    if (tallerId && !isNaN(tallerId)) {

      // SuperAdmin tiene acceso a cualquier taller sin validar UserTaller
      if (user.superAdmin) {

        req.taller   = { id: tallerId, rol: "admin" }
        req.tallerId = tallerId

      } else {

        const relacion = await prisma.userTaller.findFirst({
          where:   { userId: user.id, tallerId },
          include: { taller: { select: { suspendido: true } } }
        })

        if (!relacion) {
          return res.status(403).json({ error: "No tienes acceso a este taller" })
        }

        if (relacion.taller.suspendido) {
          return res.status(403).json({ error: "Este taller está suspendido" })
        }

        req.taller   = { id: tallerId, rol: relacion.rol }
        req.tallerId = tallerId

      }
    }

    next()

  } catch (error) {
    console.error("[requireAuth]", error)
    return res.status(500).json({ error: "Error de autenticación" })
  }

}