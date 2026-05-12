import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // 先检查 token 中的角色
    if (user.role === 'admin' || requiredRoles.some((role) => user.role === role)) {
      return true;
    }

    // 如果 token 中的角色不匹配，可能是角色已更新但 token 未刷新
    // 此时从数据库获取最新角色进行校验
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (dbUser) {
      // 同步更新 request 中的 user 对象，防止后续逻辑拿到旧角色
      request.user.role = dbUser.role;
      
      // admin 拥有最高权限，直接放行所有接口
      if (dbUser.role === 'admin') {
        return true;
      }
      
      if (requiredRoles.some((role) => dbUser.role === role)) {
        return true;
      }
    }

    return false;
  }
}
