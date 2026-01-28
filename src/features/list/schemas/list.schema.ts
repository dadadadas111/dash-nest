import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type ListDocument = HydratedDocument<List>;

@Schema({ timestamps: true })
export class List extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
  boardId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  color?: string;

  // Ordering
  @Prop({ required: true })
  position: number;

  // Stats
  @Prop({ default: 0 })
  taskCount: number;
}

export const ListSchema = SchemaFactory.createForClass(List);

// Compound indexes
ListSchema.index({ boardId: 1, position: 1 });
ListSchema.index({ boardId: 1, deletedAt: 1 });
