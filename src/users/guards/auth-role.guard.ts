// auth-roles.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
  } from '@nestjs/common';
  import { Reflector } from '@nestjs/core';
  import { AuthGuard } from '@nestjs/passport';
  import { Role } from '../../roles/roles.enum'; // Assuming you have this enum for roles
  
  @Injectable()
  export class AuthRolesGuard extends AuthGuard('jwt') implements CanActivate {
    constructor(private reflector: Reflector) {
      super();
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const isAuthenticated = await super.canActivate(context);
      if (!isAuthenticated) {
        return false;
      }
  
      const roles = this.reflector.get<Role[]>('roles', context.getHandler());
      if (!roles) {
        return true;
      }
  
      const request = context.switchToHttp().getRequest();
      const user = request.user;
      if (!user || !roles.some((role) => user.roles?.includes(role))) {
        throw new ForbiddenException('Access denied');
      }
  
      return true;
    }
  }
  