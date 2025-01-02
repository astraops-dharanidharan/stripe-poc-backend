import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema()
export class Product extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  features: string[];

  @Prop({ required: true })
  isCreditCardRequired: boolean;

  @Prop({ required: false, default: null })
  stripeProductId: string;

  @Prop({ required: false, default: null })
  stripePriceId: string;

  @Prop({ required: false, default: 'usd' })
  currency: string;

}

export const ProductSchema = SchemaFactory.createForClass(Product);

