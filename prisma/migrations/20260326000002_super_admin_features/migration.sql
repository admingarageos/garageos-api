-- Agrega campo suspendido a Taller
ALTER TABLE "Taller" ADD COLUMN IF NOT EXISTS "suspendido" BOOLEAN NOT NULL DEFAULT FALSE;

-- Crea tabla de configuración de plataforma
CREATE TABLE IF NOT EXISTS "PlatformConfig" (
  "key"   TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("key")
);

-- Valor inicial: registro público habilitado
INSERT INTO "PlatformConfig" ("key", "value")
VALUES ('registroHabilitado', 'true')
ON CONFLICT ("key") DO NOTHING;
