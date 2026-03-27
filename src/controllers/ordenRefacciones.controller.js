import prisma from "../lib/prisma.js"

/* =================================
   RECALCULAR TOTAL (servicios + refacciones)
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
   GET — refacciones de una orden
================================= */

export const getRefaccionesOrden = async (req, res) => {
  try {

    const ordenId = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, tallerId: req.tallerId }
    })

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" })

    const refacciones = await prisma.ordenRefaccion.findMany({
      where: { ordenId },
      include: { refaccion: true }
    })

    res.json(refacciones)

  } catch (error) {
    console.error("[getRefaccionesOrden]", error)
    res.status(500).json({ error: "Error obteniendo refacciones de la orden" })
  }
}

/* =================================
   POST — agregar refacción a orden
   Descuenta stock automáticamente
================================= */

export const agregarRefaccionOrden = async (req, res) => {
  try {

    const ordenId    = parseInt(req.params.id)
    const { refaccionId, cantidad } = req.body

    if (!refaccionId) {
      return res.status(400).json({ error: "refaccionId es requerido" })
    }

    const cantidadNum = parseInt(cantidad) > 0 ? parseInt(cantidad) : 1

    const orden = await prisma.ordenServicio.findFirst({
      where: { id: ordenId, tallerId: req.tallerId }
    })

    if (!orden) return res.status(404).json({ error: "Orden no encontrada" })

    const refaccion = await prisma.refaccion.findFirst({
      where: { id: parseInt(refaccionId), tallerId: req.tallerId }
    })

    if (!refaccion) return res.status(404).json({ error: "Refacción no encontrada" })

    if (refaccion.stock < cantidadNum) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${refaccion.stock}`,
        stock: refaccion.stock
      })
    }

    await prisma.$transaction([
      prisma.ordenRefaccion.create({
        data: {
          ordenId,
          refaccionId: parseInt(refaccionId),
          cantidad:    cantidadNum,
          precio:      refaccion.precioVenta
        }
      }),
      prisma.refaccion.update({
        where: { id: parseInt(refaccionId) },
        data:  { stock: { decrement: cantidadNum } }
      })
    ])

    await recalcularTotalOrden(ordenId)

    res.status(201).json({ ok: true })

  } catch (error) {
    console.error("[agregarRefaccionOrden]", error)
    res.status(500).json({ error: "Error agregando refacción a la orden" })
  }
}

/* =================================
   PUT — actualizar cantidad
   Ajusta el stock con el delta
================================= */

export const actualizarCantidadRefaccionOrden = async (req, res) => {
  try {

    const refOrdenId  = parseInt(req.params.refOrdenId)
    const cantidadNueva = parseInt(req.body.cantidad)

    if (!cantidadNueva || cantidadNueva < 1) {
      return res.status(400).json({ error: "Cantidad debe ser al menos 1" })
    }

    const item = await prisma.ordenRefaccion.findFirst({
      where: {
        id:    refOrdenId,
        orden: { tallerId: req.tallerId }
      },
      include: { refaccion: true }
    })

    if (!item) return res.status(404).json({ error: "Ítem no encontrado" })

    // delta positivo = se libera stock, negativo = se consume más
    const delta      = item.cantidad - cantidadNueva
    const nuevoStock = item.refaccion.stock + delta

    if (nuevoStock < 0) {
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${item.refaccion.stock}`,
        stock: item.refaccion.stock
      })
    }

    await prisma.$transaction([
      prisma.ordenRefaccion.update({
        where: { id: refOrdenId },
        data:  { cantidad: cantidadNueva }
      }),
      prisma.refaccion.update({
        where: { id: item.refaccionId },
        data:  { stock: nuevoStock }
      })
    ])

    await recalcularTotalOrden(item.ordenId)

    res.json({ ok: true })

  } catch (error) {
    console.error("[actualizarCantidadRefaccionOrden]", error)
    res.status(500).json({ error: "Error actualizando cantidad" })
  }
}

/* =================================
   DELETE — quitar refacción de orden
   Restaura stock automáticamente
================================= */

export const eliminarRefaccionOrden = async (req, res) => {
  try {

    const refOrdenId = parseInt(req.params.refOrdenId)

    const item = await prisma.ordenRefaccion.findFirst({
      where: {
        id:    refOrdenId,
        orden: { tallerId: req.tallerId }
      }
    })

    if (!item) return res.status(404).json({ error: "Ítem no encontrado" })

    await prisma.$transaction([
      prisma.ordenRefaccion.delete({ where: { id: refOrdenId } }),
      prisma.refaccion.update({
        where: { id: item.refaccionId },
        data:  { stock: { increment: item.cantidad } }
      })
    ])

    await recalcularTotalOrden(item.ordenId)

    res.json({ ok: true })

  } catch (error) {
    console.error("[eliminarRefaccionOrden]", error)
    res.status(500).json({ error: "Error eliminando refacción de la orden" })
  }
}
