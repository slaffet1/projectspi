import {
    IsString,
    IsOptional,
    IsInt,
    IsDateString,
    IsArray,
    ValidateNested,
    IsNumber,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreditNoteItemDto {
  @IsInt()
  product_id!: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  unit_price!: number;
}

export class CreateCreditNoteDto {
  @IsDateString()
  return_date!: string;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsInt()
  invoice_id?: number;

  @IsOptional()
  @IsInt()
  delivery_note_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreditNoteItemDto)
  items?: CreditNoteItemDto[];
}