import { Router } from "express"
import { getResumen, getFinanzas } from "../controllers/dashboard.controller.js"

const router = Router()

router.get("/resumen", getResumen)
router.get("/finanzas", getFinanzas)

export default router