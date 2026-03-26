import webpush from "web-push"
import prisma from "../lib/prisma.js"

/* =================================
   CONFIGURAR VAPID
   VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY
   deben estar en Railway env vars.
================================= */

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:admin@garageos.app",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

/* =================================
   ENVIAR PUSH A UN TALLER
   excludeUserId: no notificar al usuario
   que disparó la acción (ej. el que comentó)
================================= */

export const sendPush = async (tallerId, payload, excludeUserId = null) => {

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return

  try {

    const subs = await prisma.pushSubscription.findMany({
      where: {
        tallerId,
        ...(excludeUserId !== null && { userId: { not: excludeUserId } })
      }
    })

    if (subs.length === 0) return

    const body = JSON.stringify(payload)

    const promises = subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        body
      ).catch(async (err) => {
        // 410 Gone / 404 = suscripción expirada, eliminarla
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      })
    )

    await Promise.allSettled(promises)

  } catch (err) {
    console.error("[sendPush]", err)
  }

}
