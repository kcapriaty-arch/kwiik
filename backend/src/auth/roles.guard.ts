import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

// A utiliser apres JwtAuthGuard (@UseGuards(JwtAuthGuard, RolesGuard)) : verifie
// que le role present dans le JWT fait partie des roles autorises par @Roles(...).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequis = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequis || rolesRequis.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!rolesRequis.includes(user?.role)) {
      throw new ForbiddenException('Acces reserve a un role superieur.');
    }

    return true;
  }
}
