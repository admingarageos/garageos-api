/*
  Warnings:

  - You are about to drop the column `precio` on the `ordenes_servicio` table. All the data in the column will be lost.
  - You are about to drop the `DetalleOrden` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `precio` on table `Servicio` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DetalleOrden" DROP CONSTRAINT "DetalleOrden_ordenId_fkey";

-- DropForeignKey
ALTER TABLE "DetalleOrden" DROP CONSTRAINT "DetalleOrden_servicioId_fkey";

-- AlterTable
ALTER TABLE "Servicio" ALTER COLUMN "precio" SET NOT NULL;

-- AlterTable
ALTER TABLE "ordenes_servicio" DROP COLUMN "precio";

-- DropTable
DROP TABLE "DetalleOrden";

-- CreateTable
CREATE TABLE "OrdenServicioDetalle" (
    "id" SERIAL NOT NULL,
    "ordenId" INTEGER NOT NULL,
    "servicioId" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrdenServicioDetalle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrdenServicioDetalle" ADD CONSTRAINT "OrdenServicioDetalle_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrdenServicioDetalle" ADD CONSTRAINT "OrdenServicioDetalle_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
