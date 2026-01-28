import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import type { IAuthenticatedRequest } from '@common/interfaces/auth.interface';

/**
 * Decorator to extract authenticated user from request
 * Usage: @User() user: IAuthorizationContext
 */
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!request.user) {
      throw new BadRequestException('User not authenticated');
    }

    return request.user;
  },
);

/**
 * Extract user ID from request
 * Usage: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!request.user) {
      throw new BadRequestException('User not authenticated');
    }

    return request.user.userId;
  },
);

/**
 * Extract user email from request
 * Usage: @UserEmail() email: string
 */
export const UserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!request.user) {
      throw new BadRequestException('User not authenticated');
    }

    return request.user.email;
  },
);

/**
 * Extract user roles from request
 * Usage: @UserRoles() roles: string[]
 */
export const UserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!request.user) {
      throw new BadRequestException('User not authenticated');
    }

    return request.user.roles;
  },
);

/**
 * Extract Firebase token from request
 * Usage: @FirebaseToken() token: IFirebaseDecodedToken
 */
export const FirebaseToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IAuthenticatedRequest>();

    if (!request.firebaseToken) {
      throw new BadRequestException('Firebase token not available');
    }

    return request.firebaseToken;
  },
);
