import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key"

/* =============================
   REQUIRE AUTH
============================= */

export const requireAuth = async (req, res, next) => {

  try {

    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        error: "Token requerido"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        error: "Token inválido"
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
  where: { id: decoded.id }
})

    if (!user) {
      return res.status(401).json({
        error: "Usuario no encontrado"
      })
    }

    req.user = {
  id: user.id,
  nombre: user.nombre,
  email: user.email
}

    // 🔥 Obtener taller actual desde header
const tallerId = parseInt(req.headers["x-taller-id"])

// 🔥 SOLO validar taller si la ruta lo necesita
if (tallerId) {

  const relacion = await prisma.userTaller.findFirst({
    where: {
      userId: user.id,
      tallerId
    }
  })

  if (!relacion) {
    return res.status(403).json({
      error: "No tienes acceso a este taller"
    })
  }

  req.taller = {
    id: tallerId,
    rol: relacion.rol
  }

  req.tallerId = tallerId
}

    next()

  } catch (error) {

    return res.status(401).json({
      error: "Token inválido"
    })

  }

}