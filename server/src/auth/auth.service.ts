import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async wxLogin(code: string, userInfo?: any) {
    // 实际项目中需要调用微信接口获取 openid
    // const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
    // const res = await axios.get(url);
    // const { openid, session_key } = res.data;

    // 模拟微信登录获取到 openid
    // 在开发环境中，由于没配置真实的 AppID 和 Secret，每次 login 产生的 code 都是随机的
    // 这会导致 mock_openid_${code} 每次都不一样，从而被当成新用户创建
    // 为了方便开发测试，我们将所有没有真实 openid 的测试请求都映射到同一个固定用户上
    const openid = `mock_openid_dev_test`;

    let user = await this.prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          openid,
          nickname: userInfo?.nickName || '微信用户',
          avatar: userInfo?.avatarUrl || '',
        },
      });
    } else if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
      // 如果用户已存在，且传了最新的用户信息，则更新它
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          nickname: userInfo.nickName || user.nickname,
          avatar: userInfo.avatarUrl || user.avatar,
        },
      });
    }

    const payload = { sub: user.id, openid: user.openid, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async adminLogin(username: string, password: string) {
    // 这里我们使用一个硬编码的超级管理员，实际项目中需要从数据库比对
    if (username === 'admin' && password === 'admin123') {
      const payload = { sub: 9999, username, role: 'admin' };
      return {
        access_token: this.jwtService.sign(payload),
        user: { id: 9999, username, role: 'admin' },
      };
    }

    // 如果想要从数据库登录：
    // const user = await this.prisma.user.findFirst({ where: { openid: username, role: 'admin' } });
    // if (!user || user.password !== password) throw new UnauthorizedException('用户名或密码错误');

    throw new UnauthorizedException('用户名或密码错误');
  }

  async getProfile(userId: number) {
    if (userId === 9999) {
      return { id: 9999, nickname: '管理员', role: 'admin', avatar: '' };
    }
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
