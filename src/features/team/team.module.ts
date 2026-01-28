import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Team, TeamSchema } from './schemas/team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Team.name, schema: TeamSchema }]),
  ],
  exports: [MongooseModule],
})
export class TeamModule {}
