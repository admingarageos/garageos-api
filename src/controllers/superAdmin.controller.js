import prisma from "../lib/prisma.js"
import bcrypt from "bcrypt"

/* =================================
   TALLERES
================================= */

export const getTalleres = async (req, res) => {
  try {

    const talleres = await prisma.taller.findMany({
      orderBy: { nombre: "asc" },
      include: {
        _count: {
          select: {
            usuarios:  true,
            clientes:  true,
            ordenes:   true,
            vehiculos: true
          }
        }
      }
    })

    res.json(talleres)

  } catch (error) {
    console.error("[superAdmin.getTalleres]", error)
    res.status(500).json({ error: "Error obteniendo talleres" })
  }
}

export const suspenderTaller = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    const taller = await prisma.taller.findUnique({ where: { id } })

    if (!taller) {
      return res.status(404).json({ error: "Taller no encontrado" })
    }

    const updated = await prisma.taller.update({
      where: { id },
      data:  { suspendido: !taller.suspendido }
    })

    res.json({ suspendido: updated.suspendido })

  } catch (error) {
    console.error("[superAdmin.suspenderTaller]", error)
    res.status(500).json({ error: "Error actualizando taller" })
  }
}

export const eliminarTaller = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    const taller = await prisma.taller.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clientes:  true,
            ordenes:   true,
            vehiculos: true,
            citas:     true
          }
        }
      }
    })

    if (!taller) {
      return res.status(404).json({ error: "Taller no encontrado" })
    }

    const { clientes, ordenes, vehiculos, citas } = taller._count

    if (clientes > 0 || ordenes > 0 || vehiculos > 0 || citas > 0) {
      return res.status(409).json({
        error: "El taller tiene datos y no puede eliminarse",
        detalle: { clientes, ordenes, vehiculos, citas }
      })
    }

    // Solo elimina relaciones de usuarios y el taller
    await prisma.$transaction([
      prisma.userTaller.deleteMany({ where: { tallerId: id } }),
      prisma.taller.delete({ where: { id } })
    ])

    res.json({ mensaje: "Taller eliminado correctamente" })

  } catch (error) {
    console.error("[superAdmin.eliminarTaller]", error)
    res.status(500).json({ error: "Error eliminando taller" })
  }
}

/* =================================
   USUARIOS
================================= */

export const getUsuarios = async (req, res) => {
  try {

    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id:         true,
        nombre:     true,
        email:      true,
        superAdmin: true,
        createdAt:  true,
        _count: {
          select: { talleres: true }
        }
      }
    })

    res.json(usuarios)

  } catch (error) {
    console.error("[superAdmin.getUsuarios]", error)
    res.status(500).json({ error: "Error obteniendo usuarios" })
  }
}

export const eliminarUsuario = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (id === req.user.id) {
      return res.status(400).json({ error: "No puedes eliminarte a ti mismo" })
    }

    const user = await prisma.user.findUnique({ where: { id } })

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Elimina relaciones primero, luego el usuario
    await prisma.$transaction([
      prisma.userTaller.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } })
    ])

    res.json({ mensaje: "Usuario eliminado correctamente" })

  } catch (error) {
    console.error("[superAdmin.eliminarUsuario]", error)
    res.status(500).json({ error: "Error eliminando usuario" })
  }
}

export const crearUsuario = async (req, res) => {
  try {

    const { nombre, email, password, nombreTaller } = req.body

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" })
    }

    const emailNorm = email.toLowerCase().trim()

    const existe = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (existe) {
      return res.status(409).json({ error: "El correo ya está registrado" })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {

      const user = await tx.user.create({
        data: {
          nombre: nombre.trim(),
          email:  emailNorm,
          passwordHash
        }
      })

      if (nombreTaller?.trim()) {
        const taller = await tx.taller.create({
          data: { nombre: nombreTaller.trim() }
        })
        await tx.userTaller.create({
          data: { userId: user.id, tallerId: taller.id, rol: "admin" }
        })
      }

      return user
    })

    res.status(201).json({
      id:     result.id,
      nombre: result.nombre,
      email:  result.email
    })

  } catch (error) {
    console.error("[superAdmin.crearUsuario]", error)
    res.status(500).json({ error: "Error creando usuario" })
  }
}

/* =================================
   CONFIGURACIÓN DE PLATAFORMA
================================= */

export const getConfig = async (req, res) => {
  try {

    const configs = await prisma.platformConfig.findMany()

    const result = {}
    for (const c of configs) {
      result[c.key] = c.value
    }

    res.json(result)

  } catch (error) {
    console.error("[superAdmin.getConfig]", error)
    res.status(500).json({ error: "Error obteniendo configuración" })
  }
}

export const updateConfig = async (req, res) => {
  try {

    const { key, value } = req.body

    if (!key || value === undefined) {
      return res.status(400).json({ error: "key y value son requeridos" })
    }

    await prisma.platformConfig.upsert({
      where:  { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    })

    res.json({ mensaje: "Configuración actualizada" })

  } catch (error) {
    console.error("[superAdmin.updateConfig]", error)
    res.status(500).json({ error: "Error actualizando configuración" })
  }
}
