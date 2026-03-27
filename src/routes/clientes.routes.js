import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()

/* =========================
   OBTENER CLIENTES
   Filtrado por taller del usuario
========================= */

router.get("/", async (req, res) => {
  try {

    const clientes = await prisma.cliente.findMany({
      where: {
        tallerId: req.tallerId
      },
      include: {
        vehiculos: true
      },
      orderBy: {
        nombre: "asc"
      }
    })

    res.json(clientes)

  } catch (error) {
    console.error("[GET /clientes]", error)
    res.status(500).json({ error: "Error obteniendo clientes" })
  }
})

/* =========================
   SEGUIMIENTO — clientes sin visita en 6+ meses
========================= */

router.get("/seguimiento", async (req, res) => {
  try {

    const tallerId  = req.tallerId
    const hace6Meses = new Date()
    hace6Meses.setMonth(hace6Meses.getMonth() - 6)

    const clientes = await prisma.cliente.findMany({
      where: { tallerId },
      include: {
        vehiculos: true,
        ordenes: {
          orderBy: { fecha: "desc" },
          take: 1,
          select: { id: true, fecha: true, descripcion: true }
        }
      },
      orderBy: { nombre: "asc" }
    })

    const pendientes = clientes
      .filter(c => {
        if (c.ordenes.length === 0) return true
        return new Date(c.ordenes[0].fecha) < hace6Meses
      })
      .map(c => ({
        id:           c.id,
        nombre:       c.nombre,
        telefono:     c.telefono,
        vehiculos:    c.vehiculos,
        ultimaVisita: c.ordenes[0]?.fecha || null,
      }))

    res.json(pendientes)

  } catch (error) {
    console.error("[GET /clientes/seguimiento]", error)
    res.status(500).json({ error: "Error obteniendo seguimiento" })
  }
})

/* =========================
   CLIENTE POR ID
   Verifica que pertenezca al taller
========================= */

router.get("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        id,
        tallerId: req.tallerId
      },
      include: {
        vehiculos: true
      }
    })

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    res.json(cliente)

  } catch (error) {
    console.error("[GET /clientes/:id]", error)
    res.status(500).json({ error: "Error obteniendo cliente" })
  }
})

/* =========================
   CREAR CLIENTE
========================= */

router.post("/", async (req, res) => {
  try {

    const { nombre, telefono, email } = req.body

    if (!nombre?.trim() || !telefono?.trim()) {
      return res.status(400).json({ error: "Nombre y teléfono son requeridos" })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email?.trim() || null,
        tallerId: req.tallerId
      }
    })

    res.status(201).json(cliente)

  } catch (error) {
    console.error("[POST /clientes]", error)
    res.status(500).json({ error: "Error creando cliente" })
  }
})

/* =========================
   ACTUALIZAR CLIENTE
   Verifica que pertenezca al taller antes de modificar
========================= */

router.put("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    // Verificar que el cliente pertenece a este taller
    const existing = await prisma.cliente.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!existing) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    const { nombre, telefono, email } = req.body

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        telefono: telefono?.trim(),
        email: email?.trim() || null
      }
    })

    res.json(cliente)

  } catch (error) {
    console.error("[PUT /clientes/:id]", error)
    res.status(500).json({ error: "Error actualizando cliente" })
  }
})

/* =========================
   ELIMINAR CLIENTE
   Verifica que pertenezca al taller antes de borrar
========================= */

router.delete("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    // deleteMany con tallerId evita borrar registros de otro taller
    const result = await prisma.cliente.deleteMany({
      where: {
        id,
        tallerId: req.tallerId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    res.json({ mensaje: "Cliente eliminado" })

  } catch (error) {
    console.error("[DELETE /clientes/:id]", error)
    res.status(500).json({ error: "Error eliminando cliente" })
  }
})

export default router