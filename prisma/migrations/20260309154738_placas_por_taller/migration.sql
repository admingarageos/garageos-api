/*
  Warnings:

  - A unique constraint covering the columns `[placas,tallerId]` on the table `Vehiculo` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Vehiculo_placas_key";

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_placas_tallerId_key" ON "Vehiculo"("placas", "tallerId");
