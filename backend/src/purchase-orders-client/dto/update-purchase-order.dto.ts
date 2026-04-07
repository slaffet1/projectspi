export class UpdatePurchaseOrderDto {
  client_id?: number;
  issue_date?: string;
  expiration_date?: string;
  total_amount?: number;
  details?: { product_id: number; quantity: number }[];
}