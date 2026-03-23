import { Router } from "express"
import prisma from "../lib/prisma.js"
import { uploadLogo } from "../middleware/uploadLogo.js"

const router = Router()

/* =========================
   HELPER — verificar que el usuario
   tenga acceso al taller solicitado
========================= */

async function verificarAccesoTaller(userId, tallerId) {
  if (!tallerId || isNaN(tallerId)) return null

  const relacion = await prisma.userTaller.findFirst({
    where: { userId, tallerId },
    include: { taller: true }
  })

  return relacion
}

/* =========================
   OBTENER TALLERES DEL USUARIO
========================= */

router.get("/", async (req, res) => {
  try {

    const talleres = await prisma.userTaller.findMany({
      where: { userId: req.user.id },
      include: { taller: true }
    })

    res.json(talleres.map(t => t.taller))

  } catch (error) {
    console.error("[GET /talleres]", error)
    res.status(500).json({ error: "Error obteniendo talleres" })
  }
})

/* =========================
   OBTENER TALLER POR ID
   Solo si el usuario tiene acceso a ese taller
========================= */

router.get("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const relacion = await verificarAccesoTaller(req.user.id, id)

    if (!relacion) {
      return res.status(403).json({ error: "No tienes acceso a este taller" })
    }

    res.json(relacion.taller)

  } catch (error) {
    console.error("[GET /talleres/:id]", error)
    res.status(500).json({ error: "Error obteniendo taller" })
  }
})

/* =========================
   CREAR TALLER
========================= */

router.post("/", async (req, res) => {
  try {

    const { nombre, telefono, direccion } = req.body

    if (!nombre?.trim()) {
      return res.status(400).json({ error: "Nombre requerido" })
    }

    const taller = await prisma.taller.create({
      data: {
        nombre: nombre.trim(),
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

    res.status(201).json(taller)

  } catch (error) {
    console.error("[POST /talleres]", error)
    res.status(500).json({ error: "Error creando taller" })
  }
})

/* =========================
   ACTUALIZAR TALLER
   Solo si el usuario es admin del taller
========================= */

router.put("/:id", async (req, res) => {
  try {

    const id = parseInt(req.params.id)

    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" })
    }

    const relacion = await verificarAccesoTaller(req.user.id, id)

    if (!relacion) {
      return res.status(403).json({ error: "No tienes acceso a este taller" })
    }

    if (relacion.rol !== "admin") {
      return res.status(403).json({ error: "Solo los admins pueden modificar el taller" })
    }

    const { nombre, telefono, direccion } = req.body

    const taller = await prisma.taller.update({
      where: { id },
      data: { nombre, telefono, direccion }
    })

    res.json(taller)

  } catch (error) {
    console.error("[PUT /talleres/:id]", error)
    res.status(500).json({ error: "Error actualizando taller" })
  }
})

/* =========================
   SUBIR LOGO
   Requiere acceso al taller y rol admin
========================= */

router.post("/logo", (req, res, next) => {
  uploadLogo.single("logo")(req, res, (err) => {
    if (err) {
      if (err.message === "INVALID_FILE_TYPE") {
        return res.status(400).json({ error: "Solo se permiten imágenes JPEG, PNG o WebP" })
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "El archivo no puede pesar más de 2MB" })
      }
      return res.status(400).json({ error: "Error subiendo archivo" })
    }
    next()
  })
}, async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: "No se subió archivo" })
    }

    const tallerId = parseInt(req.headers["x-taller-id"])

    if (!tallerId || isNaN(tallerId)) {
      return res.status(400).json({ error: "Taller no especificado" })
    }

    // Verificar que el usuario tenga acceso de admin a ese taller
    const relacion = await verificarAccesoTaller(req.user.id, tallerId)

    if (!relacion) {
      return res.status(403).json({ error: "No tienes acceso a este taller" })
    }

    if (relacion.rol !== "admin") {
      return res.status(403).json({ error: "Solo los admins pueden cambiar el logo" })
    }

    const ruta = `/uploads/logos/${req.file.filename}`

    await prisma.taller.update({
      where: { id: tallerId },
      data: { logo: ruta }
    })

    res.json({ logo: ruta })

  } catch (error) {
    console.error("[POST /talleres/logo]", error)
    res.status(500).json({ error: "Error subiendo logo" })
  }
})

export default router