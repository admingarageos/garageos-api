import prisma from "../lib/prisma.js"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import path from "path"

const ETIQUETA_METODO = {
  efectivo:      "Efectivo",
  tarjeta:       "Tarjeta de crédito/débito",
  transferencia: "Transferencia / SPEI",
}

/* =================================
   PDF ORDEN
================================= */

export const generarPDFOrden = async (req, res) => {

  try {

    const id = parseInt(req.params.id)

    const orden = await prisma.ordenServicio.findFirst({

      where: {
        id,
        tallerId: req.tallerId
      },

      include: {
        vehiculo: {
          include: {
            cliente: true
          }
        },
        detalles: {
          include: {
            servicio: true
          }
        },
        taller: true
      }

    })

    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" })
    }

    const doc = new PDFDocument({
      margin: 40,
      size: "A4"
    })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Disposition",
      `inline; filename=orden-${orden.id}.pdf`
    )

    doc.pipe(res)

    const taller = orden.taller

    /* ==============================
       HEADER
    ============================== */

    if (taller?.logo) {
      try {
        const logoPath = path.join(
          process.cwd(),
          taller.logo.replace("/uploads/", "uploads/")
        )
        doc.image(logoPath, 40, 35, { width: 80 })
      } catch (error) {
        console.log("No se pudo cargar logo:", error.message)
      }
    }

    doc.fontSize(18)
      .font("Helvetica-Bold")
      .text(taller?.nombre || "Taller", 140, 40)

    doc.fontSize(10)
      .font("Helvetica")
      .text(taller?.telefono || "", 140, 60)

    doc.text(taller?.direccion || "", 140, 75)

    doc.fontSize(18)
      .font("Helvetica-Bold")
      .text("ORDEN DE SERVICIO", 350, 40)

    doc.fontSize(12)
      .font("Helvetica")
      .text(`Orden #${orden.id}`, 350, 65)

    doc.moveDown(2)

    doc.moveTo(40, doc.y)
      .lineTo(550, doc.y)
      .stroke()

    doc.moveDown()

    /* ==============================
       CLIENTE
    ============================== */

    const cliente = orden.vehiculo?.cliente

    doc.font("Helvetica-Bold")
      .text("Datos del Cliente", { underline: true })

    doc.moveDown(0.5)

    doc.font("Helvetica")
    doc.text(`Cliente:  ${cliente?.nombre || "-"}`)
    doc.text(`Teléfono: ${cliente?.telefono || "-"}`)
    doc.text(`Vehículo: ${orden.vehiculo?.marca} ${orden.vehiculo?.modelo}`)
    doc.text(`Placas:   ${orden.vehiculo?.placas}`)

    doc.moveDown(2)

    /* ==============================
       TABLA SERVICIOS
    ============================== */

    const tableTop = doc.y

    doc.rect(40, tableTop - 5, 510, 20).fill("#f3f4f6")

    doc.fillColor("black")
    doc.font("Helvetica-Bold")

    doc.text("Servicio", 45, tableTop)
    doc.text("Cant",     300, tableTop, { width: 50,  align: "right" })
    doc.text("Precio",   360, tableTop, { width: 90,  align: "right" })
    doc.text("Subtotal", 460, tableTop, { width: 90,  align: "right" })

    let y = tableTop + 25
    let total = 0

    doc.font("Helvetica")

    orden.detalles.forEach(item => {

      const subtotal = item.precio * item.cantidad
      total += subtotal

      const nombre     = item.servicio?.nombre || "-"
      const rowHeight  = Math.max(20, doc.heightOfString(nombre, { width: 245 }))

      doc.text(nombre,                       45,  y, { width: 245 })
      doc.text(item.cantidad.toString(),     300, y, { width: 50,  align: "right" })
      doc.text(`$${item.precio.toFixed(2)}`, 360, y, { width: 90,  align: "right" })
      doc.text(`$${subtotal.toFixed(2)}`,    460, y, { width: 90,  align: "right" })

      y += rowHeight + 5

    })

    /* ==============================
       BLOQUE TOTAL + MÉTODO DE PAGO
    ============================== */

    y += 10

    // Caja negra con el total
    doc.rect(350, y, 200, 35).fill("#111827")

    doc.fillColor("white")
    doc.fontSize(18)
    doc.font("Helvetica-Bold")
    doc.text(`TOTAL: $${total.toFixed(2)}`, 350, y + 8, {
      width: 200,
      align: "center"
    })

    doc.fillColor("black")

    y += 45

    // Método de pago — debajo del total, alineado a la derecha
    if (orden.metodoPago) {

      const etiqueta = ETIQUETA_METODO[orden.metodoPago] || orden.metodoPago

      // Caja gris suave
      doc.rect(350, y, 200, 22).fill("#f3f4f6")

      doc.fillColor("#374151")
      doc.fontSize(10)
      doc.font("Helvetica-Bold")
      doc.text(`Forma de pago: ${etiqueta}`, 350, y + 6, {
        width: 200,
        align: "center"
      })

      doc.fillColor("black")

      y += 30

    } else {

      // Si no se registró pago, mostrar línea de firma
      doc.fontSize(9)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text("Forma de pago: _______________________", 350, y + 6, {
          width: 200,
          align: "center"
        })

      doc.fillColor("black")

      y += 30

    }

    /* ==============================
       QR
    ============================== */

    const qr = await QRCode.toDataURL(`Orden ${orden.id} - GarageOS`)

    doc.fontSize(9)
      .font("Helvetica")
      .text("Escanea para referencia", 40, y - 30)

    doc.image(qr, 40, y - 20, { width: 70 })

    /* ==============================
       FOOTER
    ============================== */

    doc.fontSize(10)
      .font("Helvetica")
      .text(
        "Gracias por su preferencia",
        40, 750,
        { align: "center", width: 520 }
      )

    doc.text("Sistema GarageOS", { align: "center" })

    doc.end()

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error generando PDF"
    })

  }

}
