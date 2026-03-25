import prisma from "../lib/prisma.js"


export const getClientes = async (req, res) => {

  try {

    // ✅ FIX: filtrar por tallerId para que cada taller solo vea sus clientes
    const clientes = await prisma.cliente.findMany({

      where: {
        tallerId: req.tallerId
      },

      include: {
        vehiculos: true
      },

      orderBy: {
        nombre: "asc"
      }

    })

    res.json(clientes)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo clientes" })

  }

}



export const getCliente = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    // ✅ FIX: usar findFirst con tallerId para evitar acceso cruzado entre talleres
    const cliente = await prisma.cliente.findFirst({

      where: {
        id,
        tallerId: req.tallerId
      },

      include: {
        vehiculos: true
      }

    })

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    res.json(cliente)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo cliente" })

  }

}



export const crearCliente = async (req, res) => {

  try {

    const { nombre, telefono, email } = req.body

    // ✅ FIX: validar campos requeridos
    if (!nombre || !telefono) {
      return res.status(400).json({ error: "Nombre y teléfono son requeridos" })
    }

    // ✅ FIX: guardar tallerId — sin esto el cliente queda sin taller en la BD
    const cliente = await prisma.cliente.create({

      data: {
        nombre:   nombre.trim(),
        telefono: telefono.trim(),
        email:    email?.trim() || null,
        tallerId: req.tallerId
      }

    })

    res.status(201).json(cliente)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error creando cliente" })

  }

}



export const actualizarCliente = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    const { nombre, telefono, email } = req.body

    // ✅ FIX: updateMany con tallerId para que solo pueda editar clientes de su taller
    const result = await prisma.cliente.updateMany({

      where: {
        id,
        tallerId: req.tallerId
      },

      data: {
        ...(nombre   && { nombre:   nombre.trim() }),
        ...(telefono && { telefono: telefono.trim() }),
        ...(email !== undefined && { email: email?.trim() || null })
      }

    })

    if (result.count === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    res.json({ mensaje: "Cliente actualizado correctamente" })

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error actualizando cliente" })

  }

}



export const eliminarCliente = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    // ✅ FIX: verificar que el cliente pertenece al taller antes de eliminar
    const cliente = await prisma.cliente.findFirst({
      where: { id, tallerId: req.tallerId }
    })

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    await prisma.cliente.delete({
      where: { id }
    })

    res.json({ mensaje: "Cliente eliminado" })

  } catch (error) {

    console.error(error)

    // ✅ FIX: manejar el error cuando el cliente tiene vehículos u órdenes asociadas
    if (error.code === "P2003" || error.code === "P2014") {
      return res.status(409).json({
        error: "No se puede eliminar el cliente porque tiene vehículos u órdenes asociadas"
      })
    }

    res.status(500).json({ error: "Error eliminando cliente" })

  }

}