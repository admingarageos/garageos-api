import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"
import crypto from "crypto"

const ROLES_VALIDOS = ["admin", "mecanico"]
const DIAS_VIGENCIA = 7

/* =========================
   CREAR INVITACIÓN
   POST /api/invitaciones
   Admin del taller genera un link de uso único
========================= */

export const crearInvitacion = async (req, res) => {
  try {

    const { rol = "mecanico" } = req.body

    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ error: "Rol inválido" })
    }

    const token     = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + DIAS_VIGENCIA * 24 * 60 * 60 * 1000)

    await prisma.invitacion.create({
      data: {
        token,
        tallerId:  req.tallerId,
        creadoPor: req.user.id,
        rol,
        expiresAt
      }
    })

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
    const link        = `${frontendUrl}/invitacion/${token}`

    res.json({ link, expiresAt })

  } catch (error) {
    console.error("[POST /invitaciones]", error)
    res.status(500).json({ error: "Error generando invitación" })
  }
}

/* =========================
   VALIDAR INVITACIÓN — PÚBLICA
   GET /api/invitaciones/validar/:token
   El mecánico la abre y ve el nombre del taller
========================= */

export const validarInvitacion = async (req, res) => {
  try {

    const { token } = req.params

    const inv = await prisma.invitacion.findUnique({
      where:   { token },
      include: { taller: { select: { nombre: true } } }
    })

    if (!inv || inv.usadaAt || inv.expiresAt < new Date()) {
      return res.status(404).json({ error: "El enlace es inválido, ya fue usado o expiró" })
    }

    res.json({
      taller: inv.taller.nombre,
      rol:    inv.rol
    })

  } catch (error) {
    console.error("[GET /invitaciones/validar/:token]", error)
    res.status(500).json({ error: "Error validando invitación" })
  }
}

/* =========================
   ACEPTAR INVITACIÓN — PÚBLICA
   POST /api/invitaciones/aceptar/:token
   El mecánico completa su registro
========================= */

export const aceptarInvitacion = async (req, res) => {
  try {

    const { token } = req.params
    const { nombre, email, password } = req.body

    if (!nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" })
    }

    const inv = await prisma.invitacion.findUnique({ where: { token } })

    if (!inv || inv.usadaAt || inv.expiresAt < new Date()) {
      return res.status(400).json({ error: "El enlace es inválido, ya fue usado o expiró" })
    }

    const emailNorm = email.toLowerCase().trim()

    const existing = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (existing) {
      return res.status(409).json({ error: "El correo ya está registrado. Inicia sesión con tu cuenta existente." })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {

      const user = await tx.user.create({
        data: {
          nombre:       nombre.trim(),
          email:        emailNorm,
          passwordHash
        }
      })

      await tx.userTaller.create({
        data: {
          userId:   user.id,
          tallerId: inv.tallerId,
          rol:      inv.rol
        }
      })

      await tx.invitacion.update({
        where: { id: inv.id },
        data:  { usadaAt: new Date() }
      })

    })

    res.json({ mensaje: "Cuenta creada correctamente. Ya puedes iniciar sesión." })

  } catch (error) {
    console.error("[POST /invitaciones/aceptar/:token]", error)
    res.status(500).json({ error: "Error procesando invitación" })
  }
}
