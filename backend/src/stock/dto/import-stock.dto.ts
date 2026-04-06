export class ImportStockDto {
  // Pas de champs ici, on reçoit juste le fichier via Multer
  // La validation se fait ligne par ligne dans le service
}

export interface ImportReportDto {
  import_id: string;
  business_id: number;
  user_id?: number;
  file_name: string;
  imported_at: string;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  status: 'success' | 'partial' | 'failed';
  errors: Array<{
    row: number;
    product?: string;
    warehouse?: string;
    error: string;
  }>;
  summary: {
    products_created: number;
    products_updated: number;
    stock_added: number;
  };
}