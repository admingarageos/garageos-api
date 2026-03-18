import {
  login,
  register,
  getUserTalleres,
  getMe
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
      return res.status(400).json({
        error: "Email y password son requeridos"
      })
    }

    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: "Credenciales incorrectas"
      })
    }

    console.error(error)

    res.status(500).json({
      error: "Error en login"
    })
  }
}

/* =========================
   REGISTER
========================= */

export const registerUser = async (req, res) => {
  try {

    const data = await register(req.body)

    res.json(data)

  } catch (error) {

    if (error.message === "MISSING_FIELDS") {
      return res.status(400).json({
        error: "Todos los campos son requeridos"
      })
    }

    if (error.message === "EMAIL_EXISTS") {
      return res.status(400).json({
        error: "El correo ya está registrado"
      })
    }

    console.error(error)

    res.status(500).json({
      error: "Error creando cuenta"
    })
  }
}

/* =========================
   TALLERES
========================= */

export const getTalleres = async (req, res) => {
  try {

    const talleres = await getUserTalleres(req.user.id)

    res.json(talleres)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo talleres"
    })
  }
}

/* =========================
   ME
========================= */

export const me = async (req, res) => {
  try {

    const user = await getMe(req.user.id)

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado"
      })
    }

    res.json({ usuario: user })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      error: "Error obteniendo usuario"
    })
  }
}

import { crearTaller } from "./auth.service.js"

export const crearTallerController = async (req, res) => {
  try {

    const { nombre } = req.body

    const taller = await crearTaller(req.user.id, nombre)

    res.json(taller)

  } catch (error) {

    if (error.message === "MISSING_NAME") {
      return res.status(400).json({
        error: "Nombre requerido"
      })
    }

    console.error(error)

    res.status(500).json({
      error: "Error creando taller"
    })
  }
}