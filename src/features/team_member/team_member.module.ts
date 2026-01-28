import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamMember, TeamMemberSchema } from './schemas/team-member.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TeamMember.name, schema: TeamMemberSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class TeamMemberModule {}
