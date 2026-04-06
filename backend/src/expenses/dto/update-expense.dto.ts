import { IsOptional, IsNumber, IsDateString } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  label?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsDateString()
  expense_date?: string;

  @IsOptional()
  payment_method?: string;

  @IsOptional()
  @IsNumber()
  category_id?: number;

  status?: string;
}