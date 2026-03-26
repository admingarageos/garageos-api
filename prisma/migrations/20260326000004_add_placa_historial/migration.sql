CREATE TABLE IF NOT EXISTS "PlacaHistorial" (
  "id"          SERIAL NOT NULL,
  "placa"       TEXT NOT NULL,
  "fechaCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "vehiculoId"  INTEGER NOT NULL,
  CONSTRAINT "PlacaHistorial_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlacaHistorial"
  ADD CONSTRAINT "PlacaHistorial_vehiculoId_fkey"
  FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "PlacaHistorial_vehiculoId_idx" ON "PlacaHistorial"("vehiculoId");
