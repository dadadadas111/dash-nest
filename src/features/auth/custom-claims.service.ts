import { Injectable, Logger } from '@nestjs/common';
import { FirebaseAdminService } from '@features/auth/firebase-admin.service';
import {
  IFirebaseCustomClaims,
  IABAC,
} from '@common/interfaces/auth.interface';

/**
 * Custom Claims Manager Service
 * Manages Firebase custom claims which are embedded in JWT tokens
 * This allows authorization checks without hitting the database
 *
 * Custom claims are cached in Firebase tokens and synced when:
 * - User role or permissions change
 * - Server restarts (to ensure data consistency)
 * - Admin manually updates claims
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
@Injectable()
export class CustomClaimsService {
  private readonly logger = new Logger(CustomClaimsService.name);

  constructor(private firebaseAdminService: FirebaseAdminService) {}

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Build custom claims for a user
   * Combines role and ABAC rules into a single claims object
   * @param userId - Firebase user ID
   * @param role - User's role
   * @param abacRules - Array of ABAC rules
   * @param attributes - User attributes for ABAC
   * @returns Custom claims object
   */
  buildCustomClaims(
    userId: string,
    role: string,
    abacRules?: IABAC[],
    attributes?: Record<string, any>,
  ): IFirebaseCustomClaims {
    const claims: IFirebaseCustomClaims = {
      role,
      roles: [role],
      permissionRules: abacRules || [],
      attributes: attributes || {},
      updatedAt: Date.now(),
    };

    // Validate that claims don't exceed Firebase limits
    // Firebase has a 1MB limit per user, but practical limit is ~1KB for claims
    const claimsSize = JSON.stringify(claims).length;
    if (claimsSize > 50000) {
      // 50KB threshold as a safety margin
      this.logger.warn(
        `Custom claims for user ${userId} are large (${claimsSize} bytes). Consider reducing ABAC rules.`,
      );
    }

    return claims;
  }

  /**
   * Set custom claims for a user in Firebase
   * After setting, new tokens will include these claims
   * Existing tokens remain unchanged until they expire
   * @param userId - Firebase user ID
   * @param customClaims - Custom claims to set
   */
  async setCustomClaims(
    userId: string,
    customClaims: IFirebaseCustomClaims,
  ): Promise<void> {
    try {
      // Firebase only allows plain objects as claims, not nested functions
      const sanitizedClaims = this.sanitizeCustomClaims(customClaims);

      await this.firebaseAdminService.setCustomClaims(userId, sanitizedClaims);
      this.logger.log(`Custom claims set for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to set custom claims for user ${userId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Add or update custom claims
   * Merges new claims with existing ones
   * @param userId - Firebase user ID
   * @param partialClaims - Partial claims to merge
   */
  async updateCustomClaims(
    userId: string,
    partialClaims: Partial<IFirebaseCustomClaims>,
  ): Promise<void> {
    try {
      const existingClaims =
        await this.firebaseAdminService.getCustomClaims(userId);
      const mergedClaims: IFirebaseCustomClaims = {
        ...(existingClaims as IFirebaseCustomClaims),
        ...partialClaims,
        updatedAt: Date.now(),
      };

      await this.setCustomClaims(userId, mergedClaims);
    } catch (error) {
      this.logger.error(
        `Failed to update custom claims for user ${userId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Clear custom claims for a user
   * User will revert to guest role on next token refresh
   * @param userId - Firebase user ID
   */
  async clearCustomClaims(userId: string): Promise<void> {
    try {
      await this.firebaseAdminService.setCustomClaims(userId, {});
      this.logger.log(`Custom claims cleared for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to clear custom claims for user ${userId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get current custom claims for a user
   * @param userId - Firebase user ID
   * @returns Current custom claims
   */
  async getCustomClaims(
    userId: string,
  ): Promise<IFirebaseCustomClaims | undefined> {
    try {
      const claims = await this.firebaseAdminService.getCustomClaims(userId);
      return claims as IFirebaseCustomClaims | undefined;
    } catch (error) {
      this.logger.error(
        `Failed to get custom claims for user ${userId}: ${this.getErrorMessage(error)}`,
      );
      throw error;
    }
  }

  /**
   * Check if custom claims need refresh
   * Claims are stale if they haven't been updated in a configurable period
   * @param claims - Current custom claims
   * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
   * @returns true if claims should be refreshed
   */
  isCustomClaimsStale(
    claims: IFirebaseCustomClaims | undefined,
    maxAgeMs: number = 86400000,
  ): boolean {
    if (!claims || !claims.updatedAt) {
      return true;
    }

    const ageMs = Date.now() - claims.updatedAt;
    return ageMs > maxAgeMs;
  }

  /**
   * Sanitize custom claims to ensure they meet Firebase requirements
   * Removes any functions, circular references, or problematic values
   */
  private sanitizeCustomClaims(
    claims: IFirebaseCustomClaims,
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(claims)) {
      // Skip undefined values
      if (value === undefined) continue;

      // Handle basic types
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        sanitized[key] = value;
        continue;
      }

      // Handle arrays - sanitize each element
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => this.sanitizeValue(item));
        continue;
      }

      // Handle objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
        continue;
      }

      // Skip functions and other problematic types
    }

    return sanitized;
  }

  /**
   * Sanitize a single value
   */
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) return value;
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (typeof value === 'object') {
      return this.sanitizeObject(value);
    }
    return null;
  }

  /**
   * Sanitize object recursively
   */
  private sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;
      sanitized[key] = this.sanitizeValue(value);
    }

    return sanitized;
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
