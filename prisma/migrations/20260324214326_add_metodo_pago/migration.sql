-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('efectivo', 'tarjeta', 'transferencia');

-- AlterTable
ALTER TABLE "OrdenServicio" ADD COLUMN     "metodoPago" "MetodoPago";

-- CreateIndex
CREATE INDEX "OrdenServicio_metodoPago_idx" ON "OrdenServicio"("metodoPago");
