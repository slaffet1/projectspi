import {
  IsInt,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDetailDto {
  @IsInt()
  @Min(1)
  product_id: number;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePurchaseOrderDto {
  @IsInt()
  client_id: number;

  @IsDateString()
  @IsNotEmpty()
  issue_date: string; // format : "YYYY-MM-DD"

  @IsDateString()
  @IsNotEmpty()
  expiration_date: string; // format : "YYYY-MM-DD"

  @IsNumber()
  @Min(0)
  total_amount: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDetailDto)
  details: OrderDetailDto[];
}