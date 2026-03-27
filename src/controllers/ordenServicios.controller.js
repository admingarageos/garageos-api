import prisma from "../lib/prisma.js"

/* =================================
   HELPER — verifica que el detalle pertenece
   a una orden del taller del usuario.
   Evita que un usuario de otro taller pueda
   modificar/eliminar detalles ajenos con solo
   adivinar el detalleId.
================================= */

const getDetalleConAcceso = async (detalleId, tallerId) => {
  const detalle = await prisma.ordenServicioDetalle.findFirst({
    where: {
      id: detalleId,
      orden: {
        tallerId
      }
    }
  })
  return detalle
}

/* =================================
   RECALCULAR TOTAL
================================= */

const recalcularTotalOrden = async (ordenId) => {
  const [detalles, refacciones] = await Promise.all([
    prisma.ordenServicioDetalle.findMany({ where: { ordenId } }),
    prisma.ordenRefaccion.findMany({ where: { ordenId } })
  ])

  const total =
    detalles.reduce((acc, d) => acc + d.precio * d.cantidad, 0) +
    refacciones.reduce((acc, r) => acc + r.precio * r.cantidad, 0)

  await prisma.ordenServicio.update({
    where: { id: ordenId },
    data: { total }
  })
}

/* =================================
   SERVICIOS DE UNA ORDEN
   (La orden ya viene validada por la ruta
   que usa ordenes.controller → tallerId)
================================= */

export const getServiciosOrden = async (req, res) => {
  try {

    const ordenId = parseInt(req.params.id)

    // Verificar que la orden pertenece al taller
    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, tallerId: req.tallerId }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    const servicios = await prisma.ordenServicioDetalle.findMany({
      where: { ordenId },
      include: { servicio: true }
    })

    res.json(servicios)

  } catch (error) {
    console.error("[getServiciosOrden]", error)
    res.status(500).json({ error: "Error obteniendo servicios" })
  }
}

/* =================================
   AGREGAR SERVICIO A ORDEN
================================= */

export const agregarServicioOrden = async (req, res) => {
  try {

    const ordenId = parseInt(req.params.id)
    const { servicioId, cantidad } = req.body

    // Verificar que la orden pertenece al taller
    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, tallerId: req.tallerId }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    if (!servicioId) {
      return res.status(400).json({ error: "servicioId es requerido" })
    }

    const servicio = await prisma.servicio.findUnique({
      where: { id: servicioId }
    })

    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    const cantidadNum = cantidad && parseInt(cantidad) > 0 ? parseInt(cantidad) : 1

    await prisma.ordenServicioDetalle.create({
      data: {
        ordenId,
        servicioId,
        cantidad: cantidadNum,
        precio: servicio.precio
      }
    })

    await recalcularTotalOrden(ordenId)

    res.status(201).json({ ok: true })

  } catch (error) {
    console.error("[agregarServicioOrden]", error)
    res.status(500).json({ error: "Error agregando servicio" })
  }
}

/* =================================
   ACTUALIZAR PRECIO DE DETALLE
================================= */

export const actualizarPrecioServicio = async (req, res) => {
  try {

    const detalleId = parseInt(req.params.detalleId)
    const { precio } = req.body

    if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      return res.status(400).json({ error: "Precio inválido" })
    }

    // Verifica que el detalle pertenece a una orden de este taller
    const detalle = await getDetalleConAcceso(detalleId, req.tallerId)

    if (!detalle) {
      return res.status(404).json({ error: "Detalle no encontrado" })
    }

    const updated = await prisma.ordenServicioDetalle.update({
      where: { id: detalleId },
      data: { precio: parseFloat(precio) }
    })

    await recalcularTotalOrden(updated.ordenId)

    res.json(updated)

  } catch (error) {
    console.error("[actualizarPrecioServicio]", error)
    res.status(500).json({ error: "Error actualizando precio" })
  }
}

/* =================================
   ACTUALIZAR CANTIDAD DE DETALLE
================================= */

export const actualizarCantidadServicio = async (req, res) => {
  try {

    const detalleId = parseInt(req.params.detalleId)
    const { cantidad } = req.body

    const cantidadNum = parseInt(cantidad)

    if (!cantidadNum || cantidadNum < 1) {
      return res.status(400).json({ error: "Cantidad debe ser al menos 1" })
    }

    // Verifica que el detalle pertenece a una orden de este taller
    const detalle = await getDetalleConAcceso(detalleId, req.tallerId)

    if (!detalle) {
      return res.status(404).json({ error: "Detalle no encontrado" })
    }

    const updated = await prisma.ordenServicioDetalle.update({
      where: { id: detalleId },
      data: { cantidad: cantidadNum }
    })

    await recalcularTotalOrden(updated.ordenId)

    res.json(updated)

  } catch (error) {
    console.error("[actualizarCantidadServicio]", error)
    res.status(500).json({ error: "Error actualizando cantidad" })
  }
}

/* =================================
   ELIMINAR SERVICIO DE ORDEN
================================= */

export const eliminarServicioOrden = async (req, res) => {
  try {

    const detalleId = parseInt(req.params.detalleId)

    // Verifica que el detalle pertenece a una orden de este taller
    const detalle = await getDetalleConAcceso(detalleId, req.tallerId)

    if (!detalle) {
      return res.status(404).json({ error: "Detalle no encontrado" })
    }

    await prisma.ordenServicioDetalle.delete({
      where: { id: detalleId }
    })

    await recalcularTotalOrden(detalle.ordenId)

    res.json({ ok: true })

  } catch (error) {
    console.error("[eliminarServicioOrden]", error)
    res.status(500).json({ error: "Error eliminando servicio" })
  }
}

/* =================================
   TOTAL DE ORDEN
================================= */

export const getTotalOrden = async (req, res) => {
  try {

    const ordenId = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, tallerId: req.tallerId },
      select: { total: true }
    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    res.json({ total: orden.total ?? 0 })

  } catch (error) {
    console.error("[getTotalOrden]", error)
    res.status(500).json({ error: "Error obteniendo total" })
  }
}