CREATE TABLE "Invitacion" (
  "id"        SERIAL NOT NULL,
  "token"     TEXT NOT NULL,
  "rol"       "RolTaller" NOT NULL DEFAULT 'mecanico',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usadaAt"   TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tallerId"  INTEGER NOT NULL,
  "creadoPor" INTEGER NOT NULL,
  CONSTRAINT "Invitacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitacion_token_key" ON "Invitacion"("token");
CREATE INDEX "Invitacion_tallerId_idx" ON "Invitacion"("tallerId");
CREATE INDEX "Invitacion_token_idx" ON "Invitacion"("token");

ALTER TABLE "Invitacion"
  ADD CONSTRAINT "Invitacion_tallerId_fkey"
  FOREIGN KEY ("tallerId") REFERENCES "Taller"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invitacion"
  ADD CONSTRAINT "Invitacion_creadoPor_fkey"
  FOREIGN KEY ("creadoPor") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
