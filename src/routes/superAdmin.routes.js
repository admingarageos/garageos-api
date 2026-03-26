import { Router } from "express"
import {
  getTalleres,
  suspenderTaller,
  eliminarTaller,
  getUsuariosTaller,
  asignarUsuarioATaller,
  quitarUsuarioDeTaller,
  extenderLicencia,
  getLicencias,
  getUsuarios,
  eliminarUsuario,
  crearUsuario,
  getTalleresUsuario,
  buscarUsuario,
  getConfig,
  updateConfig
} from "../controllers/superAdmin.controller.js"

const router = Router()

/* ================================
   TALLERES
================================ */

router.get   ("/talleres",                             getTalleres)
router.patch ("/talleres/:id/suspender",               suspenderTaller)
router.delete("/talleres/:id",                         eliminarTaller)
router.get   ("/talleres/:id/usuarios",                getUsuariosTaller)
router.post  ("/talleres/:id/usuarios",                asignarUsuarioATaller)
router.delete("/talleres/:id/usuarios/:userId",        quitarUsuarioDeTaller)
router.patch ("/talleres/:id/licencia",                extenderLicencia)

/* ================================
   LICENCIAS
================================ */

router.get("/licencias", getLicencias)

/* ================================
   USUARIOS
================================ */

router.get   ("/usuarios",         getUsuarios)
router.get   ("/usuarios/buscar",  buscarUsuario)
router.get   ("/usuarios/:id/talleres", getTalleresUsuario)
router.delete("/usuarios/:id",     eliminarUsuario)
router.post  ("/usuarios",         crearUsuario)

/* ================================
   CONFIGURACIÓN
================================ */

router.get  ("/config", getConfig)
router.patch("/config", updateConfig)

export default router
