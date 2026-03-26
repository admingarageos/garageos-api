import { Router } from "express"
import prisma from "../lib/prisma.js"
import { sendPush } from "../services/push.service.js"

const router = Router()

/* =================================
   GUARDAR SUSCRIPCIÓN
   El cliente envía el objeto PushSubscription
   del navegador { endpoint, keys: { p256dh, auth } }
================================= */

router.post("/subscribe", async (req, res) => {

  const { endpoint, keys } = req.body

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Suscripción inválida" })
  }

  try {

    await prisma.pushSubscription.upsert({
      where: {
        endpoint_tallerId: { endpoint, tallerId: req.tallerId }
      },
      update: {
        p256dh: keys.p256dh,
        auth:   keys.auth,
        userId: req.user.id
      },
      create: {
        endpoint,
        p256dh:   keys.p256dh,
        auth:     keys.auth,
        userId:   req.user.id,
        tallerId: req.tallerId
      }
    })

    res.json({ ok: true })

  } catch (err) {
    console.error("[POST /push/subscribe]", err)
    res.status(500).json({ error: "Error guardando suscripción" })
  }

})

/* =================================
   NOTIFICAR CITAS DE HOY
   El dashboard llama este endpoint una vez
   al día por taller. Manda push a todos los
   suscritos del taller con el resumen del día.
================================= */

router.post("/notificar-citas-hoy", async (req, res) => {

  try {

    const hoy   = new Date()
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const fin    = new Date(inicio)
    fin.setDate(fin.getDate() + 1)

    const citas = await prisma.cita.findMany({
      where: {
        tallerId: req.tallerId,
        fecha:    { gte: inicio, lt: fin },
        estado:   { in: ["pendiente", "confirmada"] }
      },
      include:  { cliente: true, vehiculo: true },
      orderBy:  { fecha: "asc" }
    })

    if (citas.length === 0) {
      return res.json({ enviadas: 0 })
    }

    const hora = (fecha) =>
      new Date(fecha).toLocaleTimeString("es-MX", {
        hour:   "2-digit",
        minute: "2-digit"
      })

    const body = citas.length === 1
      ? `${hora(citas[0].fecha)} — ${citas[0].cliente?.nombre || "Cliente"} · ${citas[0].vehiculo?.placas || ""}`
      : `${citas.length} citas programadas para hoy`

    await sendPush(req.tallerId, {
      title: "Citas de hoy",
      body,
      url:   "/citas"
    })

    res.json({ enviadas: citas.length })

  } catch (err) {
    console.error("[POST /push/notificar-citas-hoy]", err)
    res.status(500).json({ error: "Error enviando notificaciones" })
  }

})

export default router
