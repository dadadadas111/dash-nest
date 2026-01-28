# Task Management System - Database Schema Design

## Overview
Thiết kế database schema cho hệ thống quản lý task với khả năng mở rộng cao, performance tốt, và support collaboration giữa nhiều users/teams.

## Core Entities

### 1. Users (users)
Quản lý thông tin người dùng và authentication.

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  password: string (hashed, select: false),
  name: string,
  avatar?: string,
  role: enum ['admin', 'user', 'guest'],
  
  // Email verification
  isEmailVerified: boolean,
  emailVerificationToken?: string,
  
  // Password reset
  passwordResetToken?: string,
  passwordResetExpires?: Date,
  
  // Profile
  bio?: string,
  timezone?: string,
  locale?: string,
  
  // Activity tracking
  lastLoginAt?: Date,
  lastActiveAt?: Date,
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- email (unique)
- deletedAt
- lastActiveAt (for activity queries)
```

### 2. Teams (teams)
Tổ chức users thành teams để collaborate.

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string (unique, indexed),
  description?: string,
  avatar?: string,
  
  // Ownership
  ownerId: ObjectId (ref: User, indexed),
  
  // Settings
  settings: {
    isPrivate: boolean,
    allowMemberInvite: boolean,
    defaultBoardVisibility: enum ['private', 'team', 'public']
  },
  
  // Stats (denormalized for performance)
  stats: {
    memberCount: number,
    boardCount: number,
    taskCount: number
  },
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- slug (unique)
- ownerId
- deletedAt
```

### 3. Team Members (team_members)
Many-to-many relationship giữa Users và Teams với roles.

```typescript
{
  _id: ObjectId,
  teamId: ObjectId (ref: Team, indexed),
  userId: ObjectId (ref: User, indexed),
  
  // Role & permissions
  role: enum ['owner', 'admin', 'member', 'viewer'],
  permissions: {
    canCreateBoard: boolean,
    canDeleteBoard: boolean,
    canManageMembers: boolean,
    canManageSettings: boolean
  },
  
  // Invitation tracking
  invitedBy?: ObjectId (ref: User),
  invitedAt?: Date,
  joinedAt: Date,
  
  // Status
  status: enum ['active', 'invited', 'suspended'],
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- teamId + userId (compound, unique)
- userId + status (for user's teams query)
- teamId + status (for team members query)
```

### 4. Boards (boards)
Boards chứa các tasks, có thể thuộc về user hoặc team.

```typescript
{
  _id: ObjectId,
  name: string,
  description?: string,
  color?: string,
  icon?: string,
  
  // Ownership - flexible design
  ownerId: ObjectId (ref: User, indexed),
  teamId?: ObjectId (ref: Team, indexed), // null = personal board
  
  // Visibility
  visibility: enum ['private', 'team', 'public'],
  
  // Board settings
  settings: {
    enableComments: boolean,
    enableAttachments: boolean,
    enableLabels: boolean,
    enableDueDate: boolean,
    defaultTaskStatus: string
  },
  
  // Stats (denormalized)
  stats: {
    taskCount: number,
    completedTaskCount: number,
    memberCount: number
  },
  
  // Ordering
  position: number,
  
  // Archived instead of deleted for recovery
  isArchived: boolean,
  archivedAt?: Date,
  archivedBy?: ObjectId (ref: User),
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- ownerId + isArchived
- teamId + isArchived
- visibility
- position (for ordering)
```

### 5. Board Members (board_members)
Fine-grained permissions cho từng board.

```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  userId: ObjectId (ref: User, indexed),
  
  // Role specific to this board
  role: enum ['owner', 'admin', 'member', 'viewer'],
  
  // Permissions
  canEditBoard: boolean,
  canDeleteBoard: boolean,
  canAddMembers: boolean,
  canCreateTask: boolean,
  canEditTask: boolean,
  canDeleteTask: boolean,
  
  // Activity
  addedBy: ObjectId (ref: User),
  addedAt: Date,
  lastViewedAt?: Date,
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- boardId + userId (compound, unique)
- userId (for user's boards)
- boardId (for board's members)
```

### 6. Lists (lists)
Columns/Lists trong board (TODO, IN PROGRESS, DONE, etc).

```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  
  name: string,
  color?: string,
  
  // Ordering
  position: number,
  
  // Stats
  taskCount: number,
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- boardId + position (for ordered retrieval)
- boardId + deletedAt
```

### 7. Tasks (tasks)
Core entity - individual tasks.

```typescript
{
  _id: ObjectId,
  boardId: ObjectId (ref: Board, indexed),
  listId: ObjectId (ref: List, indexed),
  
  // Basic info
  title: string,
  description?: string,
  
  // Status & priority
  status: enum ['todo', 'in_progress', 'review', 'done', 'blocked'],
  priority: enum ['low', 'medium', 'high', 'urgent'],
  
  // Assignment
  assignees: ObjectId[] (ref: User, indexed),
  createdBy: ObjectId (ref: User, indexed),
  
  // Dates
  dueDate?: Date (indexed),
  startDate?: Date,
  completedAt?: Date,
  
  // Ordering within list
  position: number,
  
  // Labels/Tags
  labels: string[], // ['bug', 'feature', 'urgent']
  
  // Effort estimation
  estimatedHours?: number,
  actualHours?: number,
  
  // Relationships
  parentTaskId?: ObjectId (ref: Task), // For subtasks
  blockedBy?: ObjectId[] (ref: Task), // Dependencies
  
  // Stats (denormalized)
  stats: {
    commentCount: number,
    attachmentCount: number,
    subtaskCount: number,
    checklistProgress: {
      total: number,
      completed: number
    }
  },
  
  // Archived
  isArchived: boolean,
  archivedAt?: Date,
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- boardId + listId + position (for ordered retrieval)
- assignees (for user's tasks)
- dueDate (for deadline queries)
- status + priority (for filtering)
- createdBy
- parentTaskId (for subtasks)
- boardId + status (for board statistics)
```

### 8. Comments (comments)
Comments trên tasks.

```typescript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Task, indexed),
  
  // Content
  content: string,
  
  // Author
  userId: ObjectId (ref: User, indexed),
  
  // Threading (optional)
  parentCommentId?: ObjectId (ref: Comment),
  
  // Edit history
  isEdited: boolean,
  editedAt?: Date,
  
  // Mentions
  mentions: ObjectId[] (ref: User), // @user mentions
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- taskId + createdAt (for chronological retrieval)
- userId (for user's comments)
- parentCommentId (for threaded comments)
```

### 9. Attachments (attachments)
Files đính kèm vào tasks.

```typescript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Task, indexed),
  
  // File info
  fileName: string,
  originalName: string,
  mimeType: string,
  fileSize: number, // bytes
  
  // Storage
  storageType: enum ['local', 's3', 'gcs'],
  storagePath: string,
  url: string,
  
  // Metadata
  uploadedBy: ObjectId (ref: User),
  
  // Image-specific (if image)
  imageMetadata?: {
    width: number,
    height: number,
    thumbnailUrl?: string
  },
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- taskId + createdAt
- uploadedBy
- mimeType (for filtering by type)
```

### 10. Activity Logs (activity_logs)
Audit trail cho tất cả actions trong system.

```typescript
{
  _id: ObjectId,
  
  // Action info
  action: string, // 'task.created', 'task.updated', 'board.deleted', etc.
  entityType: enum ['task', 'board', 'team', 'user', 'comment'],
  entityId: ObjectId,
  
  // Actor
  userId: ObjectId (ref: User, indexed),
  
  // Context
  boardId?: ObjectId (ref: Board, indexed),
  teamId?: ObjectId (ref: Team),
  
  // Changes (for updates)
  changes?: {
    field: string,
    oldValue: any,
    newValue: any
  }[],
  
  // Metadata
  ipAddress?: string,
  userAgent?: string,
  
  // Timestamps
  createdAt: Date (indexed)
}

Indexes:
- entityType + entityId + createdAt (for entity history)
- userId + createdAt (for user activity)
- boardId + createdAt (for board activity)
- action + createdAt (for filtering by action type)
```

### 11. Notifications (notifications)
Real-time notifications cho users.

```typescript
{
  _id: ObjectId,
  
  // Recipient
  userId: ObjectId (ref: User, indexed),
  
  // Notification info
  type: enum ['task_assigned', 'comment_added', 'due_date_approaching', 'mention', 'board_invite'],
  title: string,
  message: string,
  
  // Related entities
  taskId?: ObjectId (ref: Task),
  boardId?: ObjectId (ref: Board),
  commentId?: ObjectId (ref: Comment),
  
  // Actor (who triggered this notification)
  actorId?: ObjectId (ref: User),
  
  // Status
  isRead: boolean (indexed),
  readAt?: Date,
  
  // Delivery
  channels: string[], // ['in_app', 'email', 'push']
  emailSent: boolean,
  
  // Timestamps
  createdAt: Date,
  expiresAt?: Date // Auto-delete old notifications
}

Indexes:
- userId + isRead + createdAt (for unread notifications)
- userId + createdAt (for notification feed)
- expiresAt (for TTL cleanup)
```

### 12. Checklists (checklists)
Checklist items trong task.

```typescript
{
  _id: ObjectId,
  taskId: ObjectId (ref: Task, indexed),
  
  // Item info
  title: string,
  isCompleted: boolean,
  
  // Ordering
  position: number,
  
  // Assignment (optional)
  assignedTo?: ObjectId (ref: User),
  
  // Completion tracking
  completedBy?: ObjectId (ref: User),
  completedAt?: Date,
  
  // Timestamps & soft delete
  createdAt: Date,
  updatedAt: Date,
  deletedAt?: Date
}

Indexes:
- taskId + position
- taskId + isCompleted (for progress calculation)
```

## Design Principles Applied

### 1. **Flexible Ownership Model**
- Boards có thể thuộc về user (personal) hoặc team
- Team members có roles riêng
- Board members có fine-grained permissions

### 2. **Denormalization for Performance**
- Stats fields (taskCount, memberCount) để tránh expensive aggregations
- Trade-off: phải update khi có changes, nhưng read performance tốt hơn nhiều

### 3. **Soft Delete Pattern**
- Tất cả entities có `deletedAt` field
- Cho phép recovery và maintain data integrity
- Queries phải filter `deletedAt: null`

### 4. **Audit Trail**
- Activity logs để track mọi changes
- Useful cho compliance, debugging, và user activity timeline

### 5. **Indexing Strategy**
- Compound indexes cho common query patterns
- Single field indexes cho lookups
- TTL index cho notifications cleanup

### 6. **Scalability Considerations**
- Lists và Tasks có `position` field cho efficient ordering
- Activity logs có thể shard by date
- Attachments có thể move sang separate storage service

### 7. **Real-time Support**
- Notifications system built-in
- Activity logs có thể stream qua WebSocket
- `lastActiveAt` cho presence detection

## Relationships Summary

```
User ──< Team Members >── Team
User ──< Board Members >── Board
User ──< Tasks (assignees)
User ──< Comments
User ──< Attachments (uploaded)
User ──< Activity Logs
User ──< Notifications

Team ──< Boards
Team ──< Team Members

Board ──< Lists
Board ──< Tasks
Board ──< Board Members
Board ──< Activity Logs

List ──< Tasks

Task ──< Comments
Task ──< Attachments
Task ──< Checklists
Task ──< Activity Logs
Task ──< Task (subtasks, parent)
```

## Query Patterns

### Common Queries

```typescript
// 1. Get user's boards (personal + team boards)
db.boards.find({
  $or: [
    { ownerId: userId, teamId: null },
    { teamId: { $in: userTeamIds } }
  ],
  deletedAt: null
})

// 2. Get board with lists and tasks
// Use aggregation pipeline with $lookup and proper indexing

// 3. Get user's assigned tasks with due date
db.tasks.find({
  assignees: userId,
  dueDate: { $lte: nextWeek },
  deletedAt: null
}).sort({ dueDate: 1 })

// 4. Get board activity feed
db.activity_logs.find({
  boardId: boardId
}).sort({ createdAt: -1 }).limit(50)

// 5. Get unread notifications
db.notifications.find({
  userId: userId,
  isRead: false,
  deletedAt: null
}).sort({ createdAt: -1 })
```

## Migration & Seeding Strategy

1. **Users** - Seed admin và test users
2. **Teams** - Seed example teams
3. **Team Members** - Link users to teams
4. **Boards** - Create demo boards
5. **Lists** - Create default lists (TODO, In Progress, Done)
6. **Tasks** - Seed example tasks
7. **Comments, Attachments** - Optional demo data

## Future Enhancements

1. **Custom Fields** - Dynamic fields cho tasks
2. **Webhooks** - External integrations
3. **Templates** - Board và task templates
4. **Time Tracking** - Detailed time logs
5. **Recurring Tasks** - Automated task creation
6. **Workspace** - Higher level organization above teams
7. **Tags/Categories** - Global label management
8. **Calendar View** - Time-based task view
9. **Gantt Chart Data** - Dependencies và timeline
10. **Analytics** - Aggregated statistics và reports

## Performance Optimization Tips

1. Use `.lean()` cho read-only queries
2. Use projection để limit fields returned
3. Implement pagination cho large lists
4. Cache frequently accessed data (Redis)
5. Use aggregation pipeline efficiently
6. Monitor slow queries
7. Consider read replicas cho heavy read workload
8. Archive old data periodically