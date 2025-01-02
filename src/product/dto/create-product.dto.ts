import { IsString, IsNumber, IsArray, IsBoolean, ArrayMinSize, IsOptional } from 'class-validator';
import { Stripe } from 'stripe';
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

  @IsString()
  @IsOptional()
  interval: Stripe.Price.Recurring.Interval;

  @IsString()
  @IsOptional()
  productName: string;
}
