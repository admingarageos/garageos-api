import { Router } from "express"
import prisma from "../lib/prisma.js"
import { requireAuth } from "../auth/auth.middleware.js"
import { uploadLogo } from "../middleware/uploadLogo.js"

const router = Router()

/* =========================
   OBTENER TALLERES DEL USUARIO
========================= */

router.get("/", async (req, res) => {
  try {

    const talleres = await prisma.userTaller.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        taller: true
      }
    })

    res.json(talleres.map(t => t.taller))

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo talleres"
    })

  }
})

/* =========================
   OBTENER TALLER POR ID
========================= */

router.get("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    const taller = await prisma.taller.findUnique({
      where: { id }
    })

    if (!taller) {
      return res.status(404).json({
        error: "Taller no encontrado"
      })
    }

    res.json(taller)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo taller"
    })

  }
})

/* =========================
   CREAR TALLER
========================= */

router.post("/", async (req, res) => {
  try {

    const { nombre, telefono, direccion } = req.body

    const taller = await prisma.taller.create({
      data: {
        nombre,
        telefono,
        direccion
      }
    })

    await prisma.userTaller.create({
      data: {
        userId: req.user.id,
        tallerId: taller.id,
        rol: "admin"
      }
    })

    res.json(taller)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error creando taller"
    })

  }
})

/* =========================
   ACTUALIZAR TALLER
========================= */

router.put("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)
    const { nombre, telefono, direccion } = req.body

    const taller = await prisma.taller.update({
      where: { id },
      data: { nombre, telefono, direccion }
    })

    res.json(taller)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error actualizando taller"
    })

  }
})

/* =========================
   SUBIR LOGO
========================= */

router.post("/logo", uploadLogo.single("logo"), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        error: "No se subió archivo"
      })
    }

    const tallerId = parseInt(req.headers["x-taller-id"])

    if (!tallerId) {
      return res.status(400).json({
        error: "Taller no especificado"
      })
    }

    const ruta = `/uploads/logos/${req.file.filename}`

    await prisma.taller.update({
      where: { id: tallerId },
      data: { logo: ruta }
    })

    res.json({ logo: ruta })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error subiendo logo"
    })

  }
})

export default router