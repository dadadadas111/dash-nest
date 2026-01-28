import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { FirebaseAdminService } from '@features/auth/firebase-admin.service';
import { IAuthenticatedRequest } from '@common/interfaces/auth.interface';

/**
 * Firebase Authentication Guard
 * Verifies Firebase ID token from Authorization header
 * Attaches decoded token and user info to request object
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private firebaseAdminService: FirebaseAdminService) {}

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<IAuthenticatedRequest>();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No authentication token found');
    }

    try {
      const decodedToken = await this.firebaseAdminService.verifyIdToken(token);
      request.firebaseToken = decodedToken;

      // Create authorization context
      request.user = {
        userId: decodedToken.uid,
        email: decodedToken.email,
        roles: decodedToken.customClaims?.roles || [
          decodedToken.customClaims?.role || 'guest',
        ],
        attributes: (decodedToken.customClaims?.attributes || {}) as Record<
          string,
          any
        >,
        token: decodedToken,
      };

      return true;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Token verification failed: ${errorMessage}`);
      throw new UnauthorizedException(
        `Token verification failed: ${errorMessage}`,
      );
    }
  }

  /**
   * Extract Bearer token from Authorization header
   */
  private extractTokenFromHeader(request: any): string | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const authHeader = request.headers?.authorization;
    if (!authHeader) return undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const parts = authHeader.split(' ');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return parts[1];
  }
}
