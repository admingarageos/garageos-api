/*
  Warnings:

  - The `estado` column on the `ordenes_servicio` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('pendiente', 'en_proceso', 'terminada', 'entregada');

-- AlterTable
ALTER TABLE "ordenes_servicio" DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoOrden" NOT NULL DEFAULT 'pendiente';
