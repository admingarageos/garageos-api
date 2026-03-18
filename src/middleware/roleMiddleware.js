/* =========================
   ROLE MIDDLEWARE
   Uso: requireRol("admin")
========================= */

export const requireRol = (...roles) => {
  return (req, res, next) => {

    const rol = req.taller?.rol

    if (!rol) {
      return res.status(403).json({
        error: "No tienes un rol asignado en este taller"
      })
    }

    if (!roles.includes(rol)) {
      return res.status(403).json({
        error: "No tienes permisos para realizar esta acción"
      })
    }

    next()
  }
}