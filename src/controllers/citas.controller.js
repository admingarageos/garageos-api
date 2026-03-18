import prisma from "../lib/prisma.js"

/* =================================
   LISTAR CITAS POR MES
================================= */

export const getCitasMes = async (req, res) => {
  try {

    const { year, month } = req.query

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
    console.error(error)
    res.status(500).json({ error: "Error obteniendo citas del mes" })
  }
}

/* =================================
   LISTAR CITAS POR SEMANA
================================= */

export const getCitasSemana = async (req, res) => {
  try {

    const { desde } = req.query

    const inicio = new Date(desde)
    const fin    = new Date(inicio)
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
    console.error(error)
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

    const cita = await prisma.cita.create({
      data: {
        fecha:       new Date(fecha),
        descripcion,
        clienteId:   parseInt(clienteId),
        vehiculoId:  parseInt(vehiculoId),
        tallerId:    req.tallerId,
        estado:      "pendiente"
      },
      include: {
        cliente:  { select: { id: true, nombre: true, telefono: true } },
        vehiculo: { select: { id: true, marca: true, modelo: true, placas: true } }
      }
    })

    res.json(cita)

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error creando cita" })
  }
}

/* =================================
   ACTUALIZAR ESTADO DE CITA
================================= */

export const actualizarCita = async (req, res) => {
  try {

    const id     = parseInt(req.params.id)
    const { estado, descripcion, fecha } = req.body

    const estados = ["pendiente", "confirmada", "cancelada", "completada"]

    if (estado && !estados.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" })
    }

    const cita = await prisma.cita.updateMany({
      where:  { id, tallerId: req.tallerId },
      data: {
        ...(estado      && { estado }),
        ...(descripcion && { descripcion }),
        ...(fecha       && { fecha: new Date(fecha) })
      }
    })

    if (cita.count === 0) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    res.json({ mensaje: "Cita actualizada correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error actualizando cita" })
  }
}

/* =================================
   ELIMINAR CITA
================================= */

export const eliminarCita = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    const result = await prisma.cita.deleteMany({
      where: { id, tallerId: req.tallerId }
    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    res.json({ mensaje: "Cita eliminada correctamente" })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error eliminando cita" })
  }
}

/* =================================
   CONVERTIR CITA EN ORDEN
================================= */

export const convertirEnOrden = async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    const cita = await prisma.cita.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" })
    }

    if (cita.ordenId) {
      return res.status(400).json({ error: "Esta cita ya tiene una orden asociada" })
    }

    // 🔥 Crear la orden y vincular la cita en una transacción
    const [orden] = await prisma.$transaction([

      prisma.ordenServicio.create({
        data: {
          descripcion: cita.descripcion || "Orden generada desde cita",
          vehiculoId:  cita.vehiculoId,
          tallerId:    req.tallerId,
          estado:      "pendiente",
          total:       0
        }
      }),

      prisma.cita.update({
        where: { id },
        data:  { estado: "completada" }
      })

    ])

    // Vincular la cita a la orden recién creada
    await prisma.cita.update({
      where: { id },
      data:  { ordenId: orden.id }
    })

    res.json({
      mensaje:  "Orden creada correctamente",
      ordenId:  orden.id
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error convirtiendo cita en orden" })
  }
}