/*
  Warnings:

  - The `rol` column on the `UserTaller` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RolTaller" AS ENUM ('owner', 'admin', 'mecanico', 'recepcion');

-- AlterTable
ALTER TABLE "UserTaller" DROP COLUMN "rol",
ADD COLUMN     "rol" "RolTaller" NOT NULL DEFAULT 'mecanico';
