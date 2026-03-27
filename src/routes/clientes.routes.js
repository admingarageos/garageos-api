import { Router } from "express"
import {
  getClientes,
  getSeguimiento,
  getCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
} from "../controllers/clientes.controller.js"

const router = Router()

router.get("/",            getClientes)
router.get("/seguimiento", getSeguimiento)
router.get("/:id",         getCliente)
router.post("/",           crearCliente)
router.put("/:id",         actualizarCliente)
router.delete("/:id",      eliminarCliente)

export default router
