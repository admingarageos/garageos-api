import prisma from "../lib/prisma.js"

export const getRefacciones = async (req, res) => {
  try {
    const refacciones = await prisma.refaccion.findMany({
      where:   { tallerId: req.tallerId },
      orderBy: { nombre: "asc" }
    })
    res.json(refacciones)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error obteniendo refacciones" })
  }
}

export const crearRefaccion = async (req, res) => {
  try {
    const { nombre, descripcion, sku, precioCosto, precioVenta, stock, stockMinimo } = req.body

    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es requerido" })

    const refaccion = await prisma.refaccion.create({
      data: {
        nombre:      nombre.trim(),
        descripcion: descripcion?.trim() || null,
        sku:         sku?.trim()         || null,
        precioCosto: parseFloat(precioCosto) || 0,
        precioVenta: parseFloat(precioVenta) || 0,
        stock:       parseInt(stock)       || 0,
        stockMinimo: parseInt(stockMinimo) >= 0 ? parseInt(stockMinimo) : 5,
        tallerId:    req.tallerId
      }
    })

    res.status(201).json(refaccion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error creando refacción" })
  }
}

export const actualizarRefaccion = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const existe = await prisma.refaccion.findFirst({ where: { id, tallerId: req.tallerId } })
    if (!existe) return res.status(404).json({ error: "Refacción no encontrada" })

    const { nombre, descripcion, sku, precioCosto, precioVenta, stock, stockMinimo } = req.body

    const refaccion = await prisma.refaccion.update({
      where: { id },
      data: {
        nombre:      nombre?.trim()      ?? existe.nombre,
        descripcion: descripcion?.trim() || null,
        sku:         sku?.trim()         || null,
        precioCosto: parseFloat(precioCosto) >= 0 ? parseFloat(precioCosto) : existe.precioCosto,
        precioVenta: parseFloat(precioVenta) >= 0 ? parseFloat(precioVenta) : existe.precioVenta,
        stock:       parseInt(stock)       >= 0 ? parseInt(stock)       : existe.stock,
        stockMinimo: parseInt(stockMinimo) >= 0 ? parseInt(stockMinimo) : existe.stockMinimo,
      }
    })

    res.json(refaccion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error actualizando refacción" })
  }
}

export const eliminarRefaccion = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const existe = await prisma.refaccion.findFirst({ where: { id, tallerId: req.tallerId } })
    if (!existe) return res.status(404).json({ error: "Refacción no encontrada" })

    await prisma.refaccion.delete({ where: { id } })

    res.json({ ok: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error eliminando refacción" })
  }
}

export const ajustarStock = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const existe = await prisma.refaccion.findFirst({ where: { id, tallerId: req.tallerId } })
    if (!existe) return res.status(404).json({ error: "Refacción no encontrada" })

    const delta = parseInt(req.body.delta)
    if (isNaN(delta)) return res.status(400).json({ error: "delta debe ser un número" })

    const nuevoStock = Math.max(0, existe.stock + delta)

    const refaccion = await prisma.refaccion.update({
      where: { id },
      data:  { stock: nuevoStock }
    })

    res.json(refaccion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error ajustando stock" })
  }
}
