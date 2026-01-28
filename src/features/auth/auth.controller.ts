import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type {
  IAuthorizationContext,
  IFirebaseAuthRequest,
  IFirebaseSignUpRequest,
} from '@common/interfaces/auth.interface';
import { FirebaseAuthService } from '@features/auth/firebase-auth.service';
import { FirebaseAdminService } from '@features/auth/firebase-admin.service';
import { CustomClaimsService } from '@features/auth/custom-claims.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { User, UserId } from '@common/decorators/user.decorators';
import { RequireAdmin } from '@common/decorators/role.decorators';
import { BuiltInRole } from '@common/enums/auth.enum';

/**
 * Authentication Controller
 * Handles login, signup, and other auth-related endpoints
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private firebaseAuthService: FirebaseAuthService,
    private firebaseAdminService: FirebaseAdminService,
    private customClaimsService: CustomClaimsService,
  ) {}

  /**
   * Sign up with email and password
   * Creates a new Firebase user and initializes default claims
   */
  @Post('signup')
  @HttpCode(201)
  async signUp(@Body() signUpRequest: IFirebaseSignUpRequest) {
    try {
      // Sign up user via Firebase REST API
      const authResponse = await this.firebaseAuthService.signUp(signUpRequest);

      // Set default claims for new user
      const customClaims = this.customClaimsService.buildCustomClaims(
        authResponse.localId,
        BuiltInRole.USER, // New users get USER role by default
      );

      await this.customClaimsService.setCustomClaims(
        authResponse.localId,
        customClaims,
      );

      this.logger.log(`New user signed up: ${authResponse.email}`);

      return {
        success: true,
        message: 'User signed up successfully',
        data: {
          uid: authResponse.localId,
          email: authResponse.email,
          idToken: authResponse.idToken,
          refreshToken: authResponse.refreshToken,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Sign up failed: ${errorMessage}`);
      throw new BadRequestException(`Sign up failed: ${errorMessage}`);
    }
  }

  /**
   * Sign in with email and password
   */
  @Post('signin')
  @HttpCode(200)
  async signIn(@Body() signInRequest: IFirebaseAuthRequest) {
    try {
      const authResponse =
        await this.firebaseAuthService.signInWithEmail(signInRequest);

      this.logger.log(`User signed in: ${authResponse.email}`);

      return {
        success: true,
        message: 'User signed in successfully',
        data: {
          uid: authResponse.localId,
          email: authResponse.email,
          idToken: authResponse.idToken,
          refreshToken: authResponse.refreshToken,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Sign in failed: ${errorMessage}`);
      throw new BadRequestException(`Sign in failed: ${errorMessage}`);
    }
  }

  /**
   * Refresh ID token
   */
  @Post('refresh')
  @HttpCode(200)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token is required');
      }

      const newIdToken =
        await this.firebaseAuthService.refreshToken(refreshToken);

      return {
        success: true,
        data: {
          idToken: newIdToken,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Token refresh failed: ${errorMessage}`);
      throw new BadRequestException(`Token refresh failed: ${errorMessage}`);
    }
  }

  /**
   * Get current user profile
   * Protected route - requires authentication
   */
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@User() user: IAuthorizationContext) {
    try {
      const userRecord = await this.firebaseAdminService.getUser(user.userId);

      return {
        success: true,
        data: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          photoURL: userRecord.photoURL,
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled,
          roles: user.roles,
          attributes: user.attributes,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to get user profile: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to get user profile: ${errorMessage}`,
      );
    }
  }

  /**
   * Update current user profile
   * Protected route - requires authentication
   */
  @Post('me')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(
    @User() user: IAuthorizationContext,
    @Body() updateData: Record<string, any>,
  ) {
    try {
      const updatedUser = await this.firebaseAdminService.updateUser(
        user.userId,
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          displayName: updateData.displayName,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          photoURL: updateData.photoURL,
        },
      );

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          uid: updatedUser.uid,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to update profile: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to update profile: ${errorMessage}`,
      );
    }
  }

  /**
   * Send email verification link
   */
  @Post('send-verification-email')
  @UseGuards(FirebaseAuthGuard)
  async sendVerificationEmail(@UserId() userId: string) {
    try {
      const userRecord = await this.firebaseAdminService.getUser(userId);
      await this.firebaseAdminService.generateEmailVerificationLink(
        userRecord.email!,
      );

      // In production, you would send this link via email service
      this.logger.log(
        `Email verification link generated for ${userRecord.email}`,
      );

      return {
        success: true,
        message: 'Verification email sent',
        // Note: In production, don't return the link directly
        // data: { verificationLink },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send verification email: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to send verification email: ${errorMessage}`,
      );
    }
  }

  /**
   * Send password reset email
   */
  @Post('send-password-reset-email')
  @HttpCode(200)
  async sendPasswordResetEmail(@Body('email') email: string) {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      await this.firebaseAdminService.generatePasswordResetLink(email);

      // In production, you would send this link via email service
      this.logger.log(`Password reset link generated for ${email}`);

      return {
        success: true,
        message: 'Password reset email sent',
        // Note: In production, don't return the link directly
        // data: { resetLink },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send password reset email: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to send password reset email: ${errorMessage}`,
      );
    }
  }

  /**
   * Admin endpoint to set user role and custom claims
   * This would typically be called after user creation/update in the database
   */
  @Post('users/:userId/role')
  @UseGuards(FirebaseAuthGuard)
  @RequireAdmin()
  async setUserRole(
    @Param('userId') userId: string,
    @Body('role') role: string,
  ) {
    try {
      if (!Object.values(BuiltInRole).includes(role as BuiltInRole)) {
        throw new BadRequestException(`Invalid role: ${role}`);
      }

      const customClaims = this.customClaimsService.buildCustomClaims(
        userId,
        role,
      );
      await this.customClaimsService.setCustomClaims(userId, customClaims);

      this.logger.log(`User ${userId} role set to ${role}`);

      return {
        success: true,
        message: `User role set to ${role}`,
        data: { userId, role },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to set user role: ${errorMessage}`);
      throw new BadRequestException(`Failed to set user role: ${errorMessage}`);
    }
  }

  /**
   * Delete current user account
   */
  @Post('delete-account')
  @UseGuards(FirebaseAuthGuard)
  async deleteAccount(@UserId() userId: string) {
    try {
      await this.firebaseAdminService.deleteUser(userId);

      this.logger.log(`User account deleted: ${userId}`);

      return {
        success: true,
        message: 'Account deleted successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete account: ${errorMessage}`);
      throw new BadRequestException(
        `Failed to delete account: ${errorMessage}`,
      );
    }
  }
}
