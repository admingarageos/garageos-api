import prisma from "../lib/prisma.js"

/* =================================
   LISTAR CITAS POR MES
================================= */

export const getCitasMes = async (req, res) => {
  try {

    const year  = parseInt(req.query.year)
    const month = parseInt(req.query.month)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: "Parámetros year y month inválidos" })
    }

    const inicio = new Date(year, month - 1, 1)
    const fin    = new Date(year, month, 1)

    const citas = await prisma.cita.findMany({
      where: {
        tallerId: req.tallerId,
        fecha: { gte: inicio, lt: fin }
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true } },
        vehiculo: { select: { id: true, marca: true, modelo: true, placas: true } }
      },
      orderBy: { fecha: "asc" }
    })

    res.json(citas)

  } catch (error) {
    console.error("[getCitasMes]", error)
    res.status(500).json({ error: "Error obteniendo citas del mes" })
  }
}

/* =================================
   LISTAR CITAS POR SEMANA
================================= */

export const getCitasSemana = async (req, res) => {
  try {

    const { desde } = req.query

    if (!desde) {
      return res.status(400).json({ error: "Parámetro 'desde' requerido" })
    }

    const inicio = new Date(desde)

    if (isNaN(inicio.getTime())) {
      return res.status(400).json({ error: "Fecha inválida" })
    }

    const fin = new Date(inicio)
    fin.setDate(fin.getDate() + 7)

    const citas = await prisma.cita.findMany({
      where: {
        tallerId: req.tallerId,
        fecha: { gte: inicio, lt: fin }
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true } },
        vehiculo: { select: { id: true, marca: true, modelo: true, placas: true } }
      },
      orderBy: { fecha: "asc" }
    })

    res.json(citas)

  } catch (error) {
    console.error("[getCitasSemana]", error)
    res.status(500).json({ error: "Error obteniendo citas de la semana" })
  }
}

/* =================================
   CREAR CITA
================================= */

export const crearCita = async (req, res) => {
  try {

    const { fecha, descripcion, clienteId, vehiculoId } = req.body

    if (!fecha || !clienteId || !vehiculoId) {
      return res.status(400).json({
        error: "Fecha, cliente y vehículo son requeridos"
      })
    }

    const fechaDate = new Date(fecha)
    if (isNaN(fechaDate.getTime())) {
      return res.status(400).json({ error: "Fecha inválida" })
    }

    const cita = await prisma.cita.create({
      data: {
        fecha:      fechaDate,
        descripcion,
        clienteId:  parseInt(clienteId),
        vehiculoId: parseInt(vehiculoId),
        tallerId:   req.tallerId,
        estado:     "pendiente"
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true } },
        vehiculo: { select: { id: true, marca: true, modelo: true, placas: true } }
      }
    })

    res.status(201).json(cita)

  } catch (error) {
    console.error("[crearCita]", error)
    res.status(500).json({ error: "Error creando cita" })
  }
}

/* =================================
   ACTUALIZAR CITA
================================= */

export const actualizarCita = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const { estado, descripcion, fecha } = req.body
    const estados = ["pendiente", "confirmada", "cancelada", "completada"]

    if (estado && !estados.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" })
    }

    if (fecha && isNaN(new Date(fecha).getTime())) {
      return res.status(400).json({ error: "Fecha inválida" })
    }

    const result = await prisma.cita.updateMany({
      where: { id, tallerId: req.tallerId },
      data: {
        ...(estado      && { estado }),
        ...(descripcion !== undefined && { descripcion }),
        ...(fecha       && { fecha: new Date(fecha) })
      }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    res.json({ mensaje: "Cita actualizada correctamente" })

  } catch (error) {
    console.error("[actualizarCita]", error)
    res.status(500).json({ error: "Error actualizando cita" })
  }
}

/* =================================
   ELIMINAR CITA
================================= */

export const eliminarCita = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const result = await prisma.cita.deleteMany({
      where: { id, tallerId: req.tallerId }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    res.json({ mensaje: "Cita eliminada correctamente" })

  } catch (error) {
    console.error("[eliminarCita]", error)
    res.status(500).json({ error: "Error eliminando cita" })
  }
}

/* =================================
   CONVERTIR CITA EN ORDEN
   Bug original: la transacción creaba la orden
   y actualizaba estado, pero el UPDATE de ordenId
   quedaba FUERA de la transacción. Si algo fallaba
   entre ambas operaciones, la cita quedaba como
   "completada" sin ordenId. Corregido: todo dentro
   de una sola transacción.
================================= */

export const convertirEnOrden = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const cita = await prisma.cita.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    if (cita.ordenId) {
      return res.status(409).json({ error: "Esta cita ya tiene una orden asociada" })
    }

    // Todo en una sola transacción: crear orden + vincular cita
    const orden = await prisma.$transaction(async (tx) => {

      const nuevaOrden = await tx.ordenServicio.create({
        data: {
          descripcion: cita.descripcion || "Orden generada desde cita",
          vehiculoId:  cita.vehiculoId,
          tallerId:    req.tallerId,
          estado:      "pendiente",
          total:       0
        }
      })

      // Vincular y marcar completada en la misma transacción
      await tx.cita.update({
        where: { id },
        data: {
          estado:  "completada",
          ordenId: nuevaOrden.id
        }
      })

      return nuevaOrden
    })

    res.status(201).json({
      mensaje: "Orden creada correctamente",
      ordenId: orden.id
    })

  } catch (error) {
    console.error("[convertirEnOrden]", error)
    res.status(500).json({ error: "Error convirtiendo cita en orden" })
  }
}