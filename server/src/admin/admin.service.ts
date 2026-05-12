import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // 用户管理
  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserStatus(id: number, status: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');

    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  // 订单管理
  async getOrders(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        user: { select: { nickname: true, phone: true } },
        merchant: { select: { shopName: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 平台设置
  async getSettings() {
    const setting = await this.prisma.commissionSetting.findFirst();
    return (
      setting || {
        productRate: 5.0,
        deliveryRate: 10.0,
        deliveryRules: { baseFee: 5.0 },
      }
    );
  }

  async updateSettings(data: any) {
    const setting = await this.prisma.commissionSetting.findFirst();
    if (setting) {
      return this.prisma.commissionSetting.update({
        where: { id: setting.id },
        data: {
          productRate: data.productRate,
          deliveryRate: data.deliveryRate,
          deliveryRules: { baseFee: data.baseDeliveryFee },
          updatedBy: 'admin',
        },
      });
    } else {
      return this.prisma.commissionSetting.create({
        data: {
          productRate: data.productRate,
          deliveryRate: data.deliveryRate,
          deliveryRules: { baseFee: data.baseDeliveryFee },
          updatedBy: 'admin',
        },
      });
    }
  }

  // 数据看板
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await this.prisma.order.count({
      where: { createdAt: { gte: today } },
    });

    const completedOrders = await this.prisma.order.findMany({
      where: { createdAt: { gte: today }, status: 'completed' },
      select: { totalAmount: true },
    });

    const todayGMV = completedOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const newMerchants = await this.prisma.merchant.count({
      where: { createdAt: { gte: today } },
    });

    const newRiders = await this.prisma.rider.count({
      where: { createdAt: { gte: today } },
    });

    // 简单模拟图表数据
    const lineChart = {
      xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      series: [10, 25, 30, 45, 50, 80, 100], // 实际应按日期聚合查询
    };

    const rolesCount = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });

    const roleMap = {
      user: '普通用户',
      merchant: '商户',
      rider: '骑手',
      both: '商户 & 骑手',
      admin: '管理员',
    };

    const pieChart = Object.keys(roleMap).map((roleKey) => {
      const found = rolesCount.find((rc) => rc.role === roleKey);
      return {
        name: roleMap[roleKey],
        value: found ? found._count._all : 0,
      };
    });

    return {
      stats: {
        todayOrders,
        todayGMV,
        newMerchants,
        newRiders,
      },
      lineChart,
      pieChart,
    };
  }
}
