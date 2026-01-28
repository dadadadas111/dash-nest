/**
 * Built-in Roles mapping to ABAC permissions
 */
export enum BuiltInRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Attribute types for ABAC (Attribute-Based Access Control)
 */
export enum AbacAttribute {
  // Resource ownership
  RESOURCE_OWNER = 'resourceOwner',
  RESOURCE_ID = 'resourceId',
  RESOURCE_TYPE = 'resourceType',

  // Team-based
  TEAM_MEMBER = 'teamMember',
  TEAM_ADMIN = 'teamAdmin',
  TEAM_ID = 'teamId',

  // Board-based
  BOARD_MEMBER = 'boardMember',
  BOARD_ADMIN = 'boardAdmin',
  BOARD_ID = 'boardId',

  // User attributes
  USER_ID = 'userId',
  USER_EMAIL = 'userEmail',
  IS_EMAIL_VERIFIED = 'isEmailVerified',

  // Custom permissions
  CUSTOM_PERMISSION = 'customPermission',
}

/**
 * Standard ABAC actions/operations
 */
export enum AbacAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage', // Full control
  SHARE = 'share',
  EXPORT = 'export',
}

/**
 * Standard ABAC resources
 */
export enum AbacResource {
  USER = 'user',
  TEAM = 'team',
  BOARD = 'board',
  LIST = 'list',
  TASK = 'task',
  COMMENT = 'comment',
  ATTACHMENT = 'attachment',
  TEAM_MEMBER = 'teamMember',
  BOARD_MEMBER = 'boardMember',
  ACTIVITY_LOG = 'activityLog',
  NOTIFICATION = 'notification',
}
