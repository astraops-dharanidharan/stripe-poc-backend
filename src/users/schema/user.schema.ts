import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../../roles/roles.enum';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  _id: Types.ObjectId;
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: Role,
    default: Role.USER, // Set default value if needed
  })
  role: string;

  @Prop({ required: false, default: null })
  stripeCustomerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
