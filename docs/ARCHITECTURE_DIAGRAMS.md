# Firebase Auth Architecture Diagrams

Visual representations of the authentication and authorization system.

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Web/Mobile)                      │
│  - Stores idToken & refreshToken                               │
│  - Sends idToken in Authorization header                       │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ 1. Login with email/password
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│             FIREBASE REST API ENDPOINTS                         │
│  - accounts:signUp                                              │
│  - accounts:signInWithPassword                                 │
│  - securetoken.googleapis.com/v1/token (refresh)              │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ 2. Returns: idToken, refreshToken, uid
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│              YOUR API SERVER (NestJS)                          │
│                                                                  │
│  Protected Routes:                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. FirebaseAuthGuard                                      │   │
│  │    - Extract Bearer token from Authorization header      │   │
│  │    - Verify with Firebase Admin SDK                     │   │
│  │    - Decode JWT and extract custom claims              │   │
│  │    - Attach user context to request.user                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. RoleGuard (Optional)                                  │   │
│  │    - Check if user.roles includes required role         │   │
│  │    - Fast check, no database needed                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. PermissionGuard (Optional)                            │   │
│  │    - Check if user has required ABAC permissions        │   │
│  │    - Evaluate conditions with resource context          │   │
│  │    - No database hit (claims in JWT)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. Route Handler                                         │   │
│  │    - @User() decorator provides user context            │   │
│  │    - Business logic executes                            │   │
│  │    - Optional database queries for additional checks    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────┬────────────────────────────────────────────────────────┘
         │
         │ Returns: 200/403/500
         │
         ↓
    CLIENT APP
```

## Authentication Flow Sequence Diagram

```
User                Firebase REST API      Your API Server        Firebase Admin
  │                      │                      │                    │
  │─── signup ──────────>│                      │                    │
  │  (email, password)   │                      │                    │
  │                      │── create user ──────────────────────────>│
  │                      │<─── user created ─────────────────────────│
  │<── idToken + ────────│                      │                    │
  │    refreshToken      │                      │                    │
  │                      │                      │                    │
  │  Client stores tokens in localStorage       │                    │
  │                      │                      │                    │
  │  Subsequent requests:│                      │                    │
  │─── GET /me ─────────────────────────────────>                   │
  │  (with idToken)      │                      │                    │
  │                      │                      │── verify ────────>│
  │                      │                      │<─── decoded ──────│
  │                      │                      │    token          │
  │<────────────────────────── user data ───────│                    │
```

## Role & Permission Hierarchy

```
System Levels:

┌──────────────────────────────────────────────────────────┐
│ AUTHENTICATION (Identity)                                │
│ - Firebase handles user credentials                     │
│ - Users verified via email/password or social login    │
│ - Result: Authenticated user with UID and email        │
└──────────────┬───────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────┐
│ ROLE ASSIGNMENT (Group-level permissions)               │
│                                                          │
│ BuiltInRoles:                                           │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────┐       │
│ │    ADMIN     │  │  MODERATOR   │  │  USER    │ ...   │
│ │              │  │              │  │          │       │
│ │ - Full access│  │ - Moderate   │  │ - Create │       │
│ │ - Manage all │  │ - Manage some│  │ - Read   │       │
│ │   resources  │  │   resources  │  │ - Limited│       │
│ └──────────────┘  └──────────────┘  └──────────┘       │
└──────────────┬───────────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────────┐
│ ATTRIBUTE-BASED PERMISSIONS (Fine-grained control)      │
│                                                          │
│ Each role maps to ABAC rules:                           │
│                                                          │
│ USER Role:                                              │
│ ┌────────────────────────────────────────────────────┐  │
│ │ action: CREATE, resource: BOARD                    │  │
│ │ conditions: teamMember = true                      │  │
│ │ "Can create boards in teams they're members of"    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ action: UPDATE, resource: TASK                     │  │
│ │ conditions: resourceOwner = true                   │  │
│ │ "Can update own tasks only"                        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ MODERATOR Role:                                         │
│ ┌────────────────────────────────────────────────────┐  │
│ │ action: MANAGE, resource: COMMENT                  │  │
│ │ (no conditions)                                    │  │
│ │ "Can manage all comments"                          │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ADMIN Role:                                             │
│ ┌────────────────────────────────────────────────────┐  │
│ │ action: MANAGE, resource: *                        │  │
│ │ "Can manage everything"                            │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Custom Claims Structure

```
Firebase ID Token:
┌─────────────────────────────────────────────────────────┐
│ Header: { "alg": "RS256", "typ": "JWT" }               │
├─────────────────────────────────────────────────────────┤
│ Payload (includes custom claims):                       │
│ {                                                       │
│   "iss": "https://securetoken.googleapis.com/...",     │
│   "aud": "project-id",                                 │
│   "auth_time": 1234567890,                             │
│   "user_id": "uid-from-firebase",                      │
│   "sub": "uid-from-firebase",                          │
│   "iat": 1234567890,                                   │
│   "exp": 1234571490,  // expires in ~1 hour            │
│                                                        │
│   ┌──── CUSTOM CLAIMS (Set by server) ──────────────┐  │
│   │ "role": "user",                                 │  │
│   │ "roles": ["user", "teamMember"],                │  │
│   │ "attributes": {                                 │  │
│   │   "teamId": "team-123",                         │  │
│   │   "teamMember": true,                           │  │
│   │   "boardAdmin": true,                           │  │
│   │   "isEmailVerified": true                       │  │
│   │ },                                              │  │
│   │ "permissionRules": [                            │  │
│   │   {                                             │  │
│   │     "action": "create",                         │  │
│   │     "resource": "board",                        │  │
│   │     "conditions": { "teamMember": true }        │  │
│   │   },                                            │  │
│   │   ...                                           │  │
│   │ ],                                              │  │
│   │ "updatedAt": 1704356950000                      │  │
│   └─────────────────────────────────────────────────┘  │
│ }                                                       │
├─────────────────────────────────────────────────────────┤
│ Signature: (signed by Firebase)                         │
│ <base64-encoded-signature>                              │
└─────────────────────────────────────────────────────────┘

Benefits:
- Custom claims are embedded in token (no database lookup)
- Claims expire with token (automatic refresh)
- Server can verify claims without Firebase (just decode JWT)
- Claims are immutable once token generated
```

## ABAC Condition Evaluation Flow

```
Permission Check Request
│
├─ User: { userId: "u1", roles: ["user"], attributes: {...} }
├─ Action: "update"
├─ Resource: "task"
└─ Resource Context: { taskId: "t1", resourceOwner: true }
│
↓
AuthorizationService.checkPermission()
│
├─1. Admin bypass?
│   └─ If user.roles includes "admin" → ALLOW
│
├─2. Get applicable rules
│   └─ For each role in user.roles:
│      └─ Get ABAC rules from that role
│
├─3. For each rule:
│   │
│   ├─ Action matches?
│   │  └─ rule.action === "update" or "*" → Continue
│   │
│   ├─ Resource matches?
│   │  └─ rule.resource === "task" or "*" → Continue
│   │
│   └─ Conditions match?
│      │
│      ├─ If no conditions → ALLOW
│      │
│      └─ If conditions exist:
│         │
│         ├─ For each condition:
│         │  │
│         │  ├─ Get value from:
│         │  │  ├─ user.attributes[key], or
│         │  │  ├─ resourceContext[key], or
│         │  │  └─ Resolve template variable (${userId}, etc.)
│         │  │
│         │  └─ Evaluate:
│         │     ├─ Simple equality: value === expectedValue
│         │     └─ Operator: $eq, $in, $gt, $exists, etc.
│         │
│         └─ All conditions pass? → ALLOW
│
↓
Result: ALLOW or DENY
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. USER SIGNUP                                          │
│    └─ Firebase creates user, returns 1-hour token      │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SET CUSTOM CLAIMS                                    │
│    └─ Server sets user's role and permissions          │
│       (Existing tokens unchanged)                      │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ 3. GET NEW TOKEN (Token Refresh or Fresh Login)        │
│    └─ Client requests new token                        │
│       └─ Firebase returns token with new claims       │
│          (Valid for ~1 hour)                          │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ 4. USE TOKEN IN REQUESTS                               │
│    ├─ Client sends: Authorization: Bearer {token}     │
│    ├─ Server verifies token with Firebase             │
│    ├─ Server reads custom claims from token           │
│    ├─ Server checks permissions (no DB hit)           │
│    └─ Route handler executes                          │
└────────────┬────────────────────────────────────────────┘
             │
             ├─ Token still valid? → Continue using
             │
             └─ Token expired? → Refresh token (go to step 3)
                                  if refresh token valid, else re-login
```

## Request Processing Pipeline

```
1. HTTP Request
   ↓
2. Extract Bearer Token
   └─ From: Authorization: Bearer {idToken}
   ↓
3. Verify Token with Firebase
   └─ Signature check
   └─ Expiration check
   └─ Project ID check
   ↓
4. Decode JWT
   ├─ Extract UID
   ├─ Extract email
   ├─ Extract custom claims (role, attributes, rules)
   ↓
5. Create User Context
   ├─ IAuthorizationContext {
   │   userId: string
   │   email: string
   │   roles: string[]
   │   attributes: Record<string, any>
   │   token: IFirebaseDecodedToken
   │ }
   ↓
6. Attach to Request
   └─ request.user = userContext
   └─ request.firebaseToken = decodedToken
   ↓
7. Route Processing
   ├─ Check RoleGuard (if @RequireRoles)
   │  └─ user.roles includes required role?
   │
   ├─ Check PermissionGuard (if @RequirePermissions)
   │  └─ AuthorizationService.checkPermission(user, action, resource)
   │     └─ Returns true/false
   │
   └─ Route Handler
      ├─ @User() decorator available
      ├─ @UserId() decorator available
      ├─ @UserRoles() decorator available
      └─ Custom authorization logic can still run
         └─ if (!canUserEditBoard(user, boardId)) { throw Forbidden }
   ↓
8. Response
   ├─ 200 OK (authorized & succeeded)
   ├─ 403 Forbidden (not authorized)
   ├─ 401 Unauthorized (not authenticated)
   └─ 500 Server Error
```

## Custom Claims Sync Strategy

```
Timeline:

Server Start                Firebase Token Expires
    │                              │
    ├─ Sync all active users'     │
    │  claims from database        │
    │  (ensure consistency)        │
    │                              │
    ├─ User has fresh token        │
    │  with all claims             │
    │                              │
    │  Token valid for ~1 hour     │
    │                              │
    │                              ├─ Client requests refresh
    │                              │
    │                              └─ Firebase issues NEW token
    │                                 with UPDATED claims
    │                                 from server
    │
    ├─ User role changes
    │  (via admin API)
    │
    └─ Server updates Firebase
       custom claims immediately
       └─ Next token will have
          updated claims
       └─ Existing tokens
          remain unchanged until
          they expire

Sync Triggers:
1. Server restart: Sync all active users
2. Role change: Sync that user immediately
3. Admin request: Sync on demand
4. Periodic cron: Daily/weekly full sync (optional)
5. Token refresh: Claims automatically included in new token
```

## Permission Check Performance

```
Time breakdown for a typical permission check:

Extract Bearer Token:              < 0.1ms
├─ String split
└─ No computation

Verify Firebase Token:            1-5ms (cached)
├─ Firebase SDK call (usually cached)
└─ Signature verification (only if not cached)

Decode JWT:                        < 0.1ms
├─ Base64 decode
├─ JSON parse
└─ Extract claims

Create User Context:               < 0.1ms
├─ Object creation
└─ Copy values

RoleGuard Check:                   < 0.05ms
├─ Array.includes() - O(n) where n ≈ 2-3
└─ Fast comparison

PermissionGuard Check:             0.1-0.5ms
├─ Get applicable rules: O(n) roles → O(m) rules
├─ Match action/resource: O(k) rules
├─ Evaluate conditions: O(j) conditions
│  └─ Typical: < 5 conditions, simple operators
└─ Early return on first match

─────────────────────────────
TOTAL: ~1-5ms per permission check
(most time is Firebase verification, cached)

No database round trip needed!
```

## Scalability Characteristics

```
Database Queries Per Request:

Without Custom Claims:
    1. Verify token (Firebase)
    2. Get user from DB
    3. Get user's roles from DB
    4. Get role permissions from DB
    5. Optional: Get resource ownership from DB
    = 4-5 database queries

With Custom Claims (This System):
    1. Verify token (Firebase, cached)
    2. Optional: Get resource ownership from DB
    = 0-1 database queries (95% reduction!)

Memory Usage:
    - Custom claims size: ~1KB typical (Firebase limit ~50KB)
    - User context object: ~500 bytes
    - Rule evaluation: Stack-based, minimal heap

Concurrent Users:
    - No shared state in services
    - Each request is independent
    - Scales with server capacity
    - Firebase handles concurrent auth

Database Load:
    - 95% reduction in DB queries for auth
    - Resources can handle 10x more concurrent users
```

---

For detailed explanation, see [AUTHENTICATION_AUTHORIZATION.md](./AUTHENTICATION_AUTHORIZATION.md)
