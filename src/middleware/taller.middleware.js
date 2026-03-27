export const tallerMiddleware = (req, res, next) => {

  const tallerId = req.headers["x-taller-id"]

  if (!tallerId) {

    console.log("⚠️ Taller no especificado")

    return res.status(400).json({
      error: "Taller no especificado"
    })

  }

  req.tallerId = parseInt(tallerId)

  next()

}