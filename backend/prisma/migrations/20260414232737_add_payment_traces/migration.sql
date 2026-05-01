-- CreateTable
CREATE TABLE "payment_traces" (
    "id" SERIAL NOT NULL,
    "invoice_id" INTEGER NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "payment_date" TIMESTAMP(6) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "reference" VARCHAR(255),
    "cheque_number" VARCHAR(100),
    "bank_name" VARCHAR(255),
    "notes" TEXT,
    "proof_image_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_traces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_traces_invoice_id_key" ON "payment_traces"("invoice_id");

-- AddForeignKey
ALTER TABLE "payment_traces" ADD CONSTRAINT "payment_traces_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
