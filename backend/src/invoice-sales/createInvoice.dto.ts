export class CreateInvoiceDto {
  client_id: number;
  issue_date: string;
  due_date: string;
  total_amount: number;
  tax_amount?: number;
  quote_id: number;
}