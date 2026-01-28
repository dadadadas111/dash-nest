import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Attachment.name, schema: AttachmentSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class AttachmentModule {}
