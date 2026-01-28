import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationType } from 'src/common/enums/notification.enum';

export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Notification info
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  // Related entities
  @Prop({ type: Types.ObjectId, ref: 'Task' })
  taskId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Board' })
  boardId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  commentId?: Types.ObjectId;

  // Actor
  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId?: Types.ObjectId;

  // Status
  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop()
  readAt?: Date;

  // Delivery
  @Prop([String])
  channels: string[];

  @Prop({ default: false })
  emailSent: boolean;

  // Timestamps
  @Prop({ default: Date.now, index: true })
  createdAt: Date;

  @Prop({ index: { expireAfterSeconds: 0 } })
  expiresAt?: Date;

  @Prop({ default: null })
  deletedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: 1 });
NotificationSchema.index({ userId: 1, createdAt: 1 });
