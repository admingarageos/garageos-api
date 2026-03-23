import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

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
        nombre: nombreTaller.trim()
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
    where: { userId },
    include: {
      taller: true
    }
  })

  return talleres.map(t => ({
    id: t.taller.id,
    nombre: t.taller.nombre,
    rol: t.rol
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
      email: true
    }
  })

  return user
}

/* =========================
   CREAR TALLER
========================= */

export const crearTaller = async (userId, nombre) => {

  if (!nombre?.trim()) {
    throw new Error("MISSING_NAME")
  }

  const taller = await prisma.taller.create({
    data: { nombre: nombre.trim() }
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