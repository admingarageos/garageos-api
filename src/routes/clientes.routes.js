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