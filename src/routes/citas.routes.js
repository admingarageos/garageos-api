import { Router } from "express"
import {
  getCitasMes,
  getCitasSemana,
  crearCita,
  actualizarCita,
  eliminarCita,
  convertirEnOrden
} from "../controllers/citas.controller.js"

const router = Router()

router.get("/mes",     getCitasMes)
router.get("/semana",  getCitasSemana)
router.post("/",       crearCita)
router.patch("/:id",   actualizarCita)
router.delete("/:id",  eliminarCita)
router.post("/:id/convertir", convertirEnOrden)

export default router