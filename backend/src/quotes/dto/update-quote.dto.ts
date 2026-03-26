import { PartialType } from '@nestjs/mapped-types';
import { CreateQuoteDto } from './create-quote.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {}

export class UpdateQuoteStatusDto {
  @IsString()
  status: string;
}