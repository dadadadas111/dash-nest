import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';
import { StorageType } from 'src/common/enums/storage.enum';

export type AttachmentDocument = HydratedDocument<Attachment>;

export class ImageMetadata {
  @Prop()
  width: number;

  @Prop()
  height: number;

  @Prop()
  thumbnailUrl?: string;
}

@Schema({ timestamps: true })
export class Attachment extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, index: true })
  mimeType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ type: String, enum: StorageType, required: true })
  storageType: StorageType;

  @Prop({ required: true })
  storagePath: string;

  @Prop({ required: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  uploadedBy: Types.ObjectId;

  @Prop({ type: ImageMetadata })
  imageMetadata?: ImageMetadata;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

// Compound indexes
AttachmentSchema.index({ taskId: 1, createdAt: 1 });
