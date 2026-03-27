import { Router } from "express"
import prisma from "../lib/prisma.js"
import { requireRol } from "../middleware/roleMiddleware.js"

const router = Router()


/* ================================
   OBTENER SERVICIOS
   ✅ Todos los roles pueden leer
   (mecánicos los necesitan para
    agregarlos a órdenes de trabajo)
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
   CREAR SERVICIO — solo admin
================================ */

router.post("/", requireRol("admin"), async (req, res) => {

  try {

    const { nombre, precio } = req.body

    if (!nombre || precio === undefined) {
      return res.status(400).json({
        error: "Nombre y precio son requeridos"
      })
    }

    if (isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      return res.status(400).json({ error: "Precio inválido" })
    }

    const existente = await prisma.servicio.findFirst({
      where: { nombre: nombre.trim() }
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

    res.status(201).json(servicio)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error creando servicio"
    })

  }

})


/* ================================
   ACTUALIZAR PRECIO — solo admin
================================ */

router.put("/:id", requireRol("admin"), async (req, res) => {

  try {

    const id = parseInt(req.params.id)
    const { precio } = req.body

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido"
      })
    }

    if (precio === undefined || isNaN(parseFloat(precio)) || parseFloat(precio) < 0) {
      return res.status(400).json({
        error: "Precio inválido"
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


/* ================================
   ELIMINAR SERVICIO — solo admin
================================ */

router.delete("/:id", requireRol("admin"), async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({
        error: "ID inválido"
      })
    }

    await prisma.servicio.delete({
      where: { id }
    })

    res.json({ mensaje: "Servicio eliminado correctamente" })

  } catch (error) {

    console.error(error)

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Servicio no encontrado" })
    }

    res.status(500).json({
      error: "Error eliminando servicio"
    })

  }

})


export default router