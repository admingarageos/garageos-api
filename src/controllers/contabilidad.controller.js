import prisma from "../lib/prisma.js"

/* =================================
   HELPER — rango de fechas por período
================================= */

const rangoFechas = (periodo) => {
  const ahora = new Date()

  if (periodo === "hoy") {
    const inicio = new Date(ahora)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(ahora)
    fin.setHours(23, 59, 59, 999)
    return { inicio, fin }
  }

  if (periodo === "semana") {
    const dia = ahora.getDay() // 0=dom, 1=lun...
    const diasDesdeIunes = dia === 0 ? 6 : dia - 1
    const inicio = new Date(ahora)
    inicio.setDate(ahora.getDate() - diasDesdeIunes)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + 6)
    fin.setHours(23, 59, 59, 999)
    return { inicio, fin }
  }

  // mes (default)
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const fin    = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999)
  return { inicio, fin }
}

/* =================================
   GET RESUMEN — ingresos, gastos, utilidad, x cobrar
================================= */

export const getResumen = async (req, res) => {
  try {

    const periodo = req.query.periodo || "mes"
    const { inicio, fin } = rangoFechas(periodo)
    const tallerId = req.tallerId

    const [ordenesPagadas, gastos, cuentasPorCobrar] = await Promise.all([

      // Ingresos: órdenes con pago registrado en el período
      prisma.ordenServicio.findMany({
        where: {
          tallerId,
          metodoPago: { not: null },
          fecha: { gte: inicio, lte: fin }
        },
        select: {
          id: true,
          total: true,
          fecha: true,
          metodoPago: true,
          vehiculo: { select: { placas: true, marca: true, modelo: true } }
        },
        orderBy: { fecha: "desc" }
      }),

      // Gastos del período
      prisma.gasto.findMany({
        where: {
          tallerId,
          fecha: { gte: inicio, lte: fin }
        },
        select: { monto: true, categoria: true }
      }),

      // Cuentas por cobrar: terminadas sin pago (cualquier fecha)
      prisma.ordenServicio.findMany({
        where: {
          tallerId,
          estado:     { in: ["terminada"] },
          metodoPago: null
        },
        select: { id: true, total: true, fecha: true, vehiculo: { select: { placas: true, marca: true, modelo: true } } }
      })
    ])

    const ingresos = ordenesPagadas.reduce((acc, o) => acc + (o.total || 0), 0)
    const totalGastos = gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
    const utilidad = ingresos - totalGastos
    const totalXCobrar = cuentasPorCobrar.reduce((acc, o) => acc + (o.total || 0), 0)

    // Desglose por categoría
    const porCategoria = gastos.reduce((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.monto
      return acc
    }, {})

    res.json({
      periodo,
      ingresos,
      gastos:        totalGastos,
      utilidad,
      margen:        ingresos > 0 ? ((utilidad / ingresos) * 100).toFixed(1) : "0.0",
      porCategoria,
      ordenesCobradas: ordenesPagadas,
      cuentasPorCobrar: {
        total:   totalXCobrar,
        ordenes: cuentasPorCobrar
      }
    })

  } catch (error) {
    console.error("[getResumen contabilidad]", error)
    res.status(500).json({ error: "Error obteniendo resumen" })
  }
}

/* =================================
   GET GASTOS — listado con filtro de período
================================= */

export const getGastos = async (req, res) => {
  try {

    const periodo = req.query.periodo || "mes"
    const { inicio, fin } = rangoFechas(periodo)

    const gastos = await prisma.gasto.findMany({
      where: {
        tallerId: req.tallerId,
        fecha: { gte: inicio, lte: fin }
      },
      orderBy: { fecha: "desc" }
    })

    res.json(gastos)

  } catch (error) {
    console.error("[getGastos]", error)
    res.status(500).json({ error: "Error obteniendo gastos" })
  }
}

/* =================================
   CREAR GASTO
================================= */

export const crearGasto = async (req, res) => {
  try {

    const { concepto, monto, categoria, fecha, nota } = req.body

    if (!concepto?.trim()) return res.status(400).json({ error: "El concepto es requerido" })
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" })
    }

    const gasto = await prisma.gasto.create({
      data: {
        concepto:  concepto.trim(),
        monto:     parseFloat(monto),
        categoria: categoria || "general",
        fecha:     fecha ? new Date(fecha) : new Date(),
        nota:      nota?.trim() || null,
        tallerId:  req.tallerId
      }
    })

    res.status(201).json(gasto)

  } catch (error) {
    console.error("[crearGasto]", error)
    res.status(500).json({ error: "Error creando gasto" })
  }
}

/* =================================
   ACTUALIZAR GASTO
================================= */

export const actualizarGasto = async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const existing = await prisma.gasto.findFirst({
      where: { id, tallerId: req.tallerId }
    })
    if (!existing) return res.status(404).json({ error: "Gasto no encontrado" })

    const { concepto, monto, categoria, fecha, nota } = req.body

    const gasto = await prisma.gasto.update({
      where: { id },
      data: {
        ...(concepto  && { concepto:  concepto.trim() }),
        ...(monto     && { monto:     parseFloat(monto) }),
        ...(categoria && { categoria }),
        ...(fecha     && { fecha:     new Date(fecha) }),
        nota: nota?.trim() || null
      }
    })

    res.json(gasto)

  } catch (error) {
    console.error("[actualizarGasto]", error)
    res.status(500).json({ error: "Error actualizando gasto" })
  }
}

/* =================================
   ELIMINAR GASTO
================================= */

export const eliminarGasto = async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" })

    const result = await prisma.gasto.deleteMany({
      where: { id, tallerId: req.tallerId }
    })

    if (result.count === 0) return res.status(404).json({ error: "Gasto no encontrado" })

    res.json({ ok: true })

  } catch (error) {
    console.error("[eliminarGasto]", error)
    res.status(500).json({ error: "Error eliminando gasto" })
  }
}
