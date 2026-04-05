-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
