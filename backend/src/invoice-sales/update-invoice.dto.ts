import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceDto } from './createInvoice.dto';

export class UpdateInvoiceDto {
  @IsOptional()
  @IsNumber()
  client_id?: number;

  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceDto)
  details?: CreateInvoiceDto[];
}