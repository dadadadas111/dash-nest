/**
 * Pre-defined permission strings for decorators
 * Format: 'action:resource' or 'action:resource:specific'
 */
export enum Permission {
  // User permissions
  USER_READ = 'read:user',
  USER_UPDATE = 'update:user',
  USER_DELETE = 'delete:user',

  // Team permissions
  TEAM_CREATE = 'create:team',
  TEAM_READ = 'read:team',
  TEAM_UPDATE = 'update:team',
  TEAM_DELETE = 'delete:team',
  TEAM_MANAGE = 'manage:team',
  TEAM_INVITE = 'share:team',

  // Board permissions
  BOARD_CREATE = 'create:board',
  BOARD_READ = 'read:board',
  BOARD_UPDATE = 'update:board',
  BOARD_DELETE = 'delete:board',
  BOARD_MANAGE = 'manage:board',
  BOARD_INVITE = 'share:board',

  // List permissions
  LIST_CREATE = 'create:list',
  LIST_READ = 'read:list',
  LIST_UPDATE = 'update:list',
  LIST_DELETE = 'delete:list',

  // Task permissions
  TASK_CREATE = 'create:task',
  TASK_READ = 'read:task',
  TASK_UPDATE = 'update:task',
  TASK_DELETE = 'delete:task',

  // Comment permissions
  COMMENT_CREATE = 'create:comment',
  COMMENT_READ = 'read:comment',
  COMMENT_UPDATE = 'update:comment',
  COMMENT_DELETE = 'delete:comment',

  // Attachment permissions
  ATTACHMENT_CREATE = 'create:attachment',
  ATTACHMENT_READ = 'read:attachment',
  ATTACHMENT_DELETE = 'delete:attachment',

  // Activity log permissions
  ACTIVITY_LOG_READ = 'read:activityLog',
  ACTIVITY_LOG_EXPORT = 'export:activityLog',

  // Notification permissions
  NOTIFICATION_READ = 'read:notification',
  NOTIFICATION_UPDATE = 'update:notification',
  NOTIFICATION_DELETE = 'delete:notification',
}
