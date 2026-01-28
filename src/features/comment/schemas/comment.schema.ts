import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', index: true })
  parentCommentId?: Types.ObjectId;

  @Prop({ default: false })
  isEdited: boolean;

  @Prop()
  editedAt?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  mentions: Types.ObjectId[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Compound indexes
CommentSchema.index({ taskId: 1, createdAt: 1 });
