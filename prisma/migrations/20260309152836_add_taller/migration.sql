-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "tallerId" INTEGER;

-- AlterTable
ALTER TABLE "Vehiculo" ADD COLUMN     "tallerId" INTEGER;

-- AlterTable
ALTER TABLE "ordenes_servicio" ADD COLUMN     "tallerId" INTEGER;

-- CreateTable
CREATE TABLE "Taller" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Taller_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehiculo" ADD CONSTRAINT "Vehiculo_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_servicio" ADD CONSTRAINT "ordenes_servicio_tallerId_fkey" FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
