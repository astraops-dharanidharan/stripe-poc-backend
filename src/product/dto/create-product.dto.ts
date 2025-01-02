import { IsString, IsNumber, IsArray, IsBoolean, ArrayMinSize, IsOptional } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  features: string[];

  @IsBoolean()
  isCreditCardRequired: boolean;

  @IsString()
  @IsOptional()
  currency: string;
}
