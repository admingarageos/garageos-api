import { Router } from "express"
import prisma from "../lib/prisma.js"

const router = Router()


// OBTENER CLIENTES
router.get("/", async (req, res) => {

  try {

    const clientes = await prisma.cliente.findMany({
  where: {
    tallerId: req.tallerId
  },
  include: {
    vehiculos: true
  }
})

    res.json(clientes)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error obteniendo clientes" })

  }

})


// CLIENTE POR ID
router.get("/:id", async (req, res) => {

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

    console.error(error)
    res.status(500).json({ error: "Error obteniendo cliente" })

  }

})


// CREAR CLIENTE
router.post("/", async (req, res) => {

  try {

    const { nombre, telefono, email } = req.body

    const tallerId = req.tallerId || 1

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        telefono,
        email,
        tallerId
      }
    })

    res.json(cliente)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error creando cliente" })

  }

})


// ACTUALIZAR CLIENTE
router.put("/:id", async (req, res) => {

  try {

    const id = parseInt(req.params.id)
    const { nombre, telefono, email } = req.body
    const tallerId = req.tallerId

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre,
        telefono,
        email,
        tallerId
      }
    })

    res.json(cliente)

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error actualizando cliente" })

  }

})


// ELIMINAR CLIENTE
router.delete("/:id", async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    await prisma.cliente.delete({
      where: { id }
    })

    res.json({ message: "Cliente eliminado" })

  } catch (error) {

    console.error(error)
    res.status(500).json({ error: "Error eliminando cliente" })

  }

})

export default router