import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardSchema } from './schemas/board.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]),
  ],
  exports: [MongooseModule],
})
export class BoardModule {}
