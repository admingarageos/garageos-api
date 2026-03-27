import { Router } from "express"
import { createCheckoutSession, createPortalSession } from "../controllers/stripe.controller.js"

const router = Router()

router.post("/checkout", createCheckoutSession)
router.post("/portal",   createPortalSession)

export default router
