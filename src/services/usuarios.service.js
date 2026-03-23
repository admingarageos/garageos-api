/**
 * usuarios.service.js
 *
 * NOTA: El archivo original usaba CommonJS (require) y una conexión MySQL
 * directa que ya no existe en el proyecto (la app usa Prisma + PostgreSQL).
 * Era código muerto que no se importaba desde ningún lado.
 *
 * Este archivo queda como utilidad auxiliar por si en el futuro se necesita
 * abstraer lógica de usuarios fuera de las rutas.
 */

import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"

/* =========================
   OBTENER USUARIOS DE UN TALLER
========================= */

export const getUsuariosDeTaller = async (tallerId) => {

  const relaciones = await prisma.userTaller.findMany({
    where: { tallerId },
    include: {
      user: {
        select: { id: true, nombre: true, email: true }
      }
    }
  })

  return relaciones.map(r => ({
    id:     r.user.id,
    nombre: r.user.nombre,
    email:  r.user.email,
    rol:    r.rol
  }))
}

/* =========================
   CREAR USUARIO Y ASIGNARLO A UN TALLER
========================= */

export const crearUsuarioEnTaller = async ({ nombre, email, password, rol, tallerId }) => {

  if (!nombre || !email || !password) {
    throw new Error("MISSING_FIELDS")
  }

  if (password.length < 8) {
    throw new Error("PASSWORD_TOO_SHORT")
  }

  const emailNorm = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: emailNorm } })

  if (existing) {
    throw new Error("EMAIL_EXISTS")
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const newUser = await prisma.user.create({
    data: { nombre: nombre.trim(), email: emailNorm, passwordHash }
  })

  await prisma.userTaller.create({
    data: {
      userId:   newUser.id,
      tallerId,
      rol:      rol || "mecanico"
    }
  })

  return {
    id:     newUser.id,
    nombre: newUser.nombre,
    email:  newUser.email,
    rol:    rol || "mecanico"
  }
}