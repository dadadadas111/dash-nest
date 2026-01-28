import { SetMetadata } from '@nestjs/common';
import { BuiltInRole } from '@common/enums/auth.enum';
import { ROLES_KEY } from '@common/guards/role.guard';

/**
 * Decorator to specify required roles for a route
 * User must have at least one of the specified roles
 *
 * Usage:
 * @RequireRoles(BuiltInRole.ADMIN)
 * @RequireRoles(BuiltInRole.ADMIN, BuiltInRole.MODERATOR)
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Shorthand decorators for common role checks
 */

export const RequireAdmin = () => RequireRoles(BuiltInRole.ADMIN);
export const RequireModerator = () => RequireRoles(BuiltInRole.MODERATOR);
export const RequireUser = () =>
  RequireRoles(BuiltInRole.USER, BuiltInRole.MODERATOR, BuiltInRole.ADMIN);
export const RequireAuthenticated = () =>
  RequireRoles(
    BuiltInRole.GUEST,
    BuiltInRole.USER,
    BuiltInRole.MODERATOR,
    BuiltInRole.ADMIN,
  );
