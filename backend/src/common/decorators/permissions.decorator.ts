import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Restrict a route to users whose role has ALL of the listed permissions.
 *
 * @example
 * @RequirePermissions('invoice:create', 'client:read')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
