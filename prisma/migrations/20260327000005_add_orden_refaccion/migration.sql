-- CreateTable
CREATE TABLE "OrdenRefaccion" (
  "id"          SERIAL NOT NULL,
  "ordenId"     INTEGER NOT NULL,
  "refaccionId" INTEGER NOT NULL,
  "cantidad"    INTEGER NOT NULL DEFAULT 1,
  "precio"      DOUBLE PRECISION NOT NULL,

  CONSTRAINT "OrdenRefaccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrdenRefaccion_ordenId_idx"     ON "OrdenRefaccion"("ordenId");
CREATE INDEX "OrdenRefaccion_refaccionId_idx" ON "OrdenRefaccion"("refaccionId");

-- AddForeignKey
ALTER TABLE "OrdenRefaccion"
  ADD CONSTRAINT "OrdenRefaccion_ordenId_fkey"
  FOREIGN KEY ("ordenId") REFERENCES "OrdenServicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrdenRefaccion"
  ADD CONSTRAINT "OrdenRefaccion_refaccionId_fkey"
  FOREIGN KEY ("refaccionId") REFERENCES "Refaccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
