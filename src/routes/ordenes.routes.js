import { Router } from "express"

import {
  getOrdenes,
  getOrden,
  crearOrden,
  cambiarEstadoOrden,
  cancelarOrden
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

import { requireRol } from "../middleware/roleMiddleware.js"

const router = Router()

/* ================================
   VALIDAR ID NUMÉRICO
================================ */

const validarId = (req, res, next) => {

  const id = parseInt(req.params.id)

  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" })
  }

  req.params.id = id
  next()

}

/* ================================
   ÓRDENES
================================ */

router.get("/",    getOrdenes)
router.get("/:id", validarId, getOrden)
router.post("/",   crearOrden)

router.patch("/:id/estado", validarId, cambiarEstadoOrden)

// ✅ Cancelar en lugar de borrar — solo admin
// Marca la orden como "cancelada" y desvincula la cita asociada.
// Los datos quedan en la BD para historial y auditoría.
router.post("/:id/cancelar", validarId, requireRol("admin"), cancelarOrden)

// ✅ El DELETE está eliminado intencionalmente.
// Borrar una orden destruye el historial del vehículo y puede
// dejar citas huérfanas. Usa POST /:id/cancelar en su lugar.

/* ================================
   SERVICIOS EN ORDEN
================================ */

router.get("/:id/servicios",  validarId, getServiciosOrden)
router.post("/:id/servicios", validarId, agregarServicioOrden)
router.get("/:id/total",      validarId, getTotalOrden)

router.put("/servicios/:detalleId",          actualizarPrecioServicio)
router.put("/servicios/:detalleId/cantidad", actualizarCantidadServicio)
router.delete("/servicios/:detalleId",       eliminarServicioOrden)

/* ================================
   PDF
================================ */

router.get("/:id/pdf", validarId, generarPDFOrden)

export default router