import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateBankDto {
  @IsString()
  bank_name: string;

  @IsString()
  account_number: string;

  @IsString()
  @IsOptional()
  iban?: string;

  @IsNumber()
  @IsOptional()
  balance?: number;
}
