-- AlterTable
ALTER TABLE "products" ADD COLUMN     "barcode" VARCHAR(100),
ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "cost_price" DECIMAL(15,2),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reference" VARCHAR(100),
ADD COLUMN     "unit" VARCHAR(50) DEFAULT 'pièce';
