import Stripe from "stripe"
import prisma from "../lib/prisma.js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_IDS = {
  basico_mensual:   "price_1TFNqECALNB3M7LvRb8cWl3f",
  basico_anual:     "price_1TFNqeCALNB3M7LvXs49GNIS",
  estandar_mensual: "price_1TFNr7CALNB3M7Lvg3z6whN9",
  estandar_anual:   "price_1TFNrRCALNB3M7Lvyd1Ox869",
  pro_mensual:      "price_1TFNrzCALNB3M7LvDloS55PX",
  pro_anual:        "price_1TFNsDCALNB3M7LvgfYJajyO",
}

const PLAN_POR_PRICE = Object.fromEntries(
  Object.entries(PRICE_IDS).map(([key, priceId]) => [priceId, key.split("_")[0]])
)

/* ================================================
   POST /api/stripe/checkout
   Crea una Checkout Session y devuelve la URL
================================================ */
export async function createCheckoutSession(req, res) {
  const { plan, periodo } = req.body
  const tallerId = req.tallerId

  const key = `${plan}_${periodo}`
  const priceId = PRICE_IDS[key]
  if (!priceId) return res.status(400).json({ error: "Plan o periodo inválido" })

  const taller = await prisma.taller.findUnique({ where: { id: tallerId } })
  if (!taller) return res.status(404).json({ error: "Taller no encontrado" })

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173"

  const sessionParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { tallerId: String(tallerId), plan, periodo },
    success_url: `${frontendUrl}/configuracion?checkout=success`,
    cancel_url:  `${frontendUrl}/configuracion?checkout=cancel`,
  }

  if (taller.stripeCustomerId) {
    sessionParams.customer = taller.stripeCustomerId
  } else {
    sessionParams.customer_email = req.user.email
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  res.json({ url: session.url })
}

/* ================================================
   POST /api/stripe/webhook
   Procesa eventos de Stripe (raw body)
================================================ */
export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"]

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook inválido: ${err.message}` })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const { tallerId, plan, periodo } = session.metadata

    const dias = periodo === "anual" ? 365 : 30
    const licenciaVence = new Date()
    licenciaVence.setDate(licenciaVence.getDate() + dias)

    await prisma.taller.update({
      where: { id: parseInt(tallerId) },
      data: {
        stripeCustomerId:     session.customer,
        stripeSubscriptionId: session.subscription,
        planTipo:             plan,
        licenciaVence,
        suspendido:           false,
      },
    })
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object
    const priceId = subscription.items?.data?.[0]?.price?.id
    const plan    = PLAN_POR_PRICE[priceId]

    if (plan) {
      const taller = await prisma.taller.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      })
      if (taller) {
        const licenciaVence = new Date(subscription.current_period_end * 1000)
        await prisma.taller.update({
          where: { id: taller.id },
          data:  { planTipo: plan, licenciaVence, suspendido: false },
        })
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object
    const taller = await prisma.taller.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    })
    if (taller) {
      await prisma.taller.update({
        where: { id: taller.id },
        data: { planTipo: "trial", licenciaVence: new Date() },
      })
    }
  }

  res.json({ received: true })
}
