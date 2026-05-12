import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async applyMerchant(
    userId: number,
    data: {
      shopName: string;
      licenseImg: string;
      address: string;
      contactPhone: string;
    },
  ) {
    // 检查用户是否已经是商户（即使是 admin，如果已经开过店了也不应该重复申请）
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user && ['merchant', 'both'].includes(user.role)) {
      throw new BadRequestException('您已经是商户了');
    }
    
    // 如果是 admin，进一步检查是否已经在 Merchant 表里有记录
    if (user && user.role === 'admin') {
      const existingMerchant = await this.prisma.merchant.findFirst({
        where: { userId },
      });
      if (existingMerchant) {
        throw new BadRequestException('您已经开设过店铺了');
      }
    }

    // 检查是否已有待审核或已通过的申请
    const existingApp = await this.prisma.merchantApplication.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingApp) {
      throw new BadRequestException('您已提交过商户申请或已通过审核');
    }

    return this.prisma.merchantApplication.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async applyRider(
    userId: number,
    data: {
      realName: string;
      idCard: string;
      idCardImg: string;
      vehicleType: string;
    },
  ) {
    // 检查用户是否已经是骑手
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (user && ['rider', 'both'].includes(user.role)) {
      throw new BadRequestException('您已经是骑手了');
    }
    
    // 如果是 admin，进一步检查是否已经在 Rider 表里有记录
    if (user && user.role === 'admin') {
      const existingRider = await this.prisma.rider.findFirst({
        where: { userId },
      });
      if (existingRider) {
        throw new BadRequestException('您已经是骑手了');
      }
    }

    // 检查是否已有待审核或已通过的申请
    const existingApp = await this.prisma.riderApplication.findFirst({
      where: {
        userId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingApp) {
      throw new BadRequestException('您已提交过骑手申请或已通过审核');
    }

    return this.prisma.riderApplication.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  // 管理端接口
  async getMerchantApplications() {
    return this.prisma.merchantApplication.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRiderApplications() {
    return this.prisma.riderApplication.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewMerchant(
    id: number,
    status: 'approved' | 'rejected',
    rejectReason?: string,
  ) {
    const app = await this.prisma.merchantApplication.findUnique({
      where: { id },
    });
    if (!app) throw new BadRequestException('申请不存在');

    await this.prisma.merchantApplication.update({
      where: { id },
      data: { status, rejectReason },
    });

    if (status === 'approved') {
      // 创建商户记录
      const existingMerchant = await this.prisma.merchant.findFirst({ where: { userId: app.userId } });
      if (!existingMerchant) {
        await this.prisma.merchant.create({
          data: {
            userId: app.userId,
            shopName: app.shopName,
            address: app.address,
            lat: 0, // 默认值，实际应从高德/腾讯地图 API 获取
            lng: 0,
            minOrder: 0,
          },
        });
      }
      // 更新用户角色（但保留 admin 最高权限）
      const user = await this.prisma.user.findUnique({
        where: { id: app.userId },
      });
      if (user && user.role !== 'admin') {
        const newRole = user.role === 'rider' ? 'both' : 'merchant';
        await this.prisma.user.update({
          where: { id: app.userId },
          data: { role: newRole },
        });
      }
    } else if (status === 'rejected') {
      // 如果下架（拒绝），则更新商户的营业状态为关闭，并剥夺角色
      await this.prisma.merchant.updateMany({
        where: { userId: app.userId },
        data: { isOpen: false }
      });
      
      const user = await this.prisma.user.findUnique({
        where: { id: app.userId },
      });
      if (user && user.role !== 'admin') {
        const newRole = user.role === 'both' ? 'rider' : 'user';
        await this.prisma.user.update({
          where: { id: app.userId },
          data: { role: newRole },
        });
      }
    }

    return { success: true };
  }

  async reviewRider(
    id: number,
    status: 'approved' | 'rejected',
    rejectReason?: string,
  ) {
    const app = await this.prisma.riderApplication.findUnique({
      where: { id },
    });
    if (!app) throw new BadRequestException('申请不存在');

    await this.prisma.riderApplication.update({
      where: { id },
      data: { status, rejectReason },
    });

    if (status === 'approved') {
      // 创建骑手记录
      const existingRider = await this.prisma.rider.findFirst({ where: { userId: app.userId } });
      if (!existingRider) {
        await this.prisma.rider.create({
          data: {
            userId: app.userId,
            realName: app.realName,
          },
        });
      }
      // 更新用户角色（但保留 admin 最高权限）
      const user = await this.prisma.user.findUnique({
        where: { id: app.userId },
      });
      if (user && user.role !== 'admin') {
        const newRole = user.role === 'merchant' ? 'both' : 'rider';
        await this.prisma.user.update({
          where: { id: app.userId },
          data: { role: newRole },
        });
      }
    } else if (status === 'rejected') {
      // 如果下架（拒绝），则更新骑手的在线状态为离线，并剥夺角色
      await this.prisma.rider.updateMany({
        where: { userId: app.userId },
        data: { isOnline: false }
      });

      const user = await this.prisma.user.findUnique({
        where: { id: app.userId },
      });
      if (user && user.role !== 'admin') {
        const newRole = user.role === 'both' ? 'merchant' : 'user';
        await this.prisma.user.update({
          where: { id: app.userId },
          data: { role: newRole },
        });
      }
    }

    return { success: true };
  }
}
