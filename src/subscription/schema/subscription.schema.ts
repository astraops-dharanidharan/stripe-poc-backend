import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SubscriptionDocument = Subscription & Document;

@Schema({ timestamps: true })
export class Subscription {

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  stripeCustomerId: string;
  
  @Prop({ required: true })
  stripeSubscriptionId: string;

  @Prop({ required: true })
  planId: string;

  @Prop({ required: true, enum: ['active', 'canceled', 'trialing'], default: 'active' })
  status: string;

}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
