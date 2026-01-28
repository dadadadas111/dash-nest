import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CacheModule } from './shared/cache/cache.module';
import { MailModule } from './shared/mail/mail.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './features/user/user.module';
import { TeamModule } from './features/team/team.module';
import { TeamMemberModule } from './features/team_member/team_member.module';
import { BoardModule } from './features/board/board.module';
import { BoardMemberModule } from './features/board_member/board_member.module';
import { ListModule } from './features/list/list.module';
import { TaskModule } from './features/task/task.module';
import { CommentModule } from './features/comment/comment.module';
import { AttachmentModule } from './features/attachment/attachment.module';
import { ActivityLogModule } from './features/activity_log/activity_log.module';
import { NotificationModule } from './features/notification/notification.module';
import { ChecklistModule } from './features/checklist/checklist.module';

@Module({
  imports: [
    // Common Modules
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    MailModule,
    DatabaseModule,
    // Feature Modules
    UserModule,
    TeamModule,
    TeamMemberModule,
    BoardModule,
    BoardMemberModule,
    ListModule,
    TaskModule,
    CommentModule,
    AttachmentModule,
    ActivityLogModule,
    NotificationModule,
    ChecklistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
