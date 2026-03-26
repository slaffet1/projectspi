import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';

export const CurrentBusiness = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const businessId = request.headers['x-business-id'];

    if (!businessId) {
      throw new BadRequestException('X-Business-Id header is required');
    }

    return parseInt(businessId, 10);
  },
);