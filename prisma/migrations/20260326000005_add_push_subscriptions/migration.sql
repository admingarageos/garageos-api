CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id"        SERIAL NOT NULL,
  "endpoint"  TEXT NOT NULL,
  "p256dh"    TEXT NOT NULL,
  "auth"      TEXT NOT NULL,
  "userId"    INTEGER NOT NULL,
  "tallerId"  INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_tallerId_fkey"
  FOREIGN KEY ("tallerId") REFERENCES "Taller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_tallerId_key"
  ON "PushSubscription"("endpoint", "tallerId");

CREATE INDEX IF NOT EXISTS "PushSubscription_tallerId_idx" ON "PushSubscription"("tallerId");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx"   ON "PushSubscription"("userId");
