import prisma from "../lib/prisma.js"


export const getVehiculos = async (req, res) => {

  try {

    const vehiculos = await prisma.vehiculo.findMany({

      include: {
        cliente: true
      },

      orderBy: {
        placas: "asc"
      }

    })

    res.json(vehiculos)

  } catch (error) {

    res.status(500).json({ error: "Error obteniendo vehículos" })

  }

}



export const getVehiculosPorCliente = async (req, res) => {

  try {

    const clienteId = parseInt(req.params.clienteId)

    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        clienteId
      }

    })

    res.json(vehiculos)

  } catch (error) {

    res.status(500).json({ error: "Error obteniendo vehículos" })

  }

}



export const buscarVehiculoPorPlacas = async (req, res) => {

  try {

    const { placas } = req.query

    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        placas: {
          contains: placas,
          mode: "insensitive"
        }
      },

      include: {
        cliente: true
      }

    })

    res.json(vehiculos)

  } catch (error) {

    res.status(500).json({ error: "Error buscando vehículo" })

  }

}



export const crearVehiculo = async (req, res) => {

  try {

    const { marca, modelo, anio, placas, clienteId } = req.body

    const vehiculo = await prisma.vehiculo.create({

      data: {
        marca,
        modelo,
        anio,
        placas,
        clienteId
      }

    })

    res.json(vehiculo)

  } catch (error) {

    res.status(500).json({ error: "Error creando vehículo" })

  }

}



export const getHistorialVehiculo = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    const vehiculo = await prisma.vehiculo.findUnique({

      where: { id },

      include: {

        cliente: true,

        ordenes: {
          include: {
            detalles: {
              include: {
                servicio: true
              }
            }
          },
          orderBy: {
            fecha: "desc"
          }
        }

      }

    })

    res.json({
      vehiculo,
      cliente: vehiculo.cliente,
      ordenes: vehiculo.ordenes
    })

  } catch (error) {

    res.status(500).json({ error: "Error obteniendo historial" })

  }

}

export const buscarGlobal = async (req, res) => {

  try {

    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json([])
    }

    const resultados = await prisma.vehiculo.findMany({

      where: {

        OR: [
          { placas: { contains: q, mode: "insensitive" } },
          { marca: { contains: q, mode: "insensitive" } },
          { modelo: { contains: q, mode: "insensitive" } },
          {
            cliente: {
              nombre: { contains: q, mode: "insensitive" }
            }
          },
          {
            cliente: {
              telefono: { contains: q }
            }
          }
        ]

      },

      include: {
        cliente: true
      },

      take: 10

    })

    res.json(resultados)

  } catch (error) {

    console.error(error)

    res.status(500).json({ error: "Error buscando" })

  }

}