# Implementation Guide: Adding Auth to Feature Modules

This guide shows how to integrate authentication and authorization into your existing feature modules.

## Quick Start Checklist

- [ ] Update feature module to import `AuthModule`
- [ ] Add `FirebaseAuthGuard` to protected routes
- [ ] Add permission guards for authorization-required routes
- [ ] Use `@User()` decorator to extract user context
- [ ] Add appropriate `@Require*` decorators
- [ ] Test with Firebase tokens

## Step-by-Step Integration

### 1. Import AuthModule in Your Feature

```typescript
// src/features/board/board.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '@auth/auth.module';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';
import { BoardSchema } from './schemas/board.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Board', schema: BoardSchema }]),
    AuthModule,  // Add this
  ],
  controllers: [BoardController],
  providers: [BoardService],
  exports: [BoardService],
})
export class BoardModule {}
```

### 2. Add Guards to Controller

```typescript
// src/features/board/board.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  Param,
  Body 
} from '@nestjs/common';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RoleGuard } from '@common/guards/role.guard';
import { User } from '@common/decorators/user.decorators';
import { RequireBoardCreate, RequireBoardRead } from '@common/decorators/permission.decorators';
import { RequireAdmin } from '@common/decorators/role.decorators';
import { IAuthorizationContext } from '@common/interfaces/auth.interface';

@Controller('boards')
@UseGuards(FirebaseAuthGuard)  // Apply to entire controller
export class BoardController {
  constructor(private boardService: BoardService) {}

  /**
   * Get all boards for authenticated user
   * Authentication required, permission not checked
   */
  @Get()
  async getBoards(@User() user: IAuthorizationContext) {
    return this.boardService.getBoardsForUser(user.userId);
  }

  /**
   * Get specific board
   * Authentication required, read permission checked
   */
  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequireBoardRead()
  async getBoard(
    @Param('id') boardId: string,
    @User() user: IAuthorizationContext
  ) {
    return this.boardService.getBoard(boardId, user.userId);
  }

  /**
   * Create new board
   * Authentication required, create permission checked
   */
  @Post()
  @UseGuards(PermissionGuard)
  @RequireBoardCreate()
  async createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @User() user: IAuthorizationContext
  ) {
    return this.boardService.createBoard(createBoardDto, user.userId);
  }

  /**
   * Admin-only endpoint
   * Both authentication and role checked
   */
  @Post('admin/settings')
  @UseGuards(RoleGuard)
  @RequireAdmin()
  async updateBoardSettings(@Body() settings: any) {
    return this.boardService.updateSettings(settings);
  }
}
```

### 3. Use User Context in Services

```typescript
// src/features/board/board.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthorizationService } from '@common/services/authorization.service';
import { AbacAction, AbacResource } from '@common/enums/auth.enum';
import { IAuthorizationContext } from '@common/interfaces/auth.interface';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel('Board') private boardModel: Model<any>,
    private authorizationService: AuthorizationService,
  ) {}

  async getBoard(boardId: string, userId: string) {
    const board = await this.boardModel.findById(boardId);
    
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createBoard(createBoardDto: CreateBoardDto, userId: string) {
    // User context already verified by guard
    // Create with current user as owner
    return this.boardModel.create({
      ...createBoardDto,
      ownerId: userId,
      members: [userId],
      createdAt: new Date(),
    });
  }

  /**
   * Check if user can edit board
   * Can be used in guards or directly in services
   */
  canUserEditBoard(user: IAuthorizationContext, boardId: string, isOwner: boolean): boolean {
    return this.authorizationService.checkPermission(
      user,
      AbacAction.UPDATE,
      AbacResource.BOARD,
      { boardId, resourceOwner: isOwner }
    );
  }

  /**
   * Check if user can manage board
   */
  canUserManageBoard(user: IAuthorizationContext, boardId: string, isAdmin: boolean): boolean {
    return this.authorizationService.checkPermission(
      user,
      AbacAction.MANAGE,
      AbacResource.BOARD,
      { boardId, boardAdmin: isAdmin }
    );
  }
}
```

### 4. Custom Authorization Logic in Routes

```typescript
// More complex example with conditional authorization
@Patch(':id')
@UseGuards(FirebaseAuthGuard)
async updateBoard(
  @Param('id') boardId: string,
  @Body() updateBoardDto: UpdateBoardDto,
  @User() user: IAuthorizationContext
) {
  const board = await this.boardService.getBoard(boardId);
  
  // Custom authorization logic
  const isOwner = board.ownerId === user.userId;
  const isAdmin = user.roles.includes('admin');
  const isBoardAdmin = board.admins?.includes(user.userId);

  if (!isOwner && !isAdmin && !isBoardAdmin) {
    throw new ForbiddenException('You do not have permission to edit this board');
  }

  return this.boardService.updateBoard(boardId, updateBoardDto);
}
```

### 5. Handle Permissions at Database Query Level

```typescript
// src/features/board/board.service.ts

@Injectable()
export class BoardService {
  /**
   * Get boards filtered by user permissions
   * Only return boards user has access to
   */
  async getBoardsForUser(userId: string) {
    return this.boardModel.find({
      $or: [
        { ownerId: userId },
        { members: userId },
        { public: true }
      ]
    });
  }

  /**
   * Get tasks in a board only if user has permission
   */
  async getTasksInBoard(boardId: string, userId: string) {
    // First verify user is board member
    const board = await this.boardModel.findOne({
      _id: boardId,
      members: userId
    });

    if (!board) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return this.taskModel.find({ boardId });
  }
}
```

## Common Patterns

### Pattern 1: Public Routes with Optional Authentication

```typescript
@Get('public-data')
@UseGuards(FirebaseAuthGuard)  // Optional - doesn't throw if missing
async getPublicData(@User() user?: IAuthorizationContext) {
  if (user) {
    // Return personalized data
    return this.getPersonalizedData(user.userId);
  }
  // Return generic public data
  return this.getPublicData();
}
```

### Pattern 2: Cascade Permission Checks

```typescript
@Post(':teamId/boards/:boardId/tasks')
@UseGuards(FirebaseAuthGuard, PermissionGuard)
@RequireTaskCreate()
async createTask(
  @Param('teamId') teamId: string,
  @Param('boardId') boardId: string,
  @Body() createTaskDto: CreateTaskDto,
  @User() user: IAuthorizationContext
) {
  // Check user is team member
  const team = await this.teamService.getTeam(teamId);
  if (!team.members.includes(user.userId)) {
    throw new ForbiddenException('Not a team member');
  }

  // Check user is board member
  const board = await this.boardService.getBoard(boardId);
  if (!board.members.includes(user.userId)) {
    throw new ForbiddenException('Not a board member');
  }

  // Permission guard already checked create:task
  return this.taskService.createTask(boardId, createTaskDto, user.userId);
}
```

### Pattern 3: Resource-Based Authorization

```typescript
/**
 * Only allow user to delete their own comments
 */
@Delete('comments/:commentId')
@UseGuards(FirebaseAuthGuard)
async deleteComment(
  @Param('commentId') commentId: string,
  @User() user: IAuthorizationContext
) {
  const comment = await this.commentService.getComment(commentId);
  
  if (comment.authorId !== user.userId && !user.roles.includes('admin')) {
    throw new ForbiddenException('You can only delete your own comments');
  }

  return this.commentService.deleteComment(commentId);
}
```

### Pattern 4: Team-Based Authorization

```typescript
/**
 * User can only manage users in teams they admin
 */
@Post('teams/:teamId/members')
@UseGuards(FirebaseAuthGuard, PermissionGuard)
@RequireTeamManage()
async addTeamMember(
  @Param('teamId') teamId: string,
  @Body() addMemberDto: AddMemberDto,
  @User() user: IAuthorizationContext
) {
  const team = await this.teamService.getTeam(teamId);

  // Check user is team admin
  if (!team.admins.includes(user.userId) && !user.roles.includes('admin')) {
    throw new ForbiddenException('You must be a team admin');
  }

  return this.teamService.addMember(teamId, addMemberDto.userId);
}
```

### Pattern 5: Owner-Only Operations

```typescript
/**
 * Only resource owner or admin can perform this action
 */
@Delete('tasks/:taskId')
@UseGuards(FirebaseAuthGuard)
async deleteTask(
  @Param('taskId') taskId: string,
  @User() user: IAuthorizationContext
) {
  const task = await this.taskService.getTask(taskId);

  const isOwner = task.createdBy === user.userId;
  const isAdmin = user.roles.includes('admin');

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException('Only task owner can delete');
  }

  return this.taskService.deleteTask(taskId);
}
```

## Testing

### Test with Authentication

```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication & Authorization (e2e)', () => {
  let app: INestApplication;
  let idToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Sign up test user
    const signUpRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'testPassword123',
      });

    idToken = signUpRes.body.data.idToken;
    userId = signUpRes.body.data.uid;
  });

  describe('Protected Routes', () => {
    it('should deny access without token', () => {
      return request(app.getHttpServer())
        .get('/boards')
        .expect(401);
    });

    it('should allow access with valid token', () => {
      return request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer ${idToken}`)
        .expect(200);
    });

    it('should deny access with invalid token', () => {
      return request(app.getHttpServer())
        .get('/boards')
        .set('Authorization', `Bearer invalid-token`)
        .expect(401);
    });
  });

  describe('Permission-Based Routes', () => {
    it('should allow user to create board', () => {
      return request(app.getHttpServer())
        .post('/boards')
        .set('Authorization', `Bearer ${idToken}`)
        .send({ name: 'Test Board' })
        .expect(201);
    });

    it('should deny non-admin access to admin routes', () => {
      return request(app.getHttpServer())
        .post('/admin/settings')
        .set('Authorization', `Bearer ${idToken}`)
        .send({ setting: 'value' })
        .expect(403);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Mock Firebase in Tests

```typescript
// test/mocks/firebase-admin.service.mock.ts
export const mockFirebaseAdminService = {
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com',
    customClaims: { role: 'user', roles: ['user'] }
  }),
  getUser: jest.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com',
  }),
  setCustomClaims: jest.fn().mockResolvedValue(undefined),
};

// In your test module
beforeEach(async () => {
  const module = await Test.createTestingModule({
    controllers: [BoardController],
    providers: [
      BoardService,
      {
        provide: FirebaseAdminService,
        useValue: mockFirebaseAdminService,
      },
    ],
  }).compile();

  controller = module.get<BoardController>(BoardController);
});
```

## Debugging

### Enable Debug Logging

```typescript
// In your main.ts or .env
LOG_LEVEL=debug

// Or in specific service
private logger = new Logger(AuthorizationService.name);

ngOnInit() {
  // Enable debug mode
  this.logger.debug('Authorization service initialized');
}
```

### Check Custom Claims

```bash
# Via Firebase Console
# User → Custom claims

# Or programmatically
const claims = await firebaseAdminService.getCustomClaims(userId);
console.log('Custom claims:', claims);
```

## Migration from Existing Auth

If migrating from existing authentication:

1. **Keep existing auth temporarily alongside new system**
   ```typescript
   @UseGuards(ExistingAuthGuard | FirebaseAuthGuard)
   ```

2. **Gradually migrate routes**
   - Update one module at a time
   - Test thoroughly
   - Keep rollback plan

3. **Migrate user data**
   ```typescript
   // Create Firebase users from existing user database
   for (const user of existingUsers) {
     await firebaseAdminService.createUser(
       user.email,
       user.tempPassword,
       user.displayName
     );
   }
   ```

4. **Set initial custom claims**
   ```typescript
   for (const user of existingUsers) {
     const claims = buildCustomClaimsFromDatabase(user);
     await customClaimsService.setCustomClaims(user.firebaseUid, claims);
   }
   ```

5. **Notify users about new login method**
   - Send password reset email
   - Link to documentation
   - Support channel for issues

---

For more details, see the main [AUTHENTICATION_AUTHORIZATION.md](./AUTHENTICATION_AUTHORIZATION.md) guide.
