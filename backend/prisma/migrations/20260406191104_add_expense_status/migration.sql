-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_business_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_facture_item_id_fkey";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "businessesId" INTEGER,
ADD COLUMN     "facture_itemsId" INTEGER,
ADD COLUMN     "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
ALTER COLUMN "payment_method" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_businessesId_fkey" FOREIGN KEY ("businessesId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_facture_itemsId_fkey" FOREIGN KEY ("facture_itemsId") REFERENCES "facture_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
