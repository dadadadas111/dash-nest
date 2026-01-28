import { Injectable, Logger } from '@nestjs/common';
import {
  IABAC,
  IRoleDefinition,
  IAuthorizationContext,
} from '@common/interfaces/auth.interface';
import {
  AbacAction,
  AbacAttribute,
  AbacResource,
  BuiltInRole,
} from '@common/enums/auth.enum';

/**
 * Authorization Service - ABAC/RBAC Implementation
 * Handles permission checks based on Attribute-Based Access Control (ABAC)
 * with Role-Based Access Control (RBAC) as a foundation
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  /**
   * Built-in roles with their default ABAC rules
   * These can be extended with custom claims from Firebase
   */
  private readonly builtInRoles: Map<string, IRoleDefinition> = new Map([
    [
      BuiltInRole.ADMIN,
      {
        id: BuiltInRole.ADMIN,
        name: 'Administrator',
        description: 'Full system access',
        builtIn: true,
        active: true,
        abacRules: [
          {
            action: AbacAction.MANAGE,
            resource: '*', // Wildcard - all resources
            description: 'Admin can manage all resources',
          },
        ],
      },
    ],
    [
      BuiltInRole.MODERATOR,
      {
        id: BuiltInRole.MODERATOR,
        name: 'Moderator',
        description: 'Can moderate content and manage teams',
        builtIn: true,
        active: true,
        abacRules: [
          {
            action: AbacAction.MANAGE,
            resource: AbacResource.TEAM,
            conditions: {
              [AbacAttribute.TEAM_ADMIN]: true,
            },
            description: 'Manage teams they are admin of',
          },
          {
            action: AbacAction.MANAGE,
            resource: AbacResource.BOARD,
            conditions: {
              [AbacAttribute.BOARD_ADMIN]: true,
            },
            description: 'Manage boards they are admin of',
          },
          {
            action: AbacAction.DELETE,
            resource: AbacResource.COMMENT,
            description: 'Moderate comments',
          },
        ],
      },
    ],
    [
      BuiltInRole.USER,
      {
        id: BuiltInRole.USER,
        name: 'User',
        description: 'Standard user permissions',
        builtIn: true,
        active: true,
        abacRules: [
          {
            action: AbacAction.READ,
            resource: AbacResource.USER,
            conditions: {
              [AbacAttribute.USER_ID]: '${userId}', // Own user
            },
            description: 'Read own user profile',
          },
          {
            action: AbacAction.UPDATE,
            resource: AbacResource.USER,
            conditions: {
              [AbacAttribute.USER_ID]: '${userId}',
            },
            description: 'Update own user profile',
          },
          {
            action: AbacAction.CREATE,
            resource: AbacResource.TEAM,
            description: 'Create teams',
          },
          {
            action: AbacAction.CREATE,
            resource: AbacResource.BOARD,
            conditions: {
              [AbacAttribute.TEAM_MEMBER]: true,
            },
            description: 'Create boards in teams they are members of',
          },
          {
            action: AbacAction.READ,
            resource: AbacResource.BOARD,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Read boards they are members of',
          },
          {
            action: AbacAction.CREATE,
            resource: AbacResource.TASK,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Create tasks on boards they are members of',
          },
          {
            action: AbacAction.READ,
            resource: AbacResource.TASK,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Read tasks on boards they are members of',
          },
          {
            action: AbacAction.UPDATE,
            resource: AbacResource.TASK,
            conditions: {
              [AbacAttribute.RESOURCE_OWNER]: true,
            },
            description: 'Update own tasks',
          },
          {
            action: AbacAction.CREATE,
            resource: AbacResource.COMMENT,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Create comments on boards they are members of',
          },
          {
            action: AbacAction.UPDATE,
            resource: AbacResource.COMMENT,
            conditions: {
              [AbacAttribute.RESOURCE_OWNER]: true,
            },
            description: 'Update own comments',
          },
          {
            action: AbacAction.DELETE,
            resource: AbacResource.COMMENT,
            conditions: {
              [AbacAttribute.RESOURCE_OWNER]: true,
            },
            description: 'Delete own comments',
          },
        ],
      },
    ],
    [
      BuiltInRole.GUEST,
      {
        id: BuiltInRole.GUEST,
        name: 'Guest',
        description: 'Read-only limited access',
        builtIn: true,
        active: true,
        abacRules: [
          {
            action: AbacAction.READ,
            resource: AbacResource.BOARD,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Read boards they have access to',
          },
          {
            action: AbacAction.READ,
            resource: AbacResource.TASK,
            conditions: {
              [AbacAttribute.BOARD_MEMBER]: true,
            },
            description: 'Read tasks on boards they have access to',
          },
        ],
      },
    ],
  ]);

  /**
   * Check if user has permission to perform action on resource
   * @param user - Authorization context with roles and attributes
   * @param action - Action to perform (create, read, update, delete, etc.)
   * @param resource - Resource type (team, board, task, etc.)
   * @param resourceContext - Additional context about the resource being accessed
   * @returns true if user has permission, false otherwise
   */
  checkPermission(
    user: IAuthorizationContext,
    action: AbacAction | string,
    resource: AbacResource | string,
    resourceContext?: Record<string, any>,
  ): boolean {
    // Admin bypass
    if (user.roles.includes(BuiltInRole.ADMIN)) {
      this.logger.debug(
        `Admin user ${user.userId} granted access to ${action}:${resource}`,
      );
      return true;
    }

    // Get all applicable rules from user's roles
    const applicableRules = this.getApplicableRules(user.roles);

    // Check if any rule allows the action on resource
    for (const rule of applicableRules) {
      if (this.ruleMatches(rule, action, resource, user, resourceContext)) {
        this.logger.debug(
          `User ${user.userId} granted access to ${action}:${resource} via rule: ${rule.description}`,
        );
        return true;
      }
    }

    this.logger.warn(
      `User ${user.userId} denied access to ${action}:${resource}`,
    );
    return false;
  }

  /**
   * Check multiple permissions at once (OR logic - all must pass)
   * @param user - Authorization context
   * @param permissions - Array of [action, resource] tuples
   * @param resourceContext - Additional context about the resource
   * @returns true if user has ALL permissions
   */
  checkPermissions(
    user: IAuthorizationContext,
    permissions: Array<[AbacAction | string, AbacResource | string]>,
    resourceContext?: Record<string, any>,
  ): boolean {
    return permissions.every(([action, resource]) =>
      this.checkPermission(user, action, resource, resourceContext),
    );
  }

  /**
   * Check if user has any of the given permissions (OR logic)
   * @param user - Authorization context
   * @param permissions - Array of [action, resource] tuples
   * @param resourceContext - Additional context about the resource
   * @returns true if user has ANY permission
   */
  checkAnyPermission(
    user: IAuthorizationContext,
    permissions: Array<[AbacAction | string, AbacResource | string]>,
    resourceContext?: Record<string, any>,
  ): boolean {
    return permissions.some(([action, resource]) =>
      this.checkPermission(user, action, resource, resourceContext),
    );
  }

  /**
   * Get all permission rules applicable to user's roles
   * @param roles - User roles
   * @returns Combined array of all ABAC rules
   */
  private getApplicableRules(roles: string[]): IABAC[] {
    const rules: IABAC[] = [];

    for (const role of roles) {
      const roleDefinition = this.builtInRoles.get(role);
      if (roleDefinition && roleDefinition.active) {
        rules.push(...roleDefinition.abacRules);
      }
    }

    return rules;
  }

  /**
   * Check if a single ABAC rule matches the requested action/resource
   * @param rule - ABAC rule to evaluate
   * @param action - Requested action
   * @param resource - Requested resource
   * @param user - User context for condition evaluation
   * @param resourceContext - Resource context for condition evaluation
   * @returns true if rule allows the action/resource
   */
  private ruleMatches(
    rule: IABAC,
    action: AbacAction | string,
    resource: AbacResource | string,
    user: IAuthorizationContext,
    resourceContext?: Record<string, any>,
  ): boolean {
    // Check if rule applies to this action
    if (rule.action !== '*' && rule.action !== action) {
      return false;
    }

    // Check if rule applies to this resource
    if (rule.resource !== '*' && rule.resource !== resource) {
      return false;
    }

    // If no conditions, rule applies
    if (!rule.conditions) {
      return true;
    }

    // Evaluate conditions
    return this.evaluateConditions(rule.conditions, user, resourceContext);
  }

  /**
   * Evaluate condition expressions against user and resource context
   * Supports:
   * - Simple equality: { attribute: value }
   * - Operators: { attribute: { $eq: value }, { $in: [values] } }
   * - Template variables: ${userId}, ${userEmail}
   * @param conditions - Conditions to evaluate
   * @param user - User authorization context
   * @param resourceContext - Resource context
   * @returns true if all conditions pass
   */
  private evaluateConditions(
    conditions: Record<string, any>,
    user: IAuthorizationContext,
    resourceContext?: Record<string, any>,
  ): boolean {
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const userAttributeValue = user.attributes[key];
      const resourceValue = resourceContext?.[key];

      // Resolve template variables
      const resolvedExpectedValue = this.resolveTemplateVariable(
        expectedValue,
        user,
      );

      // Simple equality check
      if (
        userAttributeValue === resolvedExpectedValue ||
        resourceValue === resolvedExpectedValue
      ) {
        continue;
      }

      // Operator-based checks
      if (typeof expectedValue === 'object' && !Array.isArray(expectedValue)) {
        if (
          this.evaluateOperators(
            expectedValue,
            userAttributeValue,
            resourceValue,
          )
        ) {
          continue;
        }
      }

      // Condition failed
      return false;
    }

    return true;
  }

  /**
   * Evaluate operator-based conditions
   * Supports: $eq, $ne, $in, $nin, $gt, $lt, $gte, $lte, $exists
   */
  private evaluateOperators(
    operators: Record<string, any>,
    userValue?: any,
    resourceValue?: any,
  ): boolean {
    const value = userValue !== undefined ? userValue : resourceValue;

    for (const [op, opValue] of Object.entries(operators)) {
      switch (op) {
        case '$eq':
          if (value !== opValue) return false;
          break;
        case '$ne':
          if (value === opValue) return false;
          break;
        case '$in':
          if (!Array.isArray(opValue) || !opValue.includes(value)) return false;
          break;
        case '$nin':
          if (Array.isArray(opValue) && opValue.includes(value)) return false;
          break;
        case '$gt':
          if (value <= opValue) return false;
          break;
        case '$lt':
          if (value >= opValue) return false;
          break;
        case '$gte':
          if (value < opValue) return false;
          break;
        case '$lte':
          if (value > opValue) return false;
          break;
        case '$exists':
          if (opValue && value === undefined) return false;
          if (!opValue && value !== undefined) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Resolve template variables in conditions
   * Supports: ${userId}, ${userEmail}
   */
  private resolveTemplateVariable(
    value: any,
    user: IAuthorizationContext,
  ): any {
    if (typeof value !== 'string') return value;

    if (value === '${userId}') return user.userId;
    if (value === '${userEmail}') return user.email;

    return value;
  }

  /**
   * Get role definition
   * @param roleId - Role identifier
   * @returns Role definition or undefined
   */
  getRole(roleId: string): IRoleDefinition | undefined {
    return this.builtInRoles.get(roleId);
  }

  /**
   * Get all built-in roles
   * @returns Array of all built-in role definitions
   */
  getAllRoles(): IRoleDefinition[] {
    return Array.from(this.builtInRoles.values());
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
