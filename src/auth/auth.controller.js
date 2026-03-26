import {
  login,
  register,
  getUserTalleres,
  getAllTalleres,
  getMe,
  crearTaller
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