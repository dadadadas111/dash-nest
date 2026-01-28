import { Injectable, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@config/firebase.config';
import { IFirebaseDecodedToken } from '@common/interfaces/auth.interface';

/**
 * Firebase Admin SDK Service
 * Handles server-side operations like token verification, user management, and custom claims
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
@Injectable()
export class FirebaseAdminService {
  private firebaseApp: admin.app.App;
  private auth: admin.auth.Auth;

  constructor(
    @Inject(firebaseConfig.KEY) config: ConfigType<typeof firebaseConfig>,
  ) {
    if (!admin.apps.length) {
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(config.serviceAccountKey as any),
        projectId: config.projectId,
      });
    } else {
      this.firebaseApp = admin.app();
    }

    this.auth = this.firebaseApp.auth();
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Verify and decode Firebase ID token
   * @param idToken - The ID token from client
   * @returns Decoded token with custom claims
   */
  async verifyIdToken(idToken: string): Promise<IFirebaseDecodedToken> {
    try {
      const decodedToken = (await this.auth.verifyIdToken(
        idToken,
      )) as unknown as IFirebaseDecodedToken;
      return decodedToken;
    } catch (error) {
      throw new Error(
        `Token verification failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Verify and decode Firebase session cookie
   * @param sessionCookie - Session cookie string
   * @returns Decoded token with custom claims
   */
  async verifySessionCookie(
    sessionCookie: string,
  ): Promise<IFirebaseDecodedToken> {
    try {
      const decodedToken = (await this.auth.verifySessionCookie(
        sessionCookie,
      )) as unknown as IFirebaseDecodedToken;
      return decodedToken;
    } catch (error) {
      throw new Error(
        `Session cookie verification failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Set custom claims on Firebase user token
   * This is crucial for authorization - claims are included in the token
   * @param uid - Firebase user ID
   * @param customClaims - Custom claims to set
   */
  async setCustomClaims(
    uid: string,
    customClaims: Record<string, any>,
  ): Promise<void> {
    try {
      await this.auth.setCustomUserClaims(uid, customClaims);
    } catch (error) {
      throw new Error(
        `Failed to set custom claims: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Get custom claims for a user
   * @param uid - Firebase user ID
   * @returns User record with custom claims
   */
  async getCustomClaims(uid: string): Promise<Record<string, any> | undefined> {
    try {
      const user = await this.auth.getUser(uid);
      return user.customClaims;
    } catch (error) {
      throw new Error(
        `Failed to get custom claims: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Create a new Firebase user
   * @param email - User email
   * @param password - User password
   * @param displayName - User display name
   * @returns Firebase user record
   */
  async createUser(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });
    } catch (error) {
      throw new Error(`Failed to create user: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get user by UID
   * @param uid - Firebase user ID
   * @returns Firebase user record
   */
  async getUser(uid: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      throw new Error(`Failed to get user: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get user by email
   * @param email - User email
   * @returns Firebase user record
   */
  async getUserByEmail(email: string): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.getUserByEmail(email);
    } catch (error) {
      throw new Error(
        `Failed to get user by email: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete user
   * @param uid - Firebase user ID
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (error) {
      throw new Error(`Failed to delete user: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Update user profile
   * @param uid - Firebase user ID
   * @param updateData - Data to update
   */
  async updateUser(
    uid: string,
    updateData: {
      email?: string;
      password?: string;
      displayName?: string;
      photoURL?: string;
      emailVerified?: boolean;
      disabled?: boolean;
    },
  ): Promise<admin.auth.UserRecord> {
    try {
      return await this.auth.updateUser(uid, updateData);
    } catch (error) {
      throw new Error(`Failed to update user: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Create custom token for testing or server-side auth
   * @param uid - Firebase user ID
   * @param additionalClaims - Additional claims to include
   * @returns Custom token
   */
  async createCustomToken(
    uid: string,
    additionalClaims?: Record<string, any>,
  ): Promise<string> {
    try {
      return await this.auth.createCustomToken(uid, additionalClaims);
    } catch (error) {
      throw new Error(
        `Failed to create custom token: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Generate email verification link
   * @param email - User email
   * @returns Verification link
   */
  async generateEmailVerificationLink(email: string): Promise<string> {
    try {
      return await this.auth.generateEmailVerificationLink(email);
    } catch (error) {
      throw new Error(
        `Failed to generate email verification link: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Generate password reset link
   * @param email - User email
   * @returns Password reset link
   */
  async generatePasswordResetLink(email: string): Promise<string> {
    try {
      return await this.auth.generatePasswordResetLink(email);
    } catch (error) {
      throw new Error(
        `Failed to generate password reset link: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Get Firebase app instance
   */
  getApp(): admin.app.App {
    return this.firebaseApp;
  }

  /**
   * Get Firebase auth instance
   */
  getAuth(): admin.auth.Auth {
    return this.auth;
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
