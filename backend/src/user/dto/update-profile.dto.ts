import { IsOptional, IsNotEmpty, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  firstname?: string;

  @IsOptional()
  @IsNotEmpty()
  lastname?: string;

  @IsOptional()
  phoneNumber?: string;
}