import { IsNotEmpty, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  label: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  expense_date: string;

  @IsOptional()
  payment_method?: string;

  @IsNumber()
  category_id: number;
}