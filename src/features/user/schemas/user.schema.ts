import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/base.schema';
import { UserRole } from '@common/enums/user.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // Email verification
  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  emailVerificationToken?: string;

  // Password reset
  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  // Profile
  @Prop()
  bio?: string;

  @Prop()
  timezone?: string;

  @Prop()
  locale?: string;

  // Activity tracking
  @Prop()
  lastLoginAt?: Date;

  @Prop({ index: true })
  lastActiveAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
