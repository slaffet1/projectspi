import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  UPDATE = 'UPDATE',
}

export class StockMovementDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  quantity: number;

  @IsEnum(MovementType)
  type: MovementType;

  @IsString()
  @IsOptional()
  note?: string;
}
