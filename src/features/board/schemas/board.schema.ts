import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';
import { BoardVisibility } from 'src/common/enums/board.enum';

export type BoardDocument = HydratedDocument<Board>;

export class BoardSettings {
  @Prop({ default: true })
  enableComments: boolean;

  @Prop({ default: true })
  enableAttachments: boolean;

  @Prop({ default: true })
  enableLabels: boolean;

  @Prop({ default: true })
  enableDueDate: boolean;

  @Prop({ default: 'todo' })
  defaultTaskStatus: string;
}

export class BoardStats {
  @Prop({ default: 0 })
  taskCount: number;

  @Prop({ default: 0 })
  completedTaskCount: number;

  @Prop({ default: 0 })
  memberCount: number;
}

@Schema({ timestamps: true })
export class Board extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  color?: string;

  @Prop()
  icon?: string;

  // Ownership
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Team', index: true })
  teamId?: Types.ObjectId;

  // Visibility
  @Prop({
    type: String,
    enum: BoardVisibility,
    default: BoardVisibility.PRIVATE,
    index: true,
  })
  visibility: BoardVisibility;

  // Board settings
  @Prop({ type: BoardSettings, default: () => ({}) })
  settings: BoardSettings;

  // Stats (denormalized)
  @Prop({ type: BoardStats, default: () => ({}) })
  stats: BoardStats;

  // Ordering
  @Prop({ default: 0, index: true })
  position: number;

  // Archiving
  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy?: Types.ObjectId;
}

export const BoardSchema = SchemaFactory.createForClass(Board);

// Compound indexes
BoardSchema.index({ ownerId: 1, isArchived: 1 });
BoardSchema.index({ teamId: 1, isArchived: 1 });
