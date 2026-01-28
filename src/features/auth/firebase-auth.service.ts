import { Injectable } from '@nestjs/common';
import {
  IFirebaseAuthRequest,
  IFirebaseAuthResponse,
  IFirebaseSignUpRequest,
  IFirebaseSignUpResponse,
} from '@common/interfaces/auth.interface';

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
/**
 * Firebase REST API Service
 * Handles client-facing authentication operations (login, signup, etc.)
 * Uses Firebase REST API endpoints
 */
@Injectable()
export class FirebaseAuthService {
  private readonly apiKey = process.env.FIREBASE_API_KEY;
  private readonly baseUrl = 'https://identitytoolkit.googleapis.com/v1';

  constructor() {
    if (!this.apiKey) {
      throw new Error('FIREBASE_API_KEY environment variable is not set');
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Sign in with email and password
   * @param request - Login request with email and password
   * @returns Authentication response with tokens
   */

  async signInWithEmail(
    request: IFirebaseAuthRequest,
  ): Promise<IFirebaseAuthResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:signInWithPassword?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: request.email,
            password: request.password,
            returnSecureToken: request.returnSecureToken ?? true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Sign in failed');
      }

      const data = await response.json();
      return {
        idToken: data.idToken,
        email: data.email,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        localId: data.localId,
      };
    } catch (error) {
      throw new Error(
        `Firebase sign in failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Sign up with email and password
   * @param request - Sign up request
   * @returns Authentication response with tokens
   */
  async signUp(
    request: IFirebaseSignUpRequest,
  ): Promise<IFirebaseSignUpResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:signUp?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: request.email,
            password: request.password,
            displayName: request.displayName,
            returnSecureToken: request.returnSecureToken ?? true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Sign up failed');
      }

      const data = await response.json();
      return {
        idToken: data.idToken,
        email: data.email,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        localId: data.localId,
        displayName: data.displayName,
      };
    } catch (error) {
      throw new Error(
        `Firebase sign up failed: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Refresh ID token using refresh token
   * @param refreshToken - Refresh token from previous auth
   * @returns New ID token
   */
  async refreshToken(refreshToken: string): Promise<string> {
    try {
      const response = await fetch(
        'https://securetoken.googleapis.com/v1/token?key=' + this.apiKey,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          }).toString(),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token refresh failed');
      }

      const data = await response.json();
      return data.id_token;
    } catch (error) {
      throw new Error(`Token refresh failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get user account info
   * @param idToken - Firebase ID token
   * @returns User account information
   */
  async getUserInfo(idToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:lookup?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      return data.users ? data.users[0] : null;
    } catch (error) {
      throw new Error(
        `Failed to get user info: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Send email verification link
   * @param idToken - Firebase ID token
   * @returns Response from Firebase
   */
  async sendEmailVerification(idToken: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:sendOobCode?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestType: 'VERIFY_EMAIL',
            idToken,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send email verification');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to send email verification: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Send password reset email
   * @param email - User email
   * @returns Response from Firebase
   */
  async sendPasswordResetEmail(email: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:sendOobCode?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requestType: 'PASSWORD_RESET',
            email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to send password reset email: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Update user profile
   * @param idToken - Firebase ID token
   * @param displayName - Display name
   * @param photoUrl - Photo URL
   * @returns Updated user info
   */
  async updateProfile(
    idToken: string,
    displayName?: string,
    photoUrl?: string,
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:update?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
            displayName,
            photoUrl,
            returnSecureToken: true,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      throw new Error(
        `Failed to update profile: ${this.getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Delete account
   * @param idToken - Firebase ID token
   */
  async deleteAccount(idToken: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/accounts:delete?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken,
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      throw new Error(
        `Failed to delete account: ${this.getErrorMessage(error)}`,
      );
    }
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
