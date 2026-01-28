import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type ChecklistDocument = HydratedDocument<Checklist>;

@Schema({ timestamps: true })
export class Checklist extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: false, index: true })
  isCompleted: boolean;

  @Prop({ required: true })
  position: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  completedBy?: Types.ObjectId;

  @Prop()
  completedAt?: Date;
}

export const ChecklistSchema = SchemaFactory.createForClass(Checklist);

// Compound indexes
ChecklistSchema.index({ taskId: 1, position: 1 });
