import prisma from "../lib/prisma.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_dev_key"

/* =========================
   LOGIN
========================= */

export const login = async (email, password) => {

  if (!email || !password) {
    throw new Error("MISSING_CREDENTIALS")
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    throw new Error("INVALID_CREDENTIALS")
  }

  if (!user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS")
  }

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    throw new Error("INVALID_CREDENTIALS")
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "8h" }
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

  // 🔍 Validar duplicado
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    throw new Error("EMAIL_EXISTS")
  }

  const hashed = await bcrypt.hash(password, 10)

  // 👤 Crear usuario
  const user = await prisma.user.create({
    data: {
      nombre,
      email,
      passwordHash: hashed
    }
  })

  // 🏢 Crear taller
  const taller = await prisma.taller.create({
    data: {
      nombre: nombreTaller
    }
  })

  // 🔗 Relación usuario-taller
  await prisma.userTaller.create({
    data: {
      userId: user.id,
      tallerId: taller.id,
      rol: "admin"
    }
  })

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "8h" }
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

export const crearTaller = async (userId, nombre) => {

  if (!nombre) {
    throw new Error("MISSING_NAME")
  }

  const taller = await prisma.taller.create({
    data: { nombre }
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