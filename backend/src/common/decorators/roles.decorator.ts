import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to users who hold one of the given roles
 * inside the active business (resolved from X-Business-Id header).
 *
 * @example
 * @Roles(Role.OWNER, Role.ADMIN)
 * @Patch(':businessId')
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
