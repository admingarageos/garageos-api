import { Router } from "express"
import {
  getRefacciones,
  crearRefaccion,
  actualizarRefaccion,
  eliminarRefaccion,
  ajustarStock
} from "../controllers/refacciones.controller.js"

const router = Router()

router.get   ("/",            getRefacciones)
router.post  ("/",            crearRefaccion)
router.put   ("/:id",         actualizarRefaccion)
router.delete("/:id",         eliminarRefaccion)
router.patch ("/:id/stock",   ajustarStock)

export default router
