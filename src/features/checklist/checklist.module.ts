import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Checklist, ChecklistSchema } from './schemas/checklist.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Checklist.name, schema: ChecklistSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ChecklistModule {}
