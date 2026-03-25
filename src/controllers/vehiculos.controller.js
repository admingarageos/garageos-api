import prisma from "../lib/prisma.js"


export const getVehiculos = async (req, res) => {

  try {

    // ✅ FIX: filtrar por tallerId
    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        tallerId: req.tallerId
      },

      include: {
        cliente: true
      },

      orderBy: {
        placas: "asc"
      }

    })

    res.json(vehiculos)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo vehículos" })

  }

}



export const getVehiculosPorCliente = async (req, res) => {

  try {

    const clienteId = parseInt(req.params.clienteId)

    // ✅ FIX: filtrar por tallerId además de clienteId
    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        clienteId,
        tallerId: req.tallerId
      }

    })

    res.json(vehiculos)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo vehículos" })

  }

}



export const buscarVehiculoPorPlacas = async (req, res) => {

  try {

    const { placas } = req.query

    // ✅ FIX: filtrar por tallerId para no exponer placas de otros talleres
    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        tallerId: req.tallerId,
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

    console.error(error)
    res.status(500).json({ error: "Error buscando vehículo" })

  }

}



export const crearVehiculo = async (req, res) => {

  try {

    const { marca, modelo, anio, placas, clienteId } = req.body

    // ✅ FIX: validar campos requeridos
    if (!marca || !modelo || !anio || !placas || !clienteId) {
      return res.status(400).json({
        error: "Marca, modelo, año, placas y cliente son requeridos"
      })
    }

    // ✅ FIX: guardar tallerId — sin esto la restricción @@unique([placas, tallerId]) no funciona
    //    y las placas quedarían sin taller asignado
    const vehiculo = await prisma.vehiculo.create({

      data: {
        marca:     marca.trim(),
        modelo:    modelo.trim(),
        anio:      parseInt(anio),
        placas:    placas.trim().toUpperCase(),
        clienteId: parseInt(clienteId),
        tallerId:  req.tallerId
      }

    })

    res.status(201).json(vehiculo)

  } catch (error) {

    console.error(error)

    // ✅ FIX: manejar placas duplicadas dentro del mismo taller
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe un vehículo con esas placas en este taller"
      })
    }

    res.status(500).json({ error: "Error creando vehículo" })

  }

}



export const getHistorialVehiculo = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    // ✅ FIX: filtrar por tallerId para que no sea accesible desde otro taller
    const vehiculo = await prisma.vehiculo.findFirst({

      where: {
        id,
        tallerId: req.tallerId
      },

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

    // ✅ FIX: manejar el caso donde el vehículo no existe (antes crasheaba el servidor)
    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado" })
    }

    res.json({
      vehiculo,
      cliente: vehiculo.cliente,
      ordenes: vehiculo.ordenes
    })

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo historial" })

  }

}

export const buscarGlobal = async (req, res) => {

  try {

    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json([])
    }

    // ✅ FIX: filtrar por tallerId para que la búsqueda global solo muestre resultados del taller actual
    const resultados = await prisma.vehiculo.findMany({

      where: {

        tallerId: req.tallerId,

        OR: [
          { placas:  { contains: q, mode: "insensitive" } },
          { marca:   { contains: q, mode: "insensitive" } },
          { modelo:  { contains: q, mode: "insensitive" } },
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