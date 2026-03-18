/*
  Warnings:

  - The values [owner,recepcion] on the enum `RolTaller` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RolTaller_new" AS ENUM ('admin', 'mecanico');
ALTER TABLE "UserTaller" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "UserTaller" ALTER COLUMN "rol" TYPE "RolTaller_new" USING ("rol"::text::"RolTaller_new");
ALTER TYPE "RolTaller" RENAME TO "RolTaller_old";
ALTER TYPE "RolTaller_new" RENAME TO "RolTaller";
DROP TYPE "RolTaller_old";
ALTER TABLE "UserTaller" ALTER COLUMN "rol" SET DEFAULT 'mecanico';
COMMIT;
