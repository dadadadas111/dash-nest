import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';
import { TaskStatus, TaskPriority } from 'src/common/enums/task.enum';

export type TaskDocument = HydratedDocument<Task>;

export class ChecklistProgress {
  @Prop({ default: 0 })
  total: number;

  @Prop({ default: 0 })
  completed: number;
}

export class TaskStats {
  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  attachmentCount: number;

  @Prop({ default: 0 })
  subtaskCount: number;

  @Prop({ type: ChecklistProgress, default: () => ({}) })
  checklistProgress: ChecklistProgress;
}

@Schema({ timestamps: true })
export class Task extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'List', required: true, index: true })
  listId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  // Status & priority
  @Prop({
    type: String,
    enum: TaskStatus,
    default: TaskStatus.TODO,
    index: true,
  })
  status: TaskStatus;

  @Prop({
    type: String,
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    index: true,
  })
  priority: TaskPriority;

  // Assignment
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], index: true })
  assignees: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  createdBy: Types.ObjectId;

  // Dates
  @Prop({ index: true })
  dueDate?: Date;

  @Prop()
  startDate?: Date;

  @Prop()
  completedAt?: Date;

  // Ordering
  @Prop({ required: true })
  position: number;

  // Labels
  @Prop([String])
  labels: string[];

  // Effort
  @Prop()
  estimatedHours?: number;

  @Prop()
  actualHours?: number;

  // Relationships
  @Prop({ type: Types.ObjectId, ref: 'Task', index: true })
  parentTaskId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Task' }] })
  blockedBy?: Types.ObjectId[];

  // Stats
  @Prop({ type: TaskStats, default: () => ({}) })
  stats: TaskStats;

  // Archiving
  @Prop({ default: false })
  isArchived: boolean;

  @Prop()
  archivedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Compound indexes
TaskSchema.index({ boardId: 1, listId: 1, position: 1 });
TaskSchema.index({ boardId: 1, status: 1 });
