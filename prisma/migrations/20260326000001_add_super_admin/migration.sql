-- Agrega campo superAdmin a User para acceso de plataforma a todos los talleres
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "superAdmin" BOOLEAN NOT NULL DEFAULT FALSE;
