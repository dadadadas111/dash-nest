import { Prop, Schema } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class BaseSchema {
  _id: Types.ObjectId;

  @Prop({ default: null, index: true })
  deletedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
