import prisma from "../lib/prisma.js"


export const getClientes = async (req, res) => {

  try {

    const clientes = await prisma.cliente.findMany({

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

    const cliente = await prisma.cliente.findUnique({

      where: { id },

      include: {
        vehiculos: true
      }

    })

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" })
    }

    res.json(cliente)

  } catch (error) {

    res.status(500).json({ error: "Error obteniendo cliente" })

  }

}



export const crearCliente = async (req, res) => {

  try {

    const { nombre, telefono, email } = req.body

    const cliente = await prisma.cliente.create({

      data: {
        nombre,
        telefono,
        email
      }

    })

    res.json(cliente)

  } catch (error) {

    res.status(500).json({ error: "Error creando cliente" })

  }

}



export const actualizarCliente = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    const { nombre, telefono, email } = req.body

    const cliente = await prisma.cliente.update({

      where: { id },

      data: {
        nombre,
        telefono,
        email
      }

    })

    res.json(cliente)

  } catch (error) {

    res.status(500).json({ error: "Error actualizando cliente" })

  }

}



export const eliminarCliente = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    await prisma.cliente.delete({

      where: { id }

    })

    res.json({ message: "Cliente eliminado" })

  } catch (error) {

    res.status(500).json({ error: "Error eliminando cliente" })

  }

}