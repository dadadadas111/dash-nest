import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { firebaseConfig } from '@config/firebase.config';
import { FirebaseAdminService } from '@features/auth/firebase-admin.service';
import { FirebaseAuthService } from '@features/auth/firebase-auth.service';
import { AuthorizationService } from '@features/auth/authorization.service';
import { CustomClaimsService } from '@features/auth/custom-claims.service';
import { FirebaseAuthGuard } from '@common/guards/firebase-auth.guard';
import { PermissionGuard } from '@common/guards/permission.guard';
import { RoleGuard } from '@common/guards/role.guard';
import { AuthController } from './auth.controller';

/**
 * Authentication & Authorization Module
 *
 * Provides:
 * - Firebase authentication (REST API + Admin SDK)
 * - ABAC/RBAC authorization
 * - Custom claims management for JWT optimization
 * - Guards and decorators for route protection
 *
 * Usage:
 * Import in your feature modules to get access to all services and guards
 */
@Module({
  imports: [ConfigModule.forFeature(firebaseConfig)],
  controllers: [AuthController],
  providers: [
    FirebaseAdminService,
    FirebaseAuthService,
    AuthorizationService,
    CustomClaimsService,
    FirebaseAuthGuard,
    PermissionGuard,
    RoleGuard,
  ],
  exports: [
    FirebaseAdminService,
    FirebaseAuthService,
    AuthorizationService,
    CustomClaimsService,
    FirebaseAuthGuard,
    PermissionGuard,
    RoleGuard,
  ],
})
export class AuthModule {}
