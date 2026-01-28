import { SetMetadata } from '@nestjs/common';
import { AbacAction, AbacResource } from '@common/enums/auth.enum';
import { PERMISSIONS_KEY } from '@common/guards/permission.guard';

/**
 * Decorator to specify required permissions for a route
 * Accepts one or more [action, resource] tuples
 *
 * Usage:
 * @RequirePermissions([AbacAction.READ, AbacResource.BOARD])
 * @RequirePermissions(
 *   [AbacAction.CREATE, AbacResource.TASK],
 *   [AbacAction.READ, AbacResource.BOARD]
 * )
 */
export const RequirePermissions = (
  ...permissions: Array<[AbacAction | string, AbacResource | string]>
) => SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Shorthand decorators for common permissions
 */

// User permissions
export const RequireUserRead = () =>
  RequirePermissions([AbacAction.READ, AbacResource.USER]);
export const RequireUserUpdate = () =>
  RequirePermissions([AbacAction.UPDATE, AbacResource.USER]);
export const RequireUserDelete = () =>
  RequirePermissions([AbacAction.DELETE, AbacResource.USER]);

// Team permissions
export const RequireTeamCreate = () =>
  RequirePermissions([AbacAction.CREATE, AbacResource.TEAM]);
export const RequireTeamRead = () =>
  RequirePermissions([AbacAction.READ, AbacResource.TEAM]);
export const RequireTeamUpdate = () =>
  RequirePermissions([AbacAction.UPDATE, AbacResource.TEAM]);
export const RequireTeamDelete = () =>
  RequirePermissions([AbacAction.DELETE, AbacResource.TEAM]);
export const RequireTeamManage = () =>
  RequirePermissions([AbacAction.MANAGE, AbacResource.TEAM]);

// Board permissions
export const RequireBoardCreate = () =>
  RequirePermissions([AbacAction.CREATE, AbacResource.BOARD]);
export const RequireBoardRead = () =>
  RequirePermissions([AbacAction.READ, AbacResource.BOARD]);
export const RequireBoardUpdate = () =>
  RequirePermissions([AbacAction.UPDATE, AbacResource.BOARD]);
export const RequireBoardDelete = () =>
  RequirePermissions([AbacAction.DELETE, AbacResource.BOARD]);
export const RequireBoardManage = () =>
  RequirePermissions([AbacAction.MANAGE, AbacResource.BOARD]);

// Task permissions
export const RequireTaskCreate = () =>
  RequirePermissions([AbacAction.CREATE, AbacResource.TASK]);
export const RequireTaskRead = () =>
  RequirePermissions([AbacAction.READ, AbacResource.TASK]);
export const RequireTaskUpdate = () =>
  RequirePermissions([AbacAction.UPDATE, AbacResource.TASK]);
export const RequireTaskDelete = () =>
  RequirePermissions([AbacAction.DELETE, AbacResource.TASK]);

// Comment permissions
export const RequireCommentCreate = () =>
  RequirePermissions([AbacAction.CREATE, AbacResource.COMMENT]);
export const RequireCommentRead = () =>
  RequirePermissions([AbacAction.READ, AbacResource.COMMENT]);
export const RequireCommentUpdate = () =>
  RequirePermissions([AbacAction.UPDATE, AbacResource.COMMENT]);
export const RequireCommentDelete = () =>
  RequirePermissions([AbacAction.DELETE, AbacResource.COMMENT]);
