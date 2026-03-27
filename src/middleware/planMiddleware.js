import prisma from "../lib/prisma.js"

/**
 * Middleware que restringe el acceso según el plan del taller.
 * Uso: requirePlan("estandar", "pro", "manual")
 */
export const requirePlan = (...planes) => async (req, res, next) => {
  try {
    const taller = await prisma.taller.findUnique({
      where:  { id: req.tallerId },
      select: { planTipo: true }
    })

    const plan = taller?.planTipo || "trial"

    if (!planes.includes(plan)) {
      return res.status(403).json({
        error: "Tu plan actual no incluye esta funcionalidad. Actualiza tu plan para acceder.",
        planActual: plan,
        planesRequeridos: planes
      })
    }

    next()
  } catch (error) {
    console.error("[requirePlan]", error)
    res.status(500).json({ error: "Error verificando plan" })
  }
}
