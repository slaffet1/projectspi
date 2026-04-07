export class CreatePurchaseOrderDto {
  client_id: number;
  issue_date: string;
  expiration_date: string;
  total_amount: number;
  status?: string;
  details: { product_id: number; quantity: number }[];
}