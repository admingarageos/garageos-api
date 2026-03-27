import { Router } from "express"
import { validarInvitacion, aceptarInvitacion } from "../controllers/invitaciones.controller.js"

const router = Router()

// Pública — el mecánico valida el token antes de registrarse
router.get("/validar/:token",  validarInvitacion)

// Pública — el mecánico completa su registro
router.post("/aceptar/:token", aceptarInvitacion)

export default router
