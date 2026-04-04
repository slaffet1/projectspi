import { IsNumber } from 'class-validator';

export class AssignProductDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  quantity: number;
}
