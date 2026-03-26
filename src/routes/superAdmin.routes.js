import { Router } from "express"
import {
  getTalleres,
  suspenderTaller,
  eliminarTaller,
  getUsuarios,
  eliminarUsuario,
  crearUsuario,
  getConfig,
  updateConfig
} from "../controllers/superAdmin.controller.js"

const router = Router()

/* ================================
   TALLERES
================================ */

router.get   ("/talleres",               getTalleres)
router.patch ("/talleres/:id/suspender", suspenderTaller)
router.delete("/talleres/:id",           eliminarTaller)

/* ================================
   USUARIOS
================================ */

router.get   ("/usuarios",    getUsuarios)
router.delete("/usuarios/:id", eliminarUsuario)
router.post  ("/usuarios",    crearUsuario)

/* ================================
   CONFIGURACIÓN
================================ */

router.get  ("/config", getConfig)
router.patch("/config", updateConfig)

export default router
