import { IsEmail, IsOptional, IsString, IsPhoneNumber } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    firstname?: string;

    @IsOptional()
    @IsString()
    lastname?: string;

    @IsOptional()
    @IsPhoneNumber() // or 'FR', 'US', depending on your locale
    phoneNumber?: string;

    @IsOptional()
    @IsEmail()
    email?: string; // only if you want to allow email updates
}