import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()

/* =========================
   IMPORTANTE: Las rutas con segmentos fijos
   (/buscar, /buscar-parcial, /buscar-global)
   DEBEN ir ANTES de /:id para que Express no las
   interprete como parámetros.
========================= */

/* =========================
   AUTOCOMPLETE PLACAS
========================= */

router.get("/buscar-parcial", async (req, res) => {
  try {

    const placas = req.query.placas || ""

    if (placas.length < 2) {
      return res.json([])
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where: {
        placas: { contains: placas, mode: "insensitive" },
        tallerId: req.tallerId
      },
      include: { cliente: true },
      take: 5
    })

    res.json(vehiculos)

  } catch (error) {
    console.error("[GET /vehiculos/buscar-parcial]", error)
    res.json([])
  }
})

/* =========================
   BUSCAR VEHICULO EXACTO
========================= */

router.get("/buscar", async (req, res) => {
  try {

    const placas = req.query.placas

    if (!placas) return res.json(null)

    const vehiculo = await prisma.vehiculo.findFirst({
      where: {
        placas: { contains: placas, mode: "insensitive" },
        tallerId: req.tallerId
      },
      include: {
        cliente: true,
        ordenes: {
          orderBy: { fecha: "desc" },
          take: 1
        }
      }
    })

    res.json(vehiculo)

  } catch (error) {
    console.error("[GET /vehiculos/buscar]", error)
    res.json(null)
  }
})

/* =========================
   BÚSQUEDA GLOBAL
========================= */

router.get("/buscar-global", async (req, res) => {
  try {

    const q = req.query.q || ""

    if (q.length < 2) return res.json([])

    const vehiculos = await prisma.vehiculo.findMany({
      where: {
        tallerId: req.tallerId,
        OR: [
          { placas: { contains: q, mode: "insensitive" } },
          { cliente: { nombre: { contains: q, mode: "insensitive" } } },
          { cliente: { telefono: { contains: q } } }
        ]
      },
      include: { cliente: true },
      take: 10
    })

    res.json(vehiculos)

  } catch (error) {
    console.error("[GET /vehiculos/buscar-global]", error)
    res.status(500).json({ error: "Error en búsqueda" })
  }
})

/* =========================
   VEHICULOS POR CLIENTE
========================= */

router.get("/cliente/:clienteId", async (req, res) => {
  try {

    const clienteId = parseInt(req.params.clienteId)

    if (isNaN(clienteId)) {
      return res.status(400).json({ error: "Cliente inválido" })
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where: {
        clienteId,
        tallerId: req.tallerId
      },
      orderBy: { id: "desc" }
    })

    res.json(vehiculos)

  } catch (error) {
    console.error("[GET /vehiculos/cliente/:clienteId]", error)
    res.status(500).json({ error: "Error obteniendo vehículos del cliente" })
  }
})

/* =========================
   TODOS LOS VEHICULOS
========================= */

router.get("/", async (req, res) => {
  try {

    const vehiculos = await prisma.vehiculo.findMany({
      where: { tallerId: req.tallerId },
      include: { cliente: true },
      orderBy: { id: "desc" }
    })

    res.json(vehiculos)

  } catch (error) {
    console.error("[GET /vehiculos]", error)
    res.status(500).json({ error: "Error obteniendo vehículos" })
  }
})

/* =========================
   CREAR VEHICULO
========================= */

router.post("/", async (req, res) => {
  try {

    const { marca, modelo, anio, placas, clienteId } = req.body

    if (!marca || !modelo || !anio || !placas || !clienteId) {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    const vehiculo = await prisma.vehiculo.create({
      data: {
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: parseInt(anio),
        placas: placas.replace(/\s+/g, "").toUpperCase(),
        clienteId,
        tallerId: req.tallerId
      }
    })

    res.status(201).json(vehiculo)

  } catch (error) {
    console.error("[POST /vehiculos]", error)
    res.status(500).json({ error: "Error creando vehículo" })
  }
})

/* =========================
   ACTUALIZAR VEHÍCULO
   Si las placas cambian, registra la placa
   anterior en PlacaHistorial.
========================= */

router.patch("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const vehiculo = await prisma.vehiculo.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!vehiculo) return res.status(404).json({ error: "Vehículo no encontrado" })

    const { marca, modelo, anio, placas } = req.body

    const nuevasPlacas = placas ? placas.replace(/\s+/g, "").toUpperCase() : vehiculo.placas
    const placasCambiaron = nuevasPlacas !== vehiculo.placas

    const actualizado = await prisma.$transaction(async (tx) => {

      // Guardar placa anterior si cambia
      if (placasCambiaron) {
        await tx.placaHistorial.create({
          data: { placa: vehiculo.placas, vehiculoId: id }
        })
      }

      return tx.vehiculo.update({
        where: { id },
        data: {
          ...(marca  && { marca:  marca.trim()  }),
          ...(modelo && { modelo: modelo.trim() }),
          ...(anio   && { anio:   parseInt(anio) }),
          placas: nuevasPlacas
        }
      })

    })

    res.json(actualizado)

  } catch (error) {
    console.error("[PATCH /vehiculos/:id]", error)
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe un vehículo con esas placas en este taller" })
    }
    res.status(500).json({ error: "Error actualizando vehículo" })
  }
})

/* =========================
   HISTORIAL VEHICULO
   Verifica que el vehículo pertenezca al taller
========================= */

router.get("/:id/historial", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const vehiculo = await prisma.vehiculo.findFirst({
      where: {
        id,
        tallerId: req.tallerId
      },
      include: {
        cliente: true,
        placaHistorial: { orderBy: { fechaCambio: "desc" } },
        ordenes: {
          include: {
            detalles: {
              include: { servicio: true }
            }
          },
          orderBy: { fecha: "desc" }
        }
      }
    })

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado" })
    }

    const ordenes = vehiculo.ordenes.map((orden) => {
      const total = orden.detalles.reduce((sum, det) => sum + det.precio * det.cantidad, 0)
      return {
        id: orden.id,
        fecha: orden.fecha,
        estado: orden.estado,
        total,
        detalles: orden.detalles
      }
    })

    res.json({
      vehiculo: {
        id:     vehiculo.id,
        marca:  vehiculo.marca,
        modelo: vehiculo.modelo,
        anio:   vehiculo.anio,
        placas: vehiculo.placas
      },
      cliente:        vehiculo.cliente,
      placaHistorial: vehiculo.placaHistorial,
      ordenes
    })

  } catch (error) {
    console.error("[GET /vehiculos/:id/historial]", error)
    res.status(500).json({ error: "Error obteniendo historial" })
  }
})

export default router