const bcrypt = require("bcrypt")
const db = require("../db")

async function crearUsuario(data) {
  const { nombre, email, password } = data

  const hashedPassword = await bcrypt.hash(password, 10)

  const [result] = await db.query(
    "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)",
    [nombre, email, hashedPassword]
  )

  return {
    id: result.insertId,
    nombre,
    email
  }
}

async function getUsuarios() {
  const [rows] = await db.query(
    "SELECT id, nombre, email FROM usuarios ORDER BY id DESC"
  )

  return rows
}

module.exports = {
  crearUsuario,
  getUsuarios
}