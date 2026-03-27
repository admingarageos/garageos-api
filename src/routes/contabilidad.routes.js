import { Router } from "express"
import {
  getResumen,
  getGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto
} from "../controllers/contabilidad.controller.js"

const router = Router()

router.get("/resumen", getResumen)
router.get("/gastos",  getGastos)
router.post("/gastos",       crearGasto)
router.put("/gastos/:id",    actualizarGasto)
router.delete("/gastos/:id", eliminarGasto)

export default router
