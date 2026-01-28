import {
  AbacAction,
  AbacAttribute,
  AbacResource,
} from '@common/enums/auth.enum';

/**
 * Represents a decoded Firebase token with custom claims
 */
export interface IFirebaseDecodedToken {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  sub: string;
  auth_time: number;
  user_id?: string;
  firebase?: {
    identities: Record<string, any>;
    sign_in_provider: string;
  };
  /**
   * Custom claims added by server
   */
  customClaims?: IFirebaseCustomClaims;
}

/**
 * Custom claims stored in Firebase token for authorization
 * This reduces database hits for authorization checks
 */
export interface IFirebaseCustomClaims {
  // Role-based
  role?: string;
  roles?: string[];

  // ABAC attributes
  attributes?: Record<AbacAttribute, any>;

  // Permission rules
  permissionRules?: IABAC[];

  // Last updated timestamp for cache validation
  updatedAt?: number;
}

/**
 * ABAC Rule - Attribute-Based Access Control
 */
export interface IABAC {
  /**
   * Unique identifier for this rule
   */
  id?: string;

  /**
   * Role that this rule belongs to
   */
  role?: string;

  /**
   * Action to perform (create, read, update, delete, etc.)
   */
  action: AbacAction | string;

  /**
   * Resource type (team, board, task, etc.)
   */
  resource: AbacResource | string;

  /**
   * Conditions that must be met for this rule to apply
   * Condition format: { attribute: value } or { attribute: { operator: value } }
   */
  conditions?: Record<string, any>;

  /**
   * Whether this rule is active
   */
  active?: boolean;

  /**
   * Description of the rule
   */
  description?: string;

  /**
   * Created timestamp
   */
  createdAt?: Date;

  /**
   * Updated timestamp
   */
  updatedAt?: Date;
}

/**
 * Context for authorization checks
 */
export interface IAuthorizationContext {
  userId: string;
  email: string;
  roles: string[];
  attributes: Record<AbacAttribute, any>;
  token: IFirebaseDecodedToken;
}

/**
 * Request with user information attached
 */
export interface IAuthenticatedRequest extends Express.Request {
  user?: IAuthorizationContext;
  firebaseToken?: IFirebaseDecodedToken;
}

/**
 * Role definition
 */
export interface IRoleDefinition {
  id: string;
  name: string;
  description?: string;
  builtIn?: boolean;
  abacRules: IABAC[];
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Login request/response types for Firebase REST API
 */
export interface IFirebaseAuthRequest {
  email: string;
  password: string;
  returnSecureToken?: boolean;
}

export interface IFirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

/**
 * Sign up request/response types
 */
export interface IFirebaseSignUpRequest {
  email: string;
  password: string;
  displayName?: string;
  returnSecureToken?: boolean;
}

export interface IFirebaseSignUpResponse extends IFirebaseAuthResponse {
  displayName?: string;
}
