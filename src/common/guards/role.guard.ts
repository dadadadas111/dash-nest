import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IAuthenticatedRequest } from '@common/interfaces/auth.interface';

// Metadata key for storing required roles
export const ROLES_KEY = 'roles';

/**
 * Role Guard - RBAC enforcer
 * Checks if user has any of the required roles
 * Simpler than PermissionGuard - just checks roles
 * Use @RequireRoles() decorator to specify required roles
 */
@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator metadata
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();

    // User must be authenticated
    if (!request.user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.some((role) =>
      request.user!.roles.includes(role),
    );

    if (!hasRole) {
      this.logger.warn(
        `User ${request.user.userId} denied access - required roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
