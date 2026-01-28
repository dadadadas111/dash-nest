import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';
import { TeamRole, TeamMemberStatus } from 'src/common/enums/team.enum';

export type TeamMemberDocument = HydratedDocument<TeamMember>;

export class TeamMemberPermissions {
  @Prop({ default: false })
  canCreateBoard: boolean;

  @Prop({ default: false })
  canDeleteBoard: boolean;

  @Prop({ default: false })
  canManageMembers: boolean;

  @Prop({ default: false })
  canManageSettings: boolean;
}

@Schema({ timestamps: true })
export class TeamMember extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Team', required: true, index: true })
  teamId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Role & permissions
  @Prop({ type: String, enum: TeamRole, default: TeamRole.MEMBER })
  role: TeamRole;

  @Prop({ type: TeamMemberPermissions, default: () => ({}) })
  permissions: TeamMemberPermissions;

  // Invitation tracking
  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @Prop()
  invitedAt?: Date;

  @Prop({ default: Date.now })
  joinedAt: Date;

  // Status
  @Prop({
    type: String,
    enum: TeamMemberStatus,
    default: TeamMemberStatus.INVITED,
    index: true,
  })
  status: TeamMemberStatus;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

// Compound indexes
TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
TeamMemberSchema.index({ userId: 1, status: 1 });
TeamMemberSchema.index({ teamId: 1, status: 1 });
