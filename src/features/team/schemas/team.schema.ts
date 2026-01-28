import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';
import { BoardVisibility } from '@common/enums/board.enum';

export type TeamDocument = HydratedDocument<Team>;

export class TeamSettings {
  @Prop({ default: true })
  isPrivate: boolean;

  @Prop({ default: true })
  allowMemberInvite: boolean;
  @Prop({
    type: String,
    enum: Object.values(BoardVisibility),
    default: BoardVisibility.PRIVATE,
  })
  defaultBoardVisibility: BoardVisibility;
}

export class TeamStats {
  @Prop({ default: 0 })
  memberCount: number;

  @Prop({ default: 0 })
  boardCount: number;

  @Prop({ default: 0 })
  taskCount: number;
}

@Schema({ timestamps: true })
export class Team extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  avatar?: string;

  // Ownership
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId: Types.ObjectId;

  // Settings
  @Prop({ type: TeamSettings, default: () => ({}) })
  settings: TeamSettings;

  // Stats (denormalized)
  @Prop({ type: TeamStats, default: () => ({}) })
  stats: TeamStats;
}

export const TeamSchema = SchemaFactory.createForClass(Team);
