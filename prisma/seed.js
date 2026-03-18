import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

async function main() {

  console.log("🌱 Seeding GarageOS...")

  /* LIMPIAR BASE */

  await prisma.ordenServicioDetalle.deleteMany()
  await prisma.ordenServicio.deleteMany()
  await prisma.vehiculo.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.servicio.deleteMany()
  await prisma.userTaller.deleteMany()
  await prisma.user.deleteMany()
  await prisma.taller.deleteMany()

  const passwordHash = await bcrypt.hash("123456", 10)

  /* =========================
     USUARIOS
  ========================= */

  const admin = await prisma.user.create({
    data: {
      nombre: "Admin Demo",
      email: "admin@garageos.com",
      passwordHash
    }
  })

  const mecanico = await prisma.user.create({
    data: {
      nombre: "Mecanico Demo",
      email: "mecanico@garageos.com",
      passwordHash
    }
  })

  /* =========================
     TALLERES
  ========================= */

  const tallerCentro = await prisma.taller.create({
    data: {
      nombre: "Garage Centro"
    }
  })

  const tallerNorte = await prisma.taller.create({
    data: {
      nombre: "Garage Norte"
    }
  })

  await prisma.userTaller.createMany({
    data: [
      { userId: admin.id,    tallerId: tallerCentro.id, rol: "admin"    },
      { userId: mecanico.id, tallerId: tallerNorte.id,  rol: "mecanico" }
    ]
  })

  /* =========================
     SERVICIOS
  ========================= */

  const serviciosData = [
    { nombre: "Cambio de aceite", precio: 850 },
    { nombre: "Afinación menor", precio: 1200 },
    { nombre: "Afinación mayor", precio: 2500 },
    { nombre: "Diagnóstico scanner", precio: 500 },
    { nombre: "Cambio filtro aire", precio: 300 },
    { nombre: "Cambio filtro gasolina", precio: 350 },
    { nombre: "Alineación", precio: 500 },
    { nombre: "Balanceo", precio: 450 },
    { nombre: "Cambio pastillas freno", precio: 900 },
    { nombre: "Cambio batería", precio: 1800 }
  ]

  await prisma.servicio.createMany({ data: serviciosData })

  const servicios = await prisma.servicio.findMany()

  /* =========================
     CLIENTES + VEHICULOS
  ========================= */

  const nombres = [
    "Juan Perez",
    "Carlos Ramirez",
    "Luis Mendoza",
    "Pedro Torres",
    "Jorge Salinas",
    "Ana Lopez",
    "Maria Garcia",
    "Laura Hernandez",
    "Ricardo Diaz",
    "Sergio Vargas"
  ]

  const marcas = ["Nissan", "Toyota", "Honda", "Mazda", "Ford"]
  const modelos = ["Versa", "Corolla", "Civic", "Mazda3", "Focus"]

  const vehiculos = []

  for (let i = 0; i < 10; i++) {

    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombres[i],
        telefono: `33100000${i}`,
        tallerId: tallerCentro.id
      }
    })

    const cantidadVehiculos = Math.random() > 0.7 ? 2 : 1

    for (let j = 0; j < cantidadVehiculos; j++) {

      const vehiculo = await prisma.vehiculo.create({
        data: {
          marca: random(marcas),
          modelo: random(modelos),
          anio: 2015 + Math.floor(Math.random() * 8),
          placas: `ABC${100 + i}${j}`,
          clienteId: cliente.id,
          tallerId: tallerCentro.id
        }
      })

      vehiculos.push(vehiculo)

    }

  }

  /* =========================
     ORDENES
  ========================= */

  const estados = [
    "pendiente",
    "en_proceso",
    "terminada",
    "entregada"
  ]

  for (let i = 0; i < 15; i++) {

    const vehiculo = random(vehiculos)

    const fecha = new Date()
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 15))

    const orden = await prisma.ordenServicio.create({
      data: {
        descripcion: "Revisión general del vehículo",
        vehiculoId: vehiculo.id,
        tallerId: tallerCentro.id,
        estado: random(estados),
        fecha
      }
    })

    const serviciosOrden = 2 + Math.floor(Math.random() * 3)

    let total = 0

    for (let j = 0; j < serviciosOrden; j++) {

      const servicio = random(servicios)

      const detalle = await prisma.ordenServicioDetalle.create({
        data: {
          ordenId: orden.id,
          servicioId: servicio.id,
          cantidad: 1,
          precio: servicio.precio
        }
      })

      total += detalle.precio

    }

    await prisma.ordenServicio.update({
      where: { id: orden.id },
      data: { total }
    })

  }

  console.log("✅ Seed completado con datos realistas")

}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())