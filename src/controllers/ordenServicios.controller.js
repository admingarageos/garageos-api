import prisma from "../lib/prisma.js"

/* =================================
   RECALCULAR TOTAL
================================= */

const recalcularTotalOrden = async (ordenId) => {

  const detalles = await prisma.ordenServicioDetalle.findMany({
    where: { ordenId }
  })

  const total = detalles.reduce((acc, d) => {
    return acc + (d.precio * d.cantidad)
  }, 0)

  await prisma.ordenServicio.update({
    where: { id: ordenId },
    data: { total }
  })

}

/* =================================
   SERVICIOS DE UNA ORDEN
================================= */

export const getServiciosOrden = async (req, res) => {

  try {

    const ordenId = parseInt(req.params.id)

    const servicios = await prisma.ordenServicioDetalle.findMany({
      where: { ordenId },
      include: { servicio: true }
    })

    res.json(servicios)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo servicios"
    })

  }

}

/* =================================
   AGREGAR SERVICIO
================================= */

export const agregarServicioOrden = async (req, res) => {

  try {

    const ordenId = parseInt(req.params.id)
    const { servicioId, cantidad } = req.body

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId }
    })

    await prisma.ordenServicioDetalle.create({
      data: {
        ordenId,
        servicioId,
        cantidad: cantidad || 1,
        precio: servicio.precio
      }
    })

    await recalcularTotalOrden(ordenId)

    res.json({ ok: true })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error agregando servicio"
    })

  }

}

/* =================================
   ACTUALIZAR PRECIO
================================= */

export const actualizarPrecioServicio = async (req, res) => {

  try {

    const detalleId = parseInt(req.params.detalleId)
    const { precio } = req.body

    const detalle = await prisma.ordenServicioDetalle.update({
      where: { id: detalleId },
      data: { precio: parseFloat(precio) }
    })

    await recalcularTotalOrden(detalle.ordenId)

    res.json(detalle)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error actualizando precio"
    })

  }

}

/* =================================
   ACTUALIZAR CANTIDAD
================================= */

export const actualizarCantidadServicio = async (req, res) => {

  try {

    const detalleId = parseInt(req.params.detalleId)
    const { cantidad } = req.body

    const detalle = await prisma.ordenServicioDetalle.update({
      where: { id: detalleId },
      data: { cantidad: parseInt(cantidad) }
    })

    await recalcularTotalOrden(detalle.ordenId)

    res.json(detalle)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error actualizando cantidad"
    })

  }

}

/* =================================
   ELIMINAR SERVICIO
================================= */

export const eliminarServicioOrden = async (req, res) => {

  try {

    const detalleId = parseInt(req.params.detalleId)

    const detalle = await prisma.ordenServicioDetalle.delete({
      where: { id: detalleId }
    })

    await recalcularTotalOrden(detalle.ordenId)

    res.json({ ok: true })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error eliminando servicio"
    })

  }

}

export const getTotalOrden = async (req, res) => {

  try {

    const ordenId = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId },
      select: { total: true }
    })

    res.json({
      total: orden?.total || 0
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo total"
    })

  }

}