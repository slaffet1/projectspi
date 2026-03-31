import { IsString, IsInt, IsDateString } from 'class-validator';

export class CreateDeliveryNoteDto {
    @IsString()
    delivery_number: string;

    @IsDateString()
    delivery_date: string;

    @IsInt()
    quote_id: number;
}