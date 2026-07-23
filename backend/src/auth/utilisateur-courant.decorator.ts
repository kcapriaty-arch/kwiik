import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UtilisateurCourant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // ce que jwt.strategy.ts a retourné dans validate()
  },
);