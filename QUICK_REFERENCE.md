# Firebase Auth - Quick Reference Card

One-page cheat sheet for using the authentication and authorization system.

## Installation & Setup

```bash
# Install Firebase Admin SDK
npm install firebase-admin

# Copy environment template
cp .env.example .env

# Edit .env with Firebase credentials
# FIREBASE_SERVICE_ACCOUNT_KEY_JSON='...'
# FIREBASE_API_KEY='...'

# Start server
npm run start:dev
```

## Authentication Endpoints

```bash
# Sign up
POST /auth/signup
{ "email": "user@example.com", "password": "Pass123!", "displayName": "Name" }

# Sign in
POST /auth/signin
{ "email": "user@example.com", "password": "Pass123!" }

# Refresh token
POST /auth/refresh
{ "refreshToken": "refresh-token-here" }

# Get current user (requires auth)
GET /auth/me
Authorization: Bearer {idToken}

# Update profile (requires auth)
POST /auth/me
Authorization: Bearer {idToken}
{ "displayName": "New Name", "photoURL": "..." }

# Send password reset email
POST /auth/send-password-reset-email
{ "email": "user@example.com" }

# Send verification email (requires auth)
POST /auth/send-verification-email
Authorization: Bearer {idToken}
```

## Basic Controller Protection

```typescript
// Require authentication only
@Controller('boards')
@UseGuards(FirebaseAuthGuard)
export class BoardController {
  @Get()
  getBoards(@User() user: IAuthorizationContext) {
    return this.boardService.getBoards(user.userId);
  }
}

// Require specific role
@Post('admin-only')
@UseGuards(RoleGuard)
@RequireAdmin()
adminOnly() { }

// Require specific permission
@Post('tasks')
@UseGuards(PermissionGuard)
@RequireTaskCreate()
createTask(@Body() dto: CreateTaskDto) { }
```

## User Decorators

```typescript
@User()                 // Full context: { userId, email, roles, attributes, token }
@UserId()              // Just user ID string
@UserEmail()           // Just email string
@UserRoles()           // Just roles array
@FirebaseToken()       // Full Firebase token
```

## Role Shortcuts

```typescript
@RequireAdmin()        // Admin only
@RequireModerator()    // Moderator or Admin
@RequireUser()         // User, Moderator, or Admin
```

## Permission Shortcuts

```typescript
// Team
@RequireTeamCreate()   @RequireTeamRead()
@RequireTeamUpdate()   @RequireTeamDelete()
@RequireTeamManage()

// Board
@RequireBoardCreate()  @RequireBoardRead()
@RequireBoardUpdate()  @RequireBoardDelete()
@RequireBoardManage()

// Task
@RequireTaskCreate()   @RequireTaskRead()
@RequireTaskUpdate()   @RequireTaskDelete()

// Comment
@RequireCommentCreate()  @RequireCommentRead()
@RequireCommentUpdate()  @RequireCommentDelete()

// More available for user, attachment, notification, etc.
```

## Custom Permission Check

```typescript
@RequirePermissions(
  [AbacAction.CREATE, AbacResource.TASK],
  [AbacAction.READ, AbacResource.BOARD]
)
async createTask() { }
```

## Programmatic Permission Checks

```typescript
constructor(private authorizationService: AuthorizationService) {}

canUserEdit(user: IAuthorizationContext, boardId: string): boolean {
  return this.authorizationService.checkPermission(
    user,
    AbacAction.UPDATE,
    AbacResource.BOARD,
    { boardId, resourceOwner: true }
  );
}
```

## Role Definitions

```
ADMIN       → Full access to everything
MODERATOR   → Manage content and teams they admin
USER        → Create content, read boards, manage own items
GUEST       → Read-only access
```

## Built-in ABAC Attributes

```
resourceOwner    → User created/owns the resource
resourceId       → ID of the resource
resourceType     → Type of resource

teamMember       → User is team member
teamAdmin        → User is team admin
teamId          → Specific team ID

boardMember      → User is board member
boardAdmin       → User is board admin
boardId         → Specific board ID

userId          → User's Firebase UID
userEmail       → User's email address
isEmailVerified → Email is verified
```

## Custom Claims Structure

```typescript
{
  role: "user",
  roles: ["user"],
  attributes: {
    teamId: "team-123",
    teamMember: true,
    boardAdmin: true
  },
  permissionRules: [...],
  updatedAt: 1234567890
}
```

## Updating User Role (Admin Only)

```typescript
// In your admin service
@Post('users/:userId/role')
@UseGuards(FirebaseAuthGuard, RoleGuard)
@RequireAdmin()
async setUserRole(@Param('userId') userId: string, @Body('role') role: string) {
  const claims = this.customClaimsService.buildCustomClaims(userId, role);
  await this.customClaimsService.setCustomClaims(userId, claims);
  return { success: true };
}
```

## Common Patterns

### Owner-Only Access
```typescript
@Delete('tasks/:taskId')
async deleteTask(@Param('taskId') taskId: string, @User() user: IAuthorizationContext) {
  const task = await this.taskService.getTask(taskId);
  if (task.createdBy !== user.userId && !user.roles.includes('admin')) {
    throw new ForbiddenException('Can only delete own tasks');
  }
  return this.taskService.deleteTask(taskId);
}
```

### Team-Based Authorization
```typescript
@Post('teams/:teamId/members')
@UseGuards(FirebaseAuthGuard)
async addMember(@Param('teamId') teamId: string, @User() user: IAuthorizationContext) {
  const team = await this.teamService.getTeam(teamId);
  if (!team.admins.includes(user.userId)) {
    throw new ForbiddenException('Must be team admin');
  }
  // ... add member
}
```

### Multi-Permission Check
```typescript
if (!this.authorizationService.checkPermissions(
  user,
  [
    [AbacAction.READ, AbacResource.BOARD],
    [AbacAction.CREATE, AbacResource.TASK]
  ]
)) {
  throw new ForbiddenException('Missing required permissions');
}
```

## Testing

```typescript
// Mock Firebase Admin
const mockFirebaseAdminService = {
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-uid',
    email: 'test@example.com',
    customClaims: { role: 'user', roles: ['user'] }
  }),
  getUser: jest.fn().mockResolvedValue({ uid: 'test-uid', email: 'test@example.com' }),
  setCustomClaims: jest.fn().mockResolvedValue(undefined),
};

// Use in test module
{
  provide: FirebaseAdminService,
  useValue: mockFirebaseAdminService,
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Token verification fails | Check FIREBASE_SERVICE_ACCOUNT_KEY_JSON is valid |
| No custom claims in token | Get fresh token after setting claims (or restart) |
| Permission always denied | Verify user has required role and conditions match |
| Service account error | Download fresh key from Firebase Console |
| 401 Unauthorized | Ensure Authorization: Bearer {idToken} header present |
| 403 Forbidden | Check @Require* decorators and user roles/permissions |

## Environment Variables

```bash
# REQUIRED
FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account",...}'
FIREBASE_API_KEY='AIzaSy...'

# OPTIONAL
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
```

## Important URLs

| Resource | URL |
|----------|-----|
| Firebase Console | https://console.firebase.google.com |
| Firebase Docs | https://firebase.google.com/docs |
| NestJS Guards | https://docs.nestjs.com/guards |
| Firebase Admin SDK | https://firebase.google.com/docs/admin/setup |

## Key Concepts

**Authentication** - Verifying who you are (email/password → Firebase)
**Authorization** - What you're allowed to do (RBAC + ABAC)
**Custom Claims** - Authorization data in JWT token (fast checks)
**ABAC** - Attribute-based rules (resourceOwner, teamMember, etc.)
**RBAC** - Role-based rules (admin, moderator, user)
**Guards** - NestJS middleware that runs before route handler
**Decorators** - Metadata markers for guards and parameter extraction

## Performance Tips

✅ Use custom claims (cached in token)
✅ Check roles first (fast), then permissions (slightly slower)
✅ Cache permission results if needed (1 hour max)
✅ Avoid repeated database queries
✅ Use @User() decorator to get already-verified context

## Security Tips

✅ Always use @UseGuards(FirebaseAuthGuard) on protected routes
✅ Keep service account key in .env (not in code)
✅ Never expose refresh tokens to client until absolutely needed
✅ Rotate Firebase keys periodically
✅ Log failed permission checks
✅ Use HTTPS in production
✅ Validate all user input

## Documentation References

- **Complete Guide:** `docs/AUTHENTICATION_AUTHORIZATION.md`
- **How to Integrate:** `docs/IMPLEMENTATION_GUIDE.md`
- **Firebase Setup:** `docs/FIREBASE_SETUP.md`
- **Architecture:** `docs/ARCHITECTURE_DIAGRAMS.md`
- **Overview:** `FIREBASE_AUTH_COMPLETE.md`

## Quick Start Commands

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Signin
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Get user (replace TOKEN)
curl -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

**Print this page** as a quick reference while developing!

**Last Updated:** January 28, 2026
**Status:** Production Ready
