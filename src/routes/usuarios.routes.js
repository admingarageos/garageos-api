import { Router } from "express"
import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"
import { crearInvitacion } from "../controllers/invitaciones.controller.js"

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

const LIMITES_PLAN = {
  trial:    { admin: 1, mecanico: 1 },
  basico:   { admin: 1, mecanico: 1 },
  estandar: { admin: 1, mecanico: 5 },
  pro:      { admin: Infinity, mecanico: Infinity },
  manual:   { admin: Infinity, mecanico: Infinity },
}

const PLAN_LABELS = { trial: "Trial", basico: "Básico", estandar: "Estándar" }

async function verificarLimiteRol(tallerId, rol) {
  const taller = await prisma.taller.findUnique({ where: { id: tallerId } })
  const plan   = taller?.planTipo || "trial"
  const limite = (LIMITES_PLAN[plan] ?? LIMITES_PLAN.trial)[rol]

  if (!limite || limite === Infinity) return null

  const count = await prisma.userTaller.count({ where: { tallerId, rol } })

  if (count >= limite) {
    const rolLabel = rol === "admin" ? "administrador" : `mecánico${limite > 1 ? "s" : ""}`
    return `Tu plan ${PLAN_LABELS[plan] || plan} permite máximo ${limite} ${rolLabel}. Actualiza tu plan para agregar más.`
  }

  return null
}

/* =========================
   LÍMITES DEL PLAN
========================= */

router.get("/limites", async (req, res) => {
  try {
    const tallerId = req.tallerId
    const taller   = await prisma.taller.findUnique({ where: { id: tallerId } })
    const plan     = taller?.planTipo || "trial"
    const limites  = LIMITES_PLAN[plan] ?? LIMITES_PLAN.trial

    const [admins, mecanicos] = await Promise.all([
      prisma.userTaller.count({ where: { tallerId, rol: "admin"    } }),
      prisma.userTaller.count({ where: { tallerId, rol: "mecanico" } }),
    ])

    res.json({
      plan,
      admin:    { usado: admins,    max: limites.admin    === Infinity ? null : limites.admin    },
      mecanico: { usado: mecanicos, max: limites.mecanico === Infinity ? null : limites.mecanico },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo límites" })
  }
})

/* =========================
   CREAR USUARIO NUEVO
========================= */

router.post("/", async (req, res) => {
  try {

    const { nombre, password, rol } = req.body
    const email    = req.body.email?.toLowerCase().trim()
    const tallerId = req.tallerId

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y password son requeridos"
      })
    }

    const rolFinal = rol || "mecanico"
    const limiteError = await verificarLimiteRol(tallerId, rolFinal)
    if (limiteError) return res.status(403).json({ error: limiteError })

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
        rol: rolFinal
      }
    })

    res.json({
      id: newUser.id,
      nombre: newUser.nombre,
      email: newUser.email,
      rol: rolFinal
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

    const { rol } = req.body
    const email    = req.body.email?.toLowerCase().trim()
    const tallerId = req.tallerId

    if (!email) {
      return res.status(400).json({ error: "Email requerido" })
    }

    const rolFinalInvitar = rol || "mecanico"
    const limiteErrorInvitar = await verificarLimiteRol(tallerId, rolFinalInvitar)
    if (limiteErrorInvitar) return res.status(403).json({ error: limiteErrorInvitar })

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

    const limiteError = await verificarLimiteRol(tallerId, rol)
    if (limiteError) return res.status(403).json({ error: limiteError })

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
   GENERAR LINK DE INVITACIÓN
========================= */

router.post("/invitacion", crearInvitacion)

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