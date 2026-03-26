import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuoteDetailDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsNumber()
  @Min(0)
  tax_rate: number;
}

export class CreateQuoteDto {
  @IsNumber()
  client_id: number;

  @IsDateString()
  issue_date: string;

  @IsDateString()
  expiration_date: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteDetailDto)
  details: QuoteDetailDto[];
}