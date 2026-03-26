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
          data: {
            nombre:        nombreTaller.trim(),
            licenciaVence: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            planTipo:      "trial"
          }
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
   USUARIOS DE UN TALLER
================================= */

export const getUsuariosTaller = async (req, res) => {
  try {

    const tallerId = parseInt(req.params.id)
    if (isNaN(tallerId)) return res.status(400).json({ error: "ID inválido" })

    const relaciones = await prisma.userTaller.findMany({
      where:   { tallerId },
      include: {
        user: {
          select: { id: true, nombre: true, email: true, createdAt: true }
        }
      },
      orderBy: { user: { nombre: "asc" } }
    })

    res.json(relaciones.map(r => ({
      userId:  r.user.id,
      nombre:  r.user.nombre,
      email:   r.user.email,
      rol:     r.rol,
      createdAt: r.user.createdAt
    })))

  } catch (error) {
    console.error("[superAdmin.getUsuariosTaller]", error)
    res.status(500).json({ error: "Error obteniendo usuarios del taller" })
  }
}

export const asignarUsuarioATaller = async (req, res) => {
  try {

    const tallerId = parseInt(req.params.id)
    if (isNaN(tallerId)) return res.status(400).json({ error: "ID inválido" })

    const { userId, rol } = req.body

    if (!userId || !["admin", "mecanico"].includes(rol)) {
      return res.status(400).json({ error: "userId y rol (admin|mecanico) son requeridos" })
    }

    const taller = await prisma.taller.findUnique({ where: { id: tallerId } })
    if (!taller) return res.status(404).json({ error: "Taller no encontrado" })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" })

    await prisma.userTaller.upsert({
      where:  { userId_tallerId: { userId, tallerId } },
      update: { rol },
      create: { userId, tallerId, rol }
    })

    res.json({ ok: true })

  } catch (error) {
    console.error("[superAdmin.asignarUsuarioATaller]", error)
    res.status(500).json({ error: "Error asignando usuario al taller" })
  }
}

export const quitarUsuarioDeTaller = async (req, res) => {
  try {

    const tallerId = parseInt(req.params.id)
    const userId   = parseInt(req.params.userId)

    if (isNaN(tallerId) || isNaN(userId)) {
      return res.status(400).json({ error: "IDs inválidos" })
    }

    const deleted = await prisma.userTaller.deleteMany({
      where: { userId, tallerId }
    })

    if (deleted.count === 0) {
      return res.status(404).json({ error: "Relación no encontrada" })
    }

    res.json({ ok: true })

  } catch (error) {
    console.error("[superAdmin.quitarUsuarioDeTaller]", error)
    res.status(500).json({ error: "Error quitando usuario del taller" })
  }
}

/* =================================
   TALLERES DE UN USUARIO
================================= */

export const getTalleresUsuario = async (req, res) => {
  try {

    const userId = parseInt(req.params.id)
    if (isNaN(userId)) return res.status(400).json({ error: "ID inválido" })

    const relaciones = await prisma.userTaller.findMany({
      where:   { userId },
      include: {
        taller: {
          select: {
            id:            true,
            nombre:        true,
            suspendido:    true,
            licenciaVence: true,
            planTipo:      true
          }
        }
      },
      orderBy: { taller: { nombre: "asc" } }
    })

    res.json(relaciones.map(r => ({
      tallerId:      r.taller.id,
      nombre:        r.taller.nombre,
      suspendido:    r.taller.suspendido,
      licenciaVence: r.taller.licenciaVence,
      planTipo:      r.taller.planTipo,
      rol:           r.rol
    })))

  } catch (error) {
    console.error("[superAdmin.getTalleresUsuario]", error)
    res.status(500).json({ error: "Error obteniendo talleres del usuario" })
  }
}

/* =================================
   EXTENDER LICENCIA DE UN TALLER
================================= */

export const extenderLicencia = async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const { dias, planTipo } = req.body

    if (dias === undefined || dias === null || dias === "" || isNaN(parseInt(dias)) || parseInt(dias) === 0) {
      return res.status(400).json({ error: "dias debe ser un número distinto de cero" })
    }

    const taller = await prisma.taller.findUnique({
      where:  { id },
      select: { id: true, licenciaVence: true }
    })

    if (!taller) return res.status(404).json({ error: "Taller no encontrado" })

    // Base de cálculo: si ya venció o es null, partir desde hoy; si no, extender desde la fecha actual
    const base = taller.licenciaVence && new Date(taller.licenciaVence) > new Date()
      ? new Date(taller.licenciaVence)
      : new Date()

    const nuevaFecha = new Date(base.getTime() + parseInt(dias) * 24 * 60 * 60 * 1000)

    const actualizado = await prisma.taller.update({
      where: { id },
      data:  {
        licenciaVence: nuevaFecha,
        ...(planTipo && { planTipo })
      },
      select: { id: true, licenciaVence: true, planTipo: true }
    })

    res.json(actualizado)

  } catch (error) {
    console.error("[superAdmin.extenderLicencia]", error)
    res.status(500).json({ error: "Error extendiendo licencia" })
  }
}

/* =================================
   TODOS LOS TALLERES CON LICENCIA
   Para el tab Licencias del superAdmin
================================= */

export const getLicencias = async (req, res) => {
  try {

    const talleres = await prisma.taller.findMany({
      orderBy: { licenciaVence: "asc" },
      select: {
        id:            true,
        nombre:        true,
        suspendido:    true,
        licenciaVence: true,
        planTipo:      true,
        _count: {
          select: { usuarios: true, ordenes: true }
        }
      }
    })

    res.json(talleres)

  } catch (error) {
    console.error("[superAdmin.getLicencias]", error)
    res.status(500).json({ error: "Error obteniendo licencias" })
  }
}

/* =================================
   BUSCAR USUARIO POR EMAIL
   Para el panel de asignación
================================= */

export const buscarUsuario = async (req, res) => {
  try {

    const { email } = req.query
    if (!email || email.trim().length < 3) {
      return res.json([])
    }

    const usuarios = await prisma.user.findMany({
      where: {
        email: { contains: email.trim(), mode: "insensitive" }
      },
      select: { id: true, nombre: true, email: true },
      take: 5
    })

    res.json(usuarios)

  } catch (error) {
    console.error("[superAdmin.buscarUsuario]", error)
    res.status(500).json({ error: "Error buscando usuario" })
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
