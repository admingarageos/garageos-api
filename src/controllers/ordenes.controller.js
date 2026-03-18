import prisma from "../lib/prisma.js"

const ESTADOS_ORDEN = [
  "pendiente",
  "en_proceso",
  "terminada",
  "entregada",
  "cancelada"
]

/* =================================
   HELPER: VALIDAR TALLER
================================= */

const requireTaller = (req, res) => {
  if (!req.tallerId) {
    res.status(400).json({
      error: "Taller no seleccionado"
    })
    return false
  }
  return true
}

/* =================================
   OBTENER TODAS LAS ÓRDENES
================================= */

export const getOrdenes = async (req, res) => {

  try {

    // 🔥 YA NO ROMPE EL FLUJO (solo corta limpio)
    if (!requireTaller(req, res)) return

    const limit = req.query.limit
      ? parseInt(req.query.limit)
      : undefined

    const ordenes = await prisma.ordenServicio.findMany({

      where: {
        tallerId: req.tallerId
      },

      include: {
        vehiculo: {
          include: {
            cliente: true
          }
        }
      },

      orderBy: {
        fecha: "desc"
      },

      ...(limit && { take: limit })

    })

    res.json(ordenes)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo órdenes"
    })

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

      where: {
        id,
        tallerId: req.tallerId
      },

      include: {
        vehiculo: {
          include: {
            cliente: true
          }
        }
      }

    })

    if (!orden) {
      return res.status(404).json({
        error: "Orden no encontrada"
      })
    }

    res.json(orden)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo orden"
    })

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
        total: 0,
        estado: "pendiente"
      }
    })

    res.json(orden)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error creando orden"
    })

  }

}

/* =================================
   CAMBIAR ESTADO
================================= */

export const cambiarEstadoOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const id = parseInt(req.params.id)
    const { estado } = req.body

    if (!ESTADOS_ORDEN.includes(estado)) {
      return res.status(400).json({
        error: "Estado inválido"
      })
    }

    const result = await prisma.ordenServicio.updateMany({

      where: {
        id,
        tallerId: req.tallerId
      },

      data: {
        estado
      }

    })

    if (result.count === 0) {
      return res.status(404).json({
        error: "Orden no encontrada"
      })
    }

    res.json({
      mensaje: "Estado actualizado correctamente"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error actualizando estado"
    })

  }

}

/* =================================
   ELIMINAR ORDEN
================================= */

export const eliminarOrden = async (req, res) => {

  try {

    if (!requireTaller(req, res)) return

    const id = Number(req.params.id)

    const result = await prisma.ordenServicio.deleteMany({
      where: {
        id,
        tallerId: req.tallerId
      }
    })

    if (result.count === 0) {
      return res.status(404).json({
        error: "Orden no encontrada"
      })
    }

    res.json({
      mensaje: "Orden eliminada correctamente"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error eliminando orden"
    })

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
      where: {
        id: ordenId,
        tallerId: req.tallerId
      },
      select: { total: true }
    })

    if (!orden) {
      return res.status(404).json({
        error: "Orden no encontrada"
      })
    }

    res.json({
      ordenId,
      total: orden.total
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo total"
    })

  }

}