import prisma from "../lib/prisma.js"


export const getServicios = async (req, res) => {

  try {

    const servicios = await prisma.servicio.findMany({

      orderBy: {
        nombre: "asc"
      }

    })

    res.json(servicios)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo servicios"
    })

  }

}



export const crearServicio = async (req, res) => {

  try {

    const { nombre, precio } = req.body

    if (!nombre || !precio) {
      return res.status(400).json({
        error: "Nombre y precio son requeridos"
      })
    }

    const existente = await prisma.servicio.findFirst({
      where: {
        nombre: nombre.trim()
      }
    })

    if (existente) {
      return res.status(400).json({
        error: "El servicio ya existe"
      })
    }

    const servicio = await prisma.servicio.create({

      data: {
        nombre: nombre.trim(),
        precio: parseFloat(precio)
      }

    })

    res.json(servicio)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error creando servicio"
    })

  }

}