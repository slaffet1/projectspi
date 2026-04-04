-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "delivery_notes" ADD COLUMN     "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING';
