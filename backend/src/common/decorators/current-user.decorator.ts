import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extracts the authenticated user injected by JwtAuthGuard.
 *
 * @example
 * // full user object
 * @CurrentUser() user: { id: number; email: string }
 *
 * // single field
 * @CurrentUser('id') userId: number
 */
export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field] : user;
  },
);
