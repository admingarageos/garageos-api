import prisma from "../lib/prisma.js"

const ESTADOS_ORDEN = [
  "pendiente",
  "en_proceso",
  "terminada",
  "entregada",
  "cancelada"
]

const ESTADOS_CON_PAGO     = ["terminada", "entregada"]
const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia"]

/* =================================
   HELPER: VALIDAR TALLER
================================= */

const requireTaller = (req, res) => {
  if (!req.tallerId) {
    res.status(400).json({ error: "Taller no seleccionado" })
    return false
  }
  return true
}

/* =================================
   OBTENER TODAS LAS ÓRDENES
================================= */

export const getOrdenes = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const limit = req.query.limit
      ? parseInt(req.query.limit)
      : undefined

    const ordenes = await prisma.ordenServicio.findMany({

      where: { tallerId: req.tallerId },

      include: {
        vehiculo: {
          include: { cliente: true }
        }
      },

      orderBy: { fecha: "desc" },

      ...(limit && { take: limit })

    })

    res.json(ordenes)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo órdenes" })
  }

}

/* =================================
   OBTENER UNA ORDEN
================================= */

export const getOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const id = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({

      where: { id, tallerId: req.tallerId },

      include: {
        vehiculo: {
          include: { cliente: true }
        }
      }

    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    res.json(orden)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo orden" })
  }

}

/* =================================
   CREAR ORDEN
================================= */

export const crearOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const { descripcion, vehiculoId } = req.body

    const orden = await prisma.ordenServicio.create({
      data: {
        descripcion,
        vehiculoId,
        tallerId: req.tallerId,
        total:    0,
        estado:   "pendiente"
      }
    })

    res.json(orden)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error creando orden" })
  }

}

/* =================================
   CAMBIAR ESTADO
================================= */

export const cambiarEstadoOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const id = parseInt(req.params.id)
    const { estado, metodoPago } = req.body

    if (!ESTADOS_ORDEN.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" })
    }

    if (estado === "cancelada" && req.taller?.rol !== "admin") {
      return res.status(403).json({
        error: "Solo un administrador puede cancelar órdenes"
      })
    }

    if (metodoPago && !METODOS_PAGO_VALIDOS.includes(metodoPago)) {
      return res.status(400).json({ error: "Método de pago inválido" })
    }

    const data = { estado }

    // Método de pago
    if (ESTADOS_CON_PAGO.includes(estado) && metodoPago) {
      data.metodoPago = metodoPago
    } else if (!ESTADOS_CON_PAGO.includes(estado)) {
      data.metodoPago = null
    }

    // ✅ Fecha de entrega — se registra al entregar, se limpia en cualquier otro estado
    if (estado === "entregada") {
      data.fechaEntrega = new Date()
    } else {
      data.fechaEntrega = null
    }

    const result = await prisma.ordenServicio.updateMany({
      where: { id, tallerId: req.tallerId },
      data
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    res.json({ mensaje: "Estado actualizado correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error actualizando estado" })
  }

}

/* =================================
   CANCELAR ORDEN — solo admin
   Marca como cancelada y desvincula
   la cita asociada si existe.
   No borra nada de la base de datos.
================================= */

export const cancelarOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const id = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    if (orden.estado === "cancelada") {
      return res.status(409).json({ error: "La orden ya está cancelada" })
    }

    await prisma.$transaction(async (tx) => {

      await tx.ordenServicio.update({
        where: { id },
        data:  {
          estado:       "cancelada",
          metodoPago:   null,
          fechaEntrega: null
        }
      })

      // Desvincular la cita sin borrarla — queda libre para reagendar
      await tx.cita.updateMany({
        where: { ordenId: id },
        data:  { ordenId: null }
      })

    })

    res.json({ mensaje: "Orden cancelada correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error cancelando orden" })
  }

}

/* =================================
   COMENTARIOS DE ORDEN
================================= */

export const getComentarios = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const ordenId = parseInt(req.params.id)

    // Verificar que la orden pertenece al taller
    const orden = await prisma.ordenServicio.findFirst({
      where:  { id: ordenId, tallerId: req.tallerId },
      select: { id: true }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    const comentarios = await prisma.ordenComentario.findMany({
      where:   { ordenId },
      include: { user: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: "asc" }
    })

    res.json(comentarios)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo comentarios" })
  }

}

export const agregarComentario = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const ordenId = parseInt(req.params.id)
    const { texto } = req.body

    if (!texto?.trim()) {
      return res.status(400).json({ error: "El comentario no puede estar vacío" })
    }

    // Verificar que la orden pertenece al taller
    const orden = await prisma.ordenServicio.findFirst({
      where:  { id: ordenId, tallerId: req.tallerId },
      select: { id: true }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    const comentario = await prisma.ordenComentario.create({
      data:    { texto: texto.trim(), ordenId, userId: req.user.id },
      include: { user: { select: { id: true, nombre: true } } }
    })

    res.status(201).json(comentario)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error guardando comentario" })
  }

}

/* =================================
   TOTAL DE ORDEN
================================= */

export const getTotalOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const ordenId = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({
      where:  { id: ordenId, tallerId: req.tallerId },
      select: { total: true }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    res.json({ ordenId, total: orden.total })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo total" })
  }

}