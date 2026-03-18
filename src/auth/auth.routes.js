import { Router } from "express"
import {
  loginUser,
  registerUser,
  getTalleres,
  me,
  crearTallerController
} from "./auth.controller.js"

import { requireAuth } from "./auth.middleware.js"

const router = Router()

router.post("/login", loginUser)
router.post("/register", registerUser)

// 🔐 protegidas
router.get("/me", requireAuth, me)
router.get("/talleres", requireAuth, getTalleres)

// 🔥 ESTA TE FALTABA
router.post("/crear-taller", requireAuth, crearTallerController)

export default router