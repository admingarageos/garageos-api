import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import crypto from "crypto"
import nodemailer from "nodemailer"

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
})

/* =========================
   JWT_SECRET — falla en arranque si no está
   (validación en server.js, pero doble protección aquí)
========================= */

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error("JWT_SECRET no definido")

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h"

/* =========================
   LOGIN
========================= */

export const login = async (email, password) => {

  if (!email || !password) {
    throw new Error("MISSING_CREDENTIALS")
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() }
  })

  // Siempre comparamos hash aunque el usuario no exista,
  // para evitar timing attacks que revelen si el email existe.
  const dummyHash = "$2b$10$invalidhashfortimingprotection00000000000000000000000000"
  const hashToCompare = user?.passwordHash ?? dummyHash

  const valid = await bcrypt.compare(password, hashToCompare)

  if (!user || !user.passwordHash || !valid) {
    throw new Error("INVALID_CREDENTIALS")
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      email: user.email
    }
  }
}

/* =========================
   HELPER: FECHA DE VENCIMIENTO
   30 días desde hoy
========================= */

const trialVence = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

/* =========================
   REGISTER
========================= */

export const register = async ({ nombre, email, password, nombreTaller }) => {

  if (!nombre || !email || !password || !nombreTaller) {
    throw new Error("MISSING_FIELDS")
  }

  // Validación mínima de contraseña
  if (password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT")
  }

  // Verificar si el registro público está habilitado
  const config = await prisma.platformConfig.findUnique({
    where: { key: "registroHabilitado" }
  })
  if (config?.value === "false") {
    throw new Error("REGISTRO_DESHABILITADO")
  }

  // Normalizar email
  const emailNorm = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({
    where: { email: emailNorm }
  })

  if (existing) {
    throw new Error("EMAIL_EXISTS")
  }

  const hashed = await bcrypt.hash(password, 12)

  // Crear usuario y taller en una transacción
  const { user, taller } = await prisma.$transaction(async (tx) => {

    const user = await tx.user.create({
      data: {
        nombre: nombre.trim(),
        email: emailNorm,
        passwordHash: hashed
      }
    })

    const taller = await tx.taller.create({
      data: {
        nombre:        nombreTaller.trim(),
        licenciaVence: trialVence(),
        planTipo:      "trial"
      }
    })

    await tx.userTaller.create({
      data: {
        userId: user.id,
        tallerId: taller.id,
        rol: "admin"
      }
    })

    return { user, taller }
  })

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  return {
    token,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      email: user.email
    }
  }
}

/* =========================
   TALLERES DEL USUARIO
========================= */

export const getUserTalleres = async (userId) => {

  if (!userId) return []

  const talleres = await prisma.userTaller.findMany({
    where:   { userId },
    include: {
      taller: {
        select: {
          id:            true,
          nombre:        true,
          licenciaVence: true,
          planTipo:      true
        }
      }
    }
  })

  return talleres.map(t => ({
    id:            t.taller.id,
    nombre:        t.taller.nombre,
    rol:           t.rol,
    licenciaVence: t.taller.licenciaVence,
    planTipo:      t.taller.planTipo
  }))
}

/* =========================
   TODOS LOS TALLERES (superAdmin)
========================= */

export const getAllTalleres = async () => {

  const talleres = await prisma.taller.findMany({
    orderBy: { nombre: "asc" }
  })

  return talleres.map(t => ({
    id: t.id,
    nombre: t.nombre,
    rol: "admin"
  }))
}

/* =========================
   ME
========================= */

export const getMe = async (userId) => {

  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      superAdmin: true
    }
  })

  return user
}

/* =========================
   FORGOT PASSWORD
========================= */

export const forgotPassword = async (email) => {
  if (!email) throw new Error("MISSING_EMAIL")

  const emailNorm = email.toLowerCase().trim()
  const user = await prisma.user.findUnique({ where: { email: emailNorm } })

  // Siempre respondemos igual para no revelar si el email existe
  if (!user) return

  const token   = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken:        token,
      resetTokenExpires: expires
    }
  })

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"
  const resetUrl    = `${frontendUrl}/reset-password?token=${token}`

  await mailer.sendMail({
    from:    `"GarageOS" <${process.env.GMAIL_USER}>`,
    to:      emailNorm,
    subject: "Recupera tu contraseña de GarageOS",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Recuperación de contraseña</h2>
        <p style="color:#475569">Hola <strong>${user.nombre}</strong>,</p>
        <p style="color:#475569">Recibimos una solicitud para restablecer la contraseña de tu cuenta en GarageOS.</p>
        <p style="color:#475569">Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Restablecer contraseña
        </a>
        <p style="color:#94a3b8;font-size:13px">Si no solicitaste esto, puedes ignorar este correo. Tu contraseña no cambiará.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">GarageOS — Sistema operativo del taller</p>
      </div>
    `
  })
}

/* =========================
   RESET PASSWORD
========================= */

export const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) throw new Error("MISSING_FIELDS")
  if (newPassword.length < 8)  throw new Error("PASSWORD_TOO_SHORT")

  const user = await prisma.user.findUnique({ where: { resetToken: token } })

  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN")
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken:        null,
      resetTokenExpires: null
    }
  })
}

/* =========================
   CREAR TALLER
========================= */

export const crearTaller = async (userId, nombre) => {

  if (!nombre?.trim()) {
    throw new Error("MISSING_NAME")
  }

  const taller = await prisma.taller.create({
    data: {
      nombre:        nombre.trim(),
      licenciaVence: trialVence(),
      planTipo:      "trial"
    }
  })

  await prisma.userTaller.create({
    data: {
      userId,
      tallerId: taller.id,
      rol: "admin"
    }
  })

  return taller
}