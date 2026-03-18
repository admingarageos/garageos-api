/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `clienteId` on the `ordenes_servicio` table. All the data in the column will be lost.
  - Made the column `telefono` on table `Cliente` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `vehiculoId` to the `ordenes_servicio` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ordenes_servicio" DROP CONSTRAINT "ordenes_servicio_clienteId_fkey";

-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "createdAt",
ALTER COLUMN "telefono" SET NOT NULL;

-- AlterTable
ALTER TABLE "ordenes_servicio" DROP COLUMN "clienteId",
ADD COLUMN     "vehiculoId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" SERIAL NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "placas" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_servicio" ADD CONSTRAINT "ordenes_servicio_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
