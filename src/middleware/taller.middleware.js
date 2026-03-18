export const tallerMiddleware = (req, res, next) => {

  let tallerId = req.headers["x-taller-id"]

  /* ==========================
     FALLBACK PARA DESARROLLO
  ========================== */

  if (!tallerId) {

    // permite usar query ?tallerId=1 si no viene header
    tallerId = req.query.tallerId

  }

  if (!tallerId) {

    console.log("⚠️ Taller no especificado")

    return res.status(400).json({
      error: "Taller no especificado"
    })

  }

  req.tallerId = parseInt(tallerId)

  next()

}