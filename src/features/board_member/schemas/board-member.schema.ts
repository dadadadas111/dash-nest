import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';
import { BoardRole } from '@common/enums/board.enum';

export type BoardMemberDocument = HydratedDocument<BoardMember>;

export class BoardMemberPermissions {
  @Prop({ default: false })
  canEditBoard: boolean;

  @Prop({ default: false })
  canDeleteBoard: boolean;

  @Prop({ default: false })
  canAddMembers: boolean;

  @Prop({ default: false })
  canCreateTask: boolean;

  @Prop({ default: false })
  canEditTask: boolean;

  @Prop({ default: false })
  canDeleteTask: boolean;
}

@Schema({ timestamps: true })
export class BoardMember extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Board', required: true, index: true })
  boardId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Role
  @Prop({ type: String, enum: BoardRole, default: BoardRole.MEMBER })
  role: BoardRole;

  // Permissions
  @Prop({ type: BoardMemberPermissions, default: () => ({}) })
  permissions: BoardMemberPermissions;

  // Activity
  @Prop({ type: Types.ObjectId, ref: 'User' })
  addedBy?: Types.ObjectId;

  @Prop({ default: Date.now })
  addedAt: Date;

  @Prop()
  lastViewedAt?: Date;
}

export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);

// Compound indexes
BoardMemberSchema.index({ boardId: 1, userId: 1 }, { unique: true });
