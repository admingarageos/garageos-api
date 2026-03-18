/*
  Warnings:

  - You are about to drop the `ordenes_servicio` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrdenServicioDetalle" DROP CONSTRAINT "OrdenServicioDetalle_ordenId_fkey";

-- DropForeignKey
ALTER TABLE "ordenes_servicio" DROP CONSTRAINT "ordenes_servicio_tallerId_fkey";

-- DropForeignKey
ALTER TABLE "ordenes_servicio" DROP CONSTRAINT "ordenes_servicio_vehiculoId_fkey";

-- DropTable
DROP TABLE "ordenes_servicio";

-- CreateTable
CREATE TABLE "OrdenServicio" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT,
    "notasInternas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'pendiente',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kilometraje" INTEGER,
    "vehiculoId" INTEGER NOT NULL,
    "tallerId" INTEGER NOT NULL,

    CONSTRAINT "OrdenServicio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdenServicio_vehiculoId_idx" ON "OrdenServicio"("vehiculoId");

-- CreateIndex
CREATE INDEX "OrdenServicio_tallerId_idx" ON "OrdenServicio"("tallerId");

-- CreateIndex
CREATE INDEX "OrdenServicio_estado_idx" ON "OrdenServicio"("estado");

-- CreateIndex
CREATE INDEX "OrdenServicioDetalle_servicioId_idx" ON "OrdenServicioDetalle"("servicioId");

-- CreateIndex
CREATE INDEX "UserTaller_tallerId_idx" ON "UserTaller"("tallerId");

-- AddForeignKey
ALTER TABLE "OrdenServicio" ADD CONSTRAINT "OrdenServicio_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenServicio" ADD CONSTRAINT "OrdenServicio_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenServicioDetalle" ADD CONSTRAINT "OrdenServicioDetalle_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
