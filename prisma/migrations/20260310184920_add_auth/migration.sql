/*
  Warnings:

  - Made the column `updatedAt` on table `Cliente` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tallerId` on table `Cliente` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tallerId` on table `Vehiculo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tallerId` on table `ordenes_servicio` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "EstadoOrden" ADD VALUE 'cancelada';

-- DropForeignKey
ALTER TABLE "Cliente" DROP CONSTRAINT "Cliente_tallerId_fkey";

-- DropForeignKey
ALTER TABLE "Vehiculo" DROP CONSTRAINT "Vehiculo_tallerId_fkey";

-- DropForeignKey
ALTER TABLE "ordenes_servicio" DROP CONSTRAINT "ordenes_servicio_tallerId_fkey";

-- DropIndex
DROP INDEX "Vehiculo_placas_idx";

-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "tallerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Taller" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "direccion" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Vehiculo" ALTER COLUMN "tallerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ordenes_servicio" ALTER COLUMN "descripcion" DROP NOT NULL,
ALTER COLUMN "tallerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTaller" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tallerId" INTEGER NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'owner',

    CONSTRAINT "UserTaller_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserTaller_userId_tallerId_key" ON "UserTaller"("userId", "tallerId");

-- CreateIndex
CREATE INDEX "Cliente_tallerId_idx" ON "Cliente"("tallerId");

-- CreateIndex
CREATE INDEX "OrdenServicioDetalle_ordenId_idx" ON "OrdenServicioDetalle"("ordenId");

-- CreateIndex
CREATE INDEX "Vehiculo_clienteId_idx" ON "Vehiculo"("clienteId");

-- CreateIndex
CREATE INDEX "ordenes_servicio_vehiculoId_idx" ON "ordenes_servicio"("vehiculoId");

-- CreateIndex
CREATE INDEX "ordenes_servicio_tallerId_idx" ON "ordenes_servicio"("tallerId");

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_servicio" ADD CONSTRAINT "ordenes_servicio_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTaller" ADD CONSTRAINT "UserTaller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTaller" ADD CONSTRAINT "UserTaller_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
