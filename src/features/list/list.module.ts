import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { List, ListSchema } from './schemas/list.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: List.name, schema: ListSchema }]),
  ],
  exports: [MongooseModule],
})
export class ListModule {}
