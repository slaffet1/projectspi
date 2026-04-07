-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "embedding" DOUBLE PRECISION[];

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "purchase_order_id" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "embedding" DOUBLE PRECISION[];

-- CreateTable
CREATE TABLE "purchase_orders_client" (
    "id" SERIAL NOT NULL,
    "order_number" VARCHAR(50) NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiration_date" DATE NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'draft',
    "client_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_client_details" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER,
    "product_id" INTEGER,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "purchase_order_client_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_client_order_number_key" ON "purchase_orders_client"("order_number");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders_client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_orders_client" ADD CONSTRAINT "purchase_orders_client_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_client_details" ADD CONSTRAINT "purchase_order_client_details_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "purchase_order_client_details" ADD CONSTRAINT "purchase_order_client_details_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders_client"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
