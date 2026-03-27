import { Router } from "express"
import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"

const router = Router()

/* =========================
   OBTENER USUARIOS DEL TALLER
========================= */

router.get("/", async (req, res) => {
  try {

    const tallerId = req.tallerId

    const usuarios = await prisma.userTaller.findMany({
      where: { tallerId },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    res.json(usuarios.map(u => ({
      id: u.user.id,
      nombre: u.user.nombre,
      email: u.user.email,
      rol: u.rol
    })))

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo usuarios" })
  }
})

/* =========================
   HELPER — límite de mecánicos por plan
========================= */

const LIMITE_MECANICOS = {
  trial:    1,
  basico:   1,
  estandar: 5,
  pro:      Infinity,
  manual:   Infinity,
}

async function verificarLimiteMecanicos(tallerId) {
  const taller = await prisma.taller.findUnique({ where: { id: tallerId } })
  const plan   = taller?.planTipo || "trial"
  const limite = LIMITE_MECANICOS[plan] ?? 1

  if (limite === Infinity) return null // sin límite

  const mecanicos = await prisma.userTaller.count({
    where: { tallerId, rol: "mecanico" }
  })

  if (mecanicos >= limite) {
    const labels = { trial: "Trial", basico: "Básico", estandar: "Estándar" }
    return `Tu plan ${labels[plan] || plan} permite máximo ${limite} mecánico${limite > 1 ? "s" : ""}. Actualiza tu plan para agregar más.`
  }

  return null
}

/* =========================
   CREAR USUARIO NUEVO
========================= */

router.post("/", async (req, res) => {
  try {

    const { nombre, email, password, rol } = req.body
    const tallerId = req.tallerId

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y password son requeridos"
      })
    }

    if ((rol || "mecanico") === "mecanico") {
      const limiteError = await verificarLimiteMecanicos(tallerId)
      if (limiteError) return res.status(403).json({ error: limiteError })
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      return res.status(400).json({ error: "El email ya está registrado" })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: { nombre, email, passwordHash }
    })

    await prisma.userTaller.create({
      data: {
        userId: newUser.id,
        tallerId,
        rol: rol || "mecanico"
      }
    })

    res.json({
      id: newUser.id,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: rol || "mecanico"
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error creando usuario" })
  }
})

/* =========================
   INVITAR USUARIO EXISTENTE
========================= */

router.post("/invitar", async (req, res) => {
  try {

    const { email, rol } = req.body
    const tallerId = req.tallerId

    if (!email) {
      return res.status(400).json({ error: "Email requerido" })
    }

    if ((rol || "mecanico") === "mecanico") {
      const limiteError = await verificarLimiteMecanicos(tallerId)
      if (limiteError) return res.status(403).json({ error: limiteError })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado. Debe registrarse primero."
      })
    }

    const yaExiste = await prisma.userTaller.findFirst({
      where: { userId: user.id, tallerId }
    })

    if (yaExiste) {
      return res.status(400).json({
        error: "El usuario ya pertenece a este taller"
      })
    }

    await prisma.userTaller.create({
      data: {
        userId: user.id,
        tallerId,
        rol: rol || "mecanico"
      }
    })

    res.json({ mensaje: "Usuario agregado al taller correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error invitando usuario" })
  }
})

/* =========================
   CAMBIAR ROL DE USUARIO
========================= */

router.patch("/:userId/rol", async (req, res) => {
  try {

    const userId = parseInt(req.params.userId)
    const { rol } = req.body
    const tallerId = req.tallerId

    if (!["admin", "mecanico"].includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" })
    }

    // No permitir quitarse el admin a uno mismo
    if (userId === req.user.id) {
      return res.status(400).json({
        error: "No puedes cambiar tu propio rol"
      })
    }

    await prisma.userTaller.updateMany({
      where: { userId, tallerId },
      data: { rol }
    })

    res.json({ mensaje: "Rol actualizado correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error actualizando rol" })
  }
})

/* =========================
   ELIMINAR USUARIO DEL TALLER
========================= */

router.delete("/:userId", async (req, res) => {
  try {

    const userId = parseInt(req.params.userId)
    const tallerId = req.tallerId

    if (userId === req.user.id) {
      return res.status(400).json({
        error: "No puedes eliminarte a ti mismo del taller"
      })
    }

    await prisma.userTaller.deleteMany({
      where: { userId, tallerId }
    })

    res.json({ mensaje: "Usuario eliminado del taller" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error eliminando usuario" })
  }
})

export default router