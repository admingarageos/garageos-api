import {
  login,
  register,
  getUserTalleres,
  getAllTalleres,
  getMe,
  crearTaller,
  forgotPassword,
  resetPassword
} from "./auth.service.js"

/* =========================
   LOGIN
========================= */

export const loginUser = async (req, res) => {
  try {

    const { email, password } = req.body

    const data = await login(email, password)

    res.json(data)

  } catch (error) {

    if (error.message === "MISSING_CREDENTIALS") {
      return res.status(400).json({ error: "Email y password son requeridos" })
    }

    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Credenciales incorrectas" })
    }

    console.error("[loginUser]", error)
    res.status(500).json({ error: "Error en login" })
  }
}

/* =========================
   REGISTER
========================= */

export const registerUser = async (req, res) => {
  try {

    const data = await register(req.body)

    res.status(201).json(data)

  } catch (error) {

    if (error.message === "MISSING_FIELDS") {
      return res.status(400).json({ error: "Todos los campos son requeridos" })
    }

    if (error.message === "PASSWORD_TOO_SHORT") {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" })
    }

    if (error.message === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "El correo ya está registrado" })
    }

    if (error.message === "REGISTRO_DESHABILITADO") {
      return res.status(403).json({ error: "El registro de nuevas cuentas está deshabilitado" })
    }

    console.error("[registerUser]", error)
    res.status(500).json({ error: "Error creando cuenta" })
  }
}

/* =========================
   TALLERES
========================= */

export const getTalleres = async (req, res) => {
  try {

    const talleres = req.user.superAdmin
      ? await getAllTalleres()
      : await getUserTalleres(req.user.id)

    res.json(talleres)

  } catch (error) {

    console.error("[getTalleres]", error)
    res.status(500).json({ error: "Error obteniendo talleres" })
  }
}

/* =========================
   ME
========================= */

export const me = async (req, res) => {
  try {

    const user = await getMe(req.user.id)

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    res.json({ usuario: user })

  } catch (error) {

    console.error("[me]", error)
    res.status(500).json({ error: "Error obteniendo usuario" })
  }
}

/* =========================
   FORGOT PASSWORD
========================= */

export const forgotPasswordController = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim()
    await forgotPassword(email)
    // Siempre 200 para no revelar si el email existe
    res.json({ mensaje: "Si el correo existe, recibirás un enlace para restablecer tu contraseña." })
  } catch (error) {
    if (error.message === "MISSING_EMAIL") {
      return res.status(400).json({ error: "Email requerido" })
    }
    console.error("[forgotPasswordController]", error)
    res.status(500).json({ error: "Error procesando solicitud" })
  }
}

/* =========================
   RESET PASSWORD
========================= */

export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body
    await resetPassword(token, password)
    res.json({ mensaje: "Contraseña actualizada correctamente" })
  } catch (error) {
    if (error.message === "MISSING_FIELDS") {
      return res.status(400).json({ error: "Token y contraseña son requeridos" })
    }
    if (error.message === "PASSWORD_TOO_SHORT") {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" })
    }
    if (error.message === "INVALID_OR_EXPIRED_TOKEN") {
      return res.status(400).json({ error: "El enlace es inválido o ya expiró" })
    }
    console.error("[resetPasswordController]", error)
    res.status(500).json({ error: "Error actualizando contraseña" })
  }
}

/* =========================
   CREAR TALLER
========================= */

export const crearTallerController = async (req, res) => {
  try {

    const { nombre } = req.body

    const taller = await crearTaller(req.user.id, nombre)

    res.status(201).json(taller)

  } catch (error) {

    if (error.message === "MISSING_NAME") {
      return res.status(400).json({ error: "Nombre requerido" })
    }

    console.error("[crearTallerController]", error)
    res.status(500).json({ error: "Error creando taller" })
  }
}