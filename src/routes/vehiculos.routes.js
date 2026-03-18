import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()


// =========================
// AUTOCOMPLETE PLACAS
// =========================
router.get("/buscar-parcial", async (req, res) => {

  try {

    const placas = req.query.placas || ""

    if (placas.length < 2) {
      return res.json([])
    }

    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        placas: {
          contains: placas,
          mode: "insensitive"
        },
        tallerId: req.tallerId
      },

      include: {
        cliente: true
      },

      take: 5

    })

    return res.json(vehiculos)

  } catch (error) {

    console.error("buscar-parcial error:", error)

    return res.json([])

  }

})


// =========================
// BUSCAR VEHICULO EXACTO
// =========================
router.get("/buscar", async (req, res) => {

  try {

    const placas = req.query.placas

    if (!placas) {
      return res.json(null)
    }

    const vehiculo = await prisma.vehiculo.findFirst({

      where: {
        placas: {
          contains: placas,
          mode: "insensitive"
        },
        tallerId: req.tallerId
      },

      include: {

        cliente: true,

        ordenes: {
          orderBy: {
            fecha: "desc"
          },
          take: 1
        }

      }

    })

    return res.json(vehiculo)

  } catch (error) {

    console.error("buscar error:", error)

    return res.json(null)

  }

})


// =========================
// CREAR VEHICULO
// =========================
router.post("/", async (req, res) => {

  try {

    const { marca, modelo, anio, placas, clienteId } = req.body

    const vehiculo = await prisma.vehiculo.create({

      data: {
        marca,
        modelo,
        anio,
        placas,
        clienteId,
        tallerId: req.tallerId
      }

    })

    res.json(vehiculo)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error creando vehículo"
    })

  }

})


// =========================
// HISTORIAL VEHICULO
// =========================
router.get("/:id/historial", async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

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

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado" })
    }


    const ordenes = vehiculo.ordenes.map((orden) => {

      let total = 0

      orden.detalles.forEach(det => {
        total += det.precio * det.cantidad
      })

      return {
        id: orden.id,
        fecha: orden.fecha,
        estado: orden.estado,
        total,
        detalles: orden.detalles
      }

    })


    res.json({

      vehiculo: {
        id: vehiculo.id,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        placas: vehiculo.placas
      },

      cliente: vehiculo.cliente,

      ordenes

    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo historial"
    })

  }

})


// =========================
// VEHICULOS POR CLIENTE
// =========================
router.get("/cliente/:clienteId", async (req, res) => {

  try {

    const clienteId = parseInt(req.params.clienteId)

    if (isNaN(clienteId)) {
      return res.status(400).json({ error: "Cliente inválido" })
    }

    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        clienteId,
        tallerId: req.tallerId
      },

      orderBy: {
        id: "desc"
      }

    })

    res.json(vehiculos)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo vehículos del cliente"
    })

  }

})


// =========================
// TODOS LOS VEHICULOS
// =========================
router.get("/", async (req, res) => {

  try {

    const vehiculos = await prisma.vehiculo.findMany({

      where: {
        tallerId: req.tallerId
      },

      include: {
        cliente: true
      },

      orderBy: {
        id: "desc"
      }

    })

    res.json(vehiculos)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo vehículos"
    })

  }

})

router.get("/buscar-global", buscarGlobal)

async function buscarGlobal(req, res) {

  try {

    const q = req.query.q || ""

    if (q.length < 2) {
      return res.json([])
    }

    const vehiculos = await prisma.vehiculo.findMany({

      where: {

        tallerId: req.tallerId,

        OR: [

          {
            placas: {
              contains: q,
              mode: "insensitive"
            }
          },

          {
            cliente: {
              nombre: {
                contains: q,
                mode: "insensitive"
              }
            }
          },

          {
            cliente: {
              telefono: {
                contains: q
              }
            }
          }

        ]

      },

      include: {
        cliente: true
      },

      take: 10

    })

    res.json(vehiculos)

  } catch (error) {

    console.error("buscar-global error:", error)

    res.status(500).json({
      error: "Error en búsqueda"
    })

  }

}

export default router