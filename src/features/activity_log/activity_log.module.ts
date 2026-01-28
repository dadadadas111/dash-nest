import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ActivityLogModule {}
