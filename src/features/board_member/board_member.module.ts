import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardMember, BoardMemberSchema } from './schemas/board-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BoardMember.name, schema: BoardMemberSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class BoardMemberModule {}
