-- CreateTable
CREATE TABLE "Gasto" (
  "id"        SERIAL NOT NULL,
  "concepto"  TEXT NOT NULL,
  "monto"     DOUBLE PRECISION NOT NULL,
  "categoria" TEXT NOT NULL DEFAULT 'general',
  "fecha"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nota"      TEXT,
  "tallerId"  INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gasto_tallerId_idx" ON "Gasto"("tallerId");
CREATE INDEX "Gasto_fecha_idx"    ON "Gasto"("fecha");

-- AddForeignKey
ALTER TABLE "Gasto"
  ADD CONSTRAINT "Gasto_tallerId_fkey"
  FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
