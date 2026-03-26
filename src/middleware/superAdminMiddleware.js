export const requireSuperAdmin = (req, res, next) => {
  if (!req.user?.superAdmin) {
    return res.status(403).json({ error: "Acceso restringido a superAdmin" })
  }
  next()
}
