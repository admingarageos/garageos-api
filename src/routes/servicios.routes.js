import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()


/* ================================
   OBTENER SERVICIOS
================================ */

router.get("/", async (req, res) => {

  try {

    const servicios = await prisma.servicio.findMany({
      orderBy: { nombre: "asc" }
    })

    res.json(servicios)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo servicios"
    })

  }

})


/* ================================
   ACTUALIZAR PRECIO
================================ */

router.put("/:id", async (req, res) => {

  try {

    const id = parseInt(req.params.id)
    const { precio } = req.body

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido"
      })
    }

    const servicio = await prisma.servicio.update({
      where: { id },
      data: {
        precio: parseFloat(precio)
      }
    })

    res.json(servicio)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error actualizando precio"
    })

  }

})


export default router