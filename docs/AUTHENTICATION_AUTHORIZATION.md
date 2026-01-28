# Firebase Authentication & Authorization Guide

This document outlines the authentication and authorization system for the dash-nest application.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [Authorization Strategy](#authorization-strategy)
5. [Configuration](#configuration)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)
8. [Performance Optimization](#performance-optimization)

## Overview

The system uses **Firebase** for authentication and implements a hybrid **RBAC (Role-Based Access Control)** and **ABAC (Attribute-Based Access Control)** approach for authorization.

### Key Components

- **Firebase REST API**: Client-side authentication (login, signup)
- **Firebase Admin SDK**: Server-side operations (token verification, user management, custom claims)
- **RBAC**: Role-based permission inheritance
- **ABAC**: Fine-grained attribute-based conditions
- **Custom Claims**: Cached authorization data in JWT tokens for performance

## Architecture

### Component Diagram

```
Client (Web/Mobile)
    ↓
Firebase REST API (Signup/Login)
    ↓
Firebase ID Token
    ↓
Your API (with Authorization header)
    ↓
FirebaseAuthGuard (Verify Token)
    ↓
Authorization Service (Check Permissions)
    ↓
Business Logic
```

### Key Services

#### 1. **FirebaseAuthService**
Handles Firebase REST API operations for client-side authentication.

```typescript
- signUp(request: IFirebaseSignUpRequest): Promise<IFirebaseSignUpResponse>
- signInWithEmail(request: IFirebaseAuthRequest): Promise<IFirebaseAuthResponse>
- refreshToken(refreshToken: string): Promise<string>
- getUserInfo(idToken: string): Promise<any>
- sendEmailVerification(idToken: string): Promise<any>
- sendPasswordResetEmail(email: string): Promise<any>
- updateProfile(idToken: string, displayName?: string, photoUrl?: string): Promise<any>
- deleteAccount(idToken: string): Promise<void>
```

#### 2. **FirebaseAdminService**
Handles Firebase Admin SDK operations for server-side authentication and user management.

```typescript
- verifyIdToken(idToken: string): Promise<IFirebaseDecodedToken>
- verifySessionCookie(sessionCookie: string): Promise<IFirebaseDecodedToken>
- setCustomClaims(uid: string, customClaims: Record<string, any>): Promise<void>
- getCustomClaims(uid: string): Promise<Record<string, any> | undefined>
- createUser(email: string, password: string, displayName?: string): Promise<admin.auth.UserRecord>
- getUser(uid: string): Promise<admin.auth.UserRecord>
- getUserByEmail(email: string): Promise<admin.auth.UserRecord>
- updateUser(uid: string, updateData: {...}): Promise<admin.auth.UserRecord>
- deleteUser(uid: string): Promise<void>
- generateEmailVerificationLink(email: string): Promise<string>
- generatePasswordResetLink(email: string): Promise<string>
```

#### 3. **AuthorizationService**
Implements ABAC/RBAC permission checking.

```typescript
- checkPermission(user: IAuthorizationContext, action: AbacAction | string, resource: AbacResource | string, resourceContext?: Record<string, any>): boolean
- checkPermissions(user: IAuthorizationContext, permissions: Array<[AbacAction, AbacResource]>, resourceContext?: Record<string, any>): boolean
- checkAnyPermission(user: IAuthorizationContext, permissions: Array<[AbacAction, AbacResource]>, resourceContext?: Record<string, any>): boolean
- getRole(roleId: string): IRoleDefinition | undefined
- getAllRoles(): IRoleDefinition[]
```

#### 4. **CustomClaimsService**
Manages Firebase custom claims for authorization caching.

```typescript
- buildCustomClaims(userId: string, role: string, abacRules?: IABAC[], attributes?: Record<string, any>): IFirebaseCustomClaims
- setCustomClaims(userId: string, customClaims: IFirebaseCustomClaims): Promise<void>
- updateCustomClaims(userId: string, partialClaims: Partial<IFirebaseCustomClaims>): Promise<void>
- clearCustomClaims(userId: string): Promise<void>
- getCustomClaims(userId: string): Promise<IFirebaseCustomClaims | undefined>
- isCustomClaimsStale(claims: IFirebaseCustomClaims | undefined, maxAgeMs?: number): boolean
```

## Authentication Flow

### 1. Sign Up

```
Client → /auth/signup (POST)
         { email, password, displayName }
              ↓
Firebase REST API
              ↓
Server: Set Default Claims (USER role)
              ↓
Return: { idToken, refreshToken, localId }
```

### 2. Sign In

```
Client → /auth/signin (POST)
         { email, password }
              ↓
Firebase REST API
              ↓
Return: { idToken, refreshToken, localId }
         
Client stores idToken & refreshToken
Client includes idToken in Authorization header for future requests
```

### 3. Token Verification (On Protected Routes)

```
Client → Protected Route
         Headers: Authorization: Bearer {idToken}
              ↓
FirebaseAuthGuard
    ↓ Verify token via Firebase Admin SDK
    ↓ Extract custom claims
    ↓ Attach to request.user
              ↓
Route Handler (User available via @User() decorator)
```

### 4. Token Refresh

```
Client has expired idToken but valid refreshToken
         ↓
Client → /auth/refresh (POST)
         { refreshToken }
              ↓
Firebase REST API
              ↓
Return: { idToken }
              ↓
Client updates stored idToken
```

## Authorization Strategy

### Role-Based Access Control (RBAC)

Built-in roles with predefined permissions:

```typescript
enum BuiltInRole {
  ADMIN = 'admin',        // Full system access
  MODERATOR = 'moderator',  // Can moderate content
  USER = 'user',          // Standard user permissions
  GUEST = 'guest',        // Read-only limited access
}
```

### Attribute-Based Access Control (ABAC)

Each role maps to a set of ABAC rules with conditions:

```typescript
interface IABAC {
  action: AbacAction;      // create, read, update, delete, manage, share, export
  resource: AbacResource;  // team, board, task, comment, etc.
  conditions?: {           // Optional conditions
    [attribute: string]: any;
  };
  description?: string;
}
```

### Example: User Role Permissions

```typescript
{
  action: 'create',
  resource: 'board',
  conditions: {
    teamMember: true  // Only create boards in teams they're members of
  },
  description: 'Create boards in teams they are members of'
}
```

### Permission Examples

| Permission | RBAC Role | ABAC Condition | Meaning |
|-----------|-----------|----------------|---------|
| `read:board` | USER | `boardMember: true` | Can read boards they're members of |
| `update:task` | USER | `resourceOwner: true` | Can update own tasks |
| `delete:comment` | USER | `resourceOwner: true` | Can delete own comments |
| `manage:board` | MODERATOR | `boardAdmin: true` | Can manage boards they admin |
| `manage:*` | ADMIN | (none) | Can manage everything |

## Configuration

### Environment Variables

```bash
# Firebase configuration (from Firebase Console)
FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{"type":"service_account",...}'
FIREBASE_API_KEY='AIz...'  # From Firebase Console
```

The service account key must be a valid Firebase service account JSON. Download from:
Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### Module Setup

In `app.module.ts`:

```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## Usage Examples

### 1. Authentication Endpoints

#### Sign Up

```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "uid": "firebase-uid",
    "email": "user@example.com",
    "idToken": "eyJ...",
    "refreshToken": "refresh-token"
  }
}
```

#### Sign In

```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response:
{
  "success": true,
  "data": {
    "uid": "firebase-uid",
    "idToken": "eyJ...",
    "refreshToken": "refresh-token"
  }
}
```

#### Get Current User

```bash
GET /auth/me
Authorization: Bearer {idToken}

Response:
{
  "success": true,
  "data": {
    "uid": "firebase-uid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "roles": ["user"],
    "attributes": {...}
  }
}
```

### 2. Protecting Routes with Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { User } from '@common/decorators/user.decorators';
import { IAuthorizationContext } from '@common/interfaces/auth.interface';

@Controller('boards')
export class BoardController {
  @Get()
  @UseGuards(FirebaseAuthGuard)
  getBoards(@User() user: IAuthorizationContext) {
    // Only authenticated users can access this
    return { boards: [] };
  }
}
```

### 3. Role-Based Access Control

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { RoleGuard } from '@common/guards/role.guard';
import { RequireAdmin, RequireModerator } from '@common/decorators/role.decorators';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, RoleGuard)
export class AdminController {
  @Post('users/:id/ban')
  @RequireAdmin()
  banUser(@Param('id') userId: string) {
    // Only admins can access
    return { message: 'User banned' };
  }

  @Get('reports')
  @RequireModerator()
  getReports() {
    // Moderators and admins can access
    return { reports: [] };
  }
}
```

### 4. Permission-Based Access Control (ABAC)

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RequireTaskCreate, RequireTaskUpdate } from '@common/decorators/permission.decorators';
import { AbacAction, AbacResource } from '@common/enums/auth.enum';
import { RequirePermissions } from '@common/decorators/permission.decorators';

@Controller('tasks')
@UseGuards(FirebaseAuthGuard, PermissionGuard)
export class TaskController {
  @Post()
  @RequireTaskCreate()  // Shorthand
  createTask(@Body() createTaskDto: CreateTaskDto) {
    // User must have create:task permission
    return { taskId: '...' };
  }

  @Patch(':id')
  @RequireTaskUpdate()
  updateTask(@Param('id') taskId: string, @Body() updateTaskDto: UpdateTaskDto) {
    // User must have update:task permission
    return { message: 'Task updated' };
  }

  // Custom permission check
  @Post(':taskId/comment')
  @RequirePermissions(
    [AbacAction.READ, AbacResource.TASK],
    [AbacAction.CREATE, AbacResource.COMMENT]
  )
  addComment(@Param('taskId') taskId: string) {
    // User must have both read:task AND create:comment permissions
    return { commentId: '...' };
  }
}
```

### 5. Extracting User Information

```typescript
import { 
  User,      // Full user context
  UserId,    // Just the user ID
  UserEmail, // Just the email
  UserRoles, // Array of roles
  FirebaseToken  // Full decoded Firebase token
} from '@common/decorators/user.decorators';
import { IAuthorizationContext, IFirebaseDecodedToken } from '@common/interfaces/auth.interface';

@Controller('profile')
export class ProfileController {
  @Get()
  @UseGuards(FirebaseAuthGuard)
  getProfile(
    @User() user: IAuthorizationContext,
    @UserId() userId: string,
    @UserEmail() email: string,
    @UserRoles() roles: string[],
    @FirebaseToken() token: IFirebaseDecodedToken
  ) {
    return {
      userId,
      email,
      roles,
      allUserContext: user,
      firebaseToken: token,
    };
  }
}
```

### 6. Custom Role Management

```typescript
import { Injectable } from '@nestjs/common';
import { CustomClaimsService } from '@common/services/custom-claims.service';

@Injectable()
export class UserService {
  constructor(private customClaimsService: CustomClaimsService) {}

  async promoteUserToModerator(userId: string) {
    // Update custom claims with new role
    await this.customClaimsService.updateCustomClaims(userId, {
      role: 'moderator',
      roles: ['moderator', 'user'],
      updatedAt: Date.now(),
    });
  }

  async resetUserPermissions(userId: string) {
    // Clear all custom claims
    await this.customClaimsService.clearCustomClaims(userId);
  }
}
```

### 7. Programmatic Permission Checks

```typescript
import { Injectable } from '@nestjs/common';
import { AuthorizationService } from '@common/services/authorization.service';
import { AbacAction, AbacResource } from '@common/enums/auth.enum';
import { IAuthorizationContext } from '@common/interfaces/auth.interface';

@Injectable()
export class BoardService {
  constructor(private authorizationService: AuthorizationService) {}

  canUserEditBoard(user: IAuthorizationContext, boardId: string): boolean {
    return this.authorizationService.checkPermission(
      user,
      AbacAction.UPDATE,
      AbacResource.BOARD,
      { boardId, boardAdmin: true }  // Resource context
    );
  }

  canUserManageTeam(user: IAuthorizationContext, teamId: string): boolean {
    return this.authorizationService.checkAnyPermission(
      user,
      [
        [AbacAction.MANAGE, AbacResource.TEAM],
        [AbacAction.MANAGE, '*'],  // Admin can manage everything
      ],
      { teamId, teamAdmin: true }
    );
  }
}
```

## Best Practices

### 1. Always Verify Tokens on Protected Routes

```typescript
@UseGuards(FirebaseAuthGuard)  // Always use this
@Get('/protected')
protectedRoute(@User() user: IAuthorizationContext) {
  // User is now verified
}
```

### 2. Use Custom Claims for Performance

Store role and commonly-needed attributes in Firebase custom claims. This avoids database lookups:

```typescript
// When user role changes
await customClaimsService.setCustomClaims(userId, {
  role: 'moderator',
  roles: ['moderator', 'user'],
  attributes: {
    teamId: 'team123',
    teamAdmin: true,
  },
  updatedAt: Date.now(),
});

// No database hit needed - info is in JWT
```

### 3. Synchronize Claims on Critical Changes

Update custom claims whenever user roles or permissions change:

```typescript
async updateUserRole(userId: string, newRole: string) {
  // Update database
  await this.userRepository.updateRole(userId, newRole);
  
  // Sync Firebase custom claims
  const customClaims = this.customClaimsService.buildCustomClaims(userId, newRole);
  await this.customClaimsService.setCustomClaims(userId, customClaims);
}
```

### 4. Handle Token Expiration Gracefully

Implement token refresh logic on the client:

```typescript
// Client-side example (JavaScript)
if (tokenExpired) {
  const response = await fetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: stored_refresh_token })
  });
  const { data } = await response.json();
  localStorage.setItem('idToken', data.idToken);
}
```

### 5. Log Security Events

```typescript
// In your services
private logger = new Logger(MyService.name);

async sensitiveOperation(user: IAuthorizationContext, action: string) {
  this.logger.log(`User ${user.userId} performed action: ${action}`);
  // ... operation ...
}

// On denial
this.logger.warn(`User ${user.userId} denied access to ${action}:${resource}`);
```

### 6. Validate Permission Conditions Carefully

Be explicit about ABAC condition matching:

```typescript
// Bad: Too permissive
checkPermission(user, 'read', 'board');

// Good: Include context
checkPermission(user, 'read', 'board', {
  boardId: requestedBoardId,
  boardMember: isBoardMember
});
```

### 7. Regularly Refresh Custom Claims

Implement a periodic sync of custom claims to ensure data consistency:

```typescript
// In your scheduled service
@Cron('0 0 * * *')  // Daily
async syncCustomClaims() {
  const allUsers = await this.userRepository.findAll();
  
  for (const user of allUsers) {
    const currentClaims = await this.customClaimsService.getCustomClaims(user.firebaseUid);
    
    if (this.customClaimsService.isCustomClaimsStale(currentClaims)) {
      // Rebuild claims from database
      const claims = this.buildCustomClaimsFromDatabase(user);
      await this.customClaimsService.setCustomClaims(user.firebaseUid, claims);
    }
  }
}
```

## Performance Optimization

### 1. Custom Claims Caching Strategy

Firebase tokens include custom claims. This means:
- ✅ No database hit for authorization checks
- ✅ Fast permission verification
- ❌ Claims are stale until token expires/refreshes

**Implementation:**
```typescript
// Claims expire with the token (usually 1 hour)
// Server restart triggers re-sync of all active users
// Role changes immediately update claims
// Admin can manually refresh a user's claims
```

### 2. Token Verification Caching

```typescript
// Firebase caches verification results
// Verifying the same token multiple times is fast
// Custom claims are decoded once per request

// Bad: Verify token multiple times
const token1 = await firebaseAdminService.verifyIdToken(idToken);
const token2 = await firebaseAdminService.verifyIdToken(idToken);

// Good: Verify once, attach to request
@UseGuards(FirebaseAuthGuard)  // Verifies once here
async route(@FirebaseToken() token: IFirebaseDecodedToken) {
  // Use token directly, don't verify again
}
```

### 3. ABAC Rule Evaluation Optimization

```typescript
// Built-in roles are pre-compiled (not from database)
// Only applicable rules are evaluated
// Short-circuit evaluation on first match

private getApplicableRules(roles: string[]): IABAC[] {
  // O(n) where n = number of roles (usually 1-3)
  // Returns pre-compiled rules
  const rules: IABAC[] = [];
  for (const role of roles) {
    const roleDefinition = this.builtInRoles.get(role);
    if (roleDefinition?.active) {
      rules.push(...roleDefinition.abacRules);
    }
  }
  return rules;
}
```

### 4. Condition Evaluation Optimization

```typescript
// Conditions are only evaluated if rule action/resource matches
// Template variables are resolved once
// Operators use short-circuit logic

if (userAttributeValue === resolvedExpectedValue) {
  continue;  // Match found, skip operator evaluation
}
```

### 5. Minimize Custom Claims Size

Firebase has practical limits on custom claims size:

```typescript
// Good: Store minimal data
{
  role: 'moderator',
  roles: ['moderator', 'user'],
  attributes: {
    teamAdmin: true,
    teamId: 'team123'
  }
}

// Bad: Store full objects or arrays
{
  role: 'moderator',
  allPermissionRules: [...1000 rules...],  // Too large!
  userProfile: { ...full user object... }  // Too large!
}
```

### Recommended Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Login with email/password
       │ (Firebase REST API)
       ↓
┌─────────────────────────────┐
│   Firebase REST API          │
│   - Signup                   │
│   - Sign in                  │
│   - Refresh token            │
│   - Reset password           │
└──────┬──────────────────────┘
       │ 2. Receive idToken + refreshToken
       │ (Store in client)
       ↓
┌─────────────────────────────┐
│   Your API Server            │
│                              │
│   Protected Routes:          │
│   ├─ FirebaseAuthGuard       │
│   │  (Verify token)          │
│   │  (Check custom claims)   │
│   ├─ RoleGuard/              │
│   │  PermissionGuard         │
│   │  (Check permissions)     │
│   └─ Business Logic          │
└────────────┬─────────────────┘
             │ 3. Return result
             ↓
        ┌─────────┐
        │ Client  │
        └─────────┘

On Role/Permission Change:
┌──────────────────────────────┐
│  User Role Changes            │
│  (Database Update)            │
└──────────────┬─────────────────┘
               │
               ↓
┌───────────────────────────────┐
│  CustomClaimsService           │
│  updateCustomClaims()          │
└──────────────┬────────────────┘
               │
               ↓
┌────────────────────────────────┐
│  Firebase Admin SDK             │
│  setCustomClaims()              │
│  (Updates user's future tokens) │
└─────────────────────────────────┘
```

## Security Considerations

### 1. Protect Custom Claims Service

Only admin services should set custom claims:

```typescript
// Only in privileged services
@UseGuards(FirebaseAuthGuard, RoleGuard)
@RequireAdmin()
async updateUserRole(...) {
  await customClaimsService.setCustomClaims(...);
}
```

### 2. Validate All User Input

```typescript
// Always validate role against enum
if (!Object.values(BuiltInRole).includes(role)) {
  throw new BadRequestException(`Invalid role: ${role}`);
}
```

### 3. Monitor Authorization Failures

```typescript
this.logger.warn(
  `User ${userId} denied access: ${action}:${resource}`
);
// Set up alerts for suspicious patterns
```

### 4. Keep Firebase Credentials Secure

- Store service account key in environment variables
- Never commit to version control
- Use different keys for different environments
- Rotate keys periodically

### 5. Implement Rate Limiting

```typescript
// Use @nestjs/throttler on auth endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('signin')
signIn(@Body() credentials: IFirebaseAuthRequest) { ... }
```

## Troubleshooting

### Token Verification Fails

**Error:** "Token verification failed"

**Solutions:**
1. Check FIREBASE_SERVICE_ACCOUNT_KEY_JSON is valid JSON
2. Verify token isn't expired
3. Confirm Authorization header format: `Bearer {token}`
4. Check Firebase project ID matches in service account

### Custom Claims Not Appearing in Token

**Solutions:**
1. New tokens need to be generated after setting claims
2. Client must get a fresh token (old cached tokens won't have claims)
3. Check claims size doesn't exceed limits
4. Verify setCustomClaims succeeded (check logs)

### Permission Check Always Fails

**Solutions:**
1. Verify user has required role
2. Check ABAC conditions match resource context
3. Use `AuthorizationService.checkPermission()` directly to debug
4. Enable debug logging in `AuthorizationService`

### Server Startup Issues

**Error:** "FIREBASE_SERVICE_ACCOUNT_KEY_JSON is not valid JSON"

**Solution:**
```bash
# Ensure the environment variable is properly formatted
# If using .env file, quotes may need escaping:
FIREBASE_SERVICE_ACCOUNT_KEY_JSON='{\"type\":\"service_account\", ...}'
```

---

For more information, see:
- [Firebase Documentation](https://firebase.google.com/docs)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [NestJS Custom Decorators](https://docs.nestjs.com/custom-decorators)
