-- Agregar fechaEntrega (opcional) a OrdenServicio
ALTER TABLE "OrdenServicio"
  ADD COLUMN IF NOT EXISTS "fechaEntrega" TIMESTAMP(3);
 