CREATE TABLE IF NOT EXISTS "OrdenComentario" (
  "id"        SERIAL NOT NULL,
  "texto"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ordenId"   INTEGER NOT NULL,
  "userId"    INTEGER NOT NULL,
  CONSTRAINT "OrdenComentario_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OrdenComentario"
  ADD CONSTRAINT "OrdenComentario_ordenId_fkey"
  FOREIGN KEY ("ordenId") REFERENCES "OrdenServicio"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrdenComentario"
  ADD CONSTRAINT "OrdenComentario_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "OrdenComentario_ordenId_idx" ON "OrdenComentario"("ordenId");
