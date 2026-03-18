import prisma from "../lib/prisma.js"

/* =================================
   RESUMEN DASHBOARD
================================= */

export const getResumen = async (req, res) => {

  try {

    if (!req.tallerId) {
      return res.status(400).json({
        error: "tallerId requerido"
      })
    }

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const semana = new Date()
    semana.setDate(semana.getDate() - 7)

    const mes = new Date()
    mes.setDate(mes.getDate() - 30)

    const filtro = { tallerId: req.tallerId }

    const ventasHoy = await prisma.ordenServicio.aggregate({
      _sum: { total: true },
      where: { ...filtro, fecha: { gte: hoy } }
    })

    const ventasSemana = await prisma.ordenServicio.aggregate({
      _sum: { total: true },
      where: { ...filtro, fecha: { gte: semana } }
    })

    const ventasMes = await prisma.ordenServicio.aggregate({
      _sum: { total: true },
      where: { ...filtro, fecha: { gte: mes } }
    })

    const ticketPromedio = await prisma.ordenServicio.aggregate({
      _avg: { total: true },
      where: filtro
    })

    const pendientes = await prisma.ordenServicio.count({
      where: { ...filtro, estado: "pendiente" }
    })

    const enProceso = await prisma.ordenServicio.count({
      where: { ...filtro, estado: "en_proceso" }
    })

    const terminadas = await prisma.ordenServicio.count({
      where: { ...filtro, estado: "terminada" }
    })

    const entregadas = await prisma.ordenServicio.count({
      where: { ...filtro, estado: "entregada" }
    })

    const totalOrdenes = await prisma.ordenServicio.count({
      where: filtro
    })

    res.json({
      ventasHoy: ventasHoy._sum.total || 0,
      ventasSemana: ventasSemana._sum.total || 0,
      ventasMes: ventasMes._sum.total || 0,
      ticketPromedio: ticketPromedio._avg.total || 0,
      pendientes,
      enProceso,
      terminadas,
      entregadas,
      totalOrdenes
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo resumen"
    })

  }

}

/* =================================
   FINANZAS DASHBOARD
================================= */

export const getFinanzas = async (req, res) => {

  try {

    if (!req.tallerId) {
      return res.status(400).json({
        error: "tallerId requerido"
      })
    }

    const filtro = { tallerId: req.tallerId }

    const ingresos = await prisma.ordenServicio.aggregate({
      _sum: { total: true },
      where: filtro
    })

    const egresos = 0 // placeholder

    const totalIngresos = ingresos._sum.total || 0
    const utilidad = totalIngresos - egresos

    res.json({
      ingresos: totalIngresos,
      egresos,
      utilidad
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo finanzas"
    })

  }

}