import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityType } from '@common/enums/entity.enum';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

export class ChangeLog {
  @Prop({ required: true })
  field: string;

  @Prop({ type: Object })
  oldValue: any;

  @Prop({ type: Object })
  newValue: any;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } }) // Only createdAt needed
export class ActivityLog {
  _id: Types.ObjectId;

  @Prop({ required: true, index: true })
  action: string;

  @Prop({ type: String, enum: EntityType, required: true })
  entityType: EntityType;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  // Actor
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Context
  @Prop({ type: Types.ObjectId, ref: 'Board', index: true })
  boardId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  // Changes
  @Prop({ type: [ChangeLog] })
  changes?: ChangeLog[];

  // Metadata
  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: Date.now, index: true })
  createdAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

// Compound indexes
ActivityLogSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });
ActivityLogSchema.index({ userId: 1, createdAt: 1 });
ActivityLogSchema.index({ boardId: 1, createdAt: 1 });
ActivityLogSchema.index({ action: 1, createdAt: 1 });
