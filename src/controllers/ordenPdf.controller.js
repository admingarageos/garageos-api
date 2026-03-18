import prisma from "../lib/prisma.js"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import path from "path"

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

    // LOGO

    if (taller?.logo) {

      try {

        // Convierte /uploads/... → ruta física real
        const logoPath = path.join(
          process.cwd(),
          taller.logo.replace("/uploads/", "uploads/")
        )

        doc.image(logoPath, 40, 35, { width: 80 })

      } catch (error) {

        console.log("No se pudo cargar logo:", error.message)

      }

    }

    // DATOS TALLER

    doc.fontSize(18)
      .font("Helvetica-Bold")
      .text(taller?.nombre || "Taller", 140, 40)

    doc.fontSize(10)
      .font("Helvetica")
      .text(taller?.telefono || "", 140, 60)

    doc.text(taller?.direccion || "", 140, 75)

    // ORDEN

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
    doc.text(`Cliente: ${cliente?.nombre || "-"}`)
    doc.text(`Teléfono: ${cliente?.telefono || "-"}`)
    doc.text(`Vehículo: ${orden.vehiculo?.marca} ${orden.vehiculo?.modelo}`)
    doc.text(`Placas: ${orden.vehiculo?.placas}`)

    doc.moveDown(2)

    /* ==============================
       TABLA SERVICIOS
    ============================== */

    const tableTop = doc.y

    // HEADER GRIS
    doc.rect(40, tableTop - 5, 510, 20).fill("#f3f4f6")

    doc.fillColor("black")
    doc.font("Helvetica-Bold")

    doc.text("Servicio", 45, tableTop)
    doc.text("Cant", 300, tableTop, { width: 50, align: "right" })
    doc.text("Precio", 360, tableTop, { width: 90, align: "right" })
    doc.text("Subtotal", 460, tableTop, { width: 90, align: "right" })

    let y = tableTop + 25
    let total = 0

    doc.font("Helvetica")

    orden.detalles.forEach(item => {

      const subtotal = item.precio * item.cantidad
      total += subtotal

      doc.text(item.servicio?.nombre || "-", 40, y)

      doc.text(item.cantidad.toString(), 300, y, {
        width: 50,
        align: "right"
      })

      doc.text(`$${item.precio}`, 360, y, {
        width: 90,
        align: "right"
      })

      doc.text(`$${subtotal}`, 460, y, {
        width: 90,
        align: "right"
      })

      y += 20

    })

    /* ==============================
       TOTAL PRO
    ============================== */

    doc.rect(350, y + 10, 200, 35).fill("#111827")

    doc.fillColor("white")
    doc.fontSize(18)
    doc.font("Helvetica-Bold")

    doc.text(`TOTAL: $${total}`, 350, y + 18, {
      width: 200,
      align: "center"
    })

    doc.fillColor("black")

    /* ==============================
       QR
    ============================== */

    const qr = await QRCode.toDataURL(
      `Orden ${orden.id} - GarageOS`
    )

    doc.fontSize(9)
    doc.text("Escanea para referencia", 40, y)

    doc.image(qr, 40, y + 10, { width: 70 })

    /* ==============================
       FOOTER
    ============================== */

    doc.fontSize(10)
      .font("Helvetica")
      .text(
        "Gracias por su preferencia",
        40,
        750,
        { align: "center", width: 520 }
      )

    doc.text("Sistema GarageOS", {
      align: "center"
    })

    doc.end()

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error generando PDF"
    })

  }

}