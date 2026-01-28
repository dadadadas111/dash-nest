import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from '@features/auth/authorization.service';
import { IAuthenticatedRequest } from '@common/interfaces/auth.interface';
import { AbacAction, AbacResource } from '@common/enums/auth.enum';

// Metadata key for storing required permissions
export const PERMISSIONS_KEY = 'permissions';

/**
 * Permission Guard - ABAC/RBAC enforcer
 * Checks if user has required permissions for the route
 * Use @RequirePermissions() decorator to specify required permissions
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    private reflector: Reflector,
    private authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator metadata
    const requiredPermissions = this.reflector.get<
      Array<[AbacAction | string, AbacResource | string]>
    >(PERMISSIONS_KEY, context.getHandler());

    // No permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();

    // User must be authenticated
    if (!request.user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract resource context from request params/body if needed
    const resourceContext = await Promise.resolve(
      this.extractResourceContext(request),
    );

    // Check all required permissions
    const hasPermission = this.authorizationService.checkPermissions(
      request.user,
      requiredPermissions,
      resourceContext,
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${request.user.userId} denied access - missing permissions: ${JSON.stringify(requiredPermissions)}`,
      );
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }

  /**
   * Extract resource context from request for condition evaluation
   */

  private extractResourceContext(request: any): Record<string, any> {
    const context: Record<string, any> = {};

    // Add common resource identifiers from request params/body
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (request.params) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.resourceId = (request.params as Record<string, any>).id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.teamId = (request.params as Record<string, any>).teamId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.boardId = (request.params as Record<string, any>).boardId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.listId = (request.params as Record<string, any>).listId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.taskId = (request.params as Record<string, any>).taskId;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (request.body) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.ownerId = (request.body as Record<string, any>).ownerId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      context.createdBy = (request.body as Record<string, any>).createdBy;
    }

    return context;
  }
}
