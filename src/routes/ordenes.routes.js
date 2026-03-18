import { Router } from "express"

import {
  getOrdenes,
  getOrden,
  crearOrden,
  cambiarEstadoOrden,
  eliminarOrden
} from "../controllers/ordenes.controller.js"

import {
  getServiciosOrden,
  agregarServicioOrden,
  getTotalOrden,
  actualizarPrecioServicio,
  actualizarCantidadServicio,
  eliminarServicioOrden
} from "../controllers/ordenServicios.controller.js"

import {
  generarPDFOrden
} from "../controllers/ordenPdf.controller.js"

const router = Router()

/* ================================
   VALIDAR ID NUMÉRICO
================================ */

const validarId = (req, res, next) => {

  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({
      error: "ID inválido"
    })
  }

  req.params.id = id
  next()

}

/* ================================
   ÓRDENES
================================ */

router.get("/", getOrdenes)

router.get("/:id", validarId, getOrden)

router.post("/", crearOrden)

router.patch("/:id/estado", validarId, cambiarEstadoOrden)

router.delete("/:id", validarId, eliminarOrden)

/* ================================
   SERVICIOS EN ORDEN
================================ */

router.get("/:id/servicios", validarId, getServiciosOrden)

router.post("/:id/servicios", validarId, agregarServicioOrden)

router.get("/:id/total", validarId, getTotalOrden)

router.put("/servicios/:detalleId", actualizarPrecioServicio)

router.put("/servicios/:detalleId/cantidad", actualizarCantidadServicio)

router.delete("/servicios/:detalleId", eliminarServicioOrden)

/* ================================
   PDF
================================ */

router.get("/:id/pdf", validarId, generarPDFOrden)

export default router