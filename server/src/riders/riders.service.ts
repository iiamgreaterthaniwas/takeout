import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DistanceUtil } from '../utils/distance.util';

@Injectable()
export class RidersService {
  constructor(private prisma: PrismaService) {}

  // 骑手：获取个人信息（包含在线状态）
  async getMyProfile(userId: number) {
    const rider = await this.prisma.rider.findFirst({ 
      where: { userId },
      include: { user: { select: { nickname: true, avatar: true } } }
    });
    if (!rider) throw new BadRequestException('您还不是骑手');
    return rider;
  }

  // 骑手：获取当前正在配送的订单
  async getMyActiveOrders(userId: number) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider) throw new BadRequestException('您还不是骑手');

    const orders = await this.prisma.order.findMany({
      where: { 
        riderId: rider.id, 
        status: 'delivering' 
      },
      include: { merchant: true, user: true },
      orderBy: { createdAt: 'asc' },
    });

    // 计算骑手与用户之间的距离
    return orders.map(order => {
      let distanceToUser: number | null = null;
      if (rider.currentLat && rider.currentLng && order.lat && order.lng) {
        distanceToUser = DistanceUtil.calculateDistance(
          rider.currentLat,
          rider.currentLng,
          order.lat,
          order.lng
        );
      }
      return {
        ...order,
        distanceToUser
      };
    });
  }

  // 骑手：切换在线状态
  async toggleOnline(userId: number, isOnline: boolean) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider) throw new BadRequestException('您还不是骑手');

    return this.prisma.rider.update({
      where: { id: rider.id },
      data: { isOnline },
    });
  }

  // 骑手：获取附近待接订单
  async getNearbyOrders(userId: number, lat: number, lng: number) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider || !rider.isOnline) throw new BadRequestException('骑手不在线');

    // 简单实现：获取状态为 ready（已备餐）且未分配骑手的订单
    return this.prisma.order.findMany({
      where: {
        status: 'ready',
        riderId: null,
      },
      include: { merchant: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 骑手：接单
  async acceptOrder(userId: number, orderId: number) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider) throw new BadRequestException('无权操作');

    // 乐观锁：只更新没有分配骑手的单
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, riderId: null, status: 'ready' },
    });

    if (!order) throw new BadRequestException('订单已被抢或状态不正确');

    // 计算预估送达时间
    let estimatedArrival: Date | null = null;
    if (rider.currentLat && rider.currentLng && order.lat && order.lng) {
      const distance = DistanceUtil.calculateDistance(
        rider.currentLat,
        rider.currentLng,
        order.lat,
        order.lng
      );
      
      // 假设平均速度 30 公里/小时
      const avgSpeed = 30;
      const hours = distance / avgSpeed;
      const minutes = Math.round(hours * 60);
      
      // 加上一些缓冲时间（10分钟）
      estimatedArrival = new Date(Date.now() + (minutes + 10) * 60 * 1000);
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        riderId: rider.id,
        status: 'delivering',
        estimatedArrival: estimatedArrival,
      },
    });
  }

  // 骑手：确认送达
  async deliverOrder(userId: number, orderId: number) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider) throw new BadRequestException('无权操作');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, riderId: rider.id, status: 'delivering' },
    });

    if (!order) throw new BadRequestException('订单不存在或状态不正确');

    return this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'delivered' },
      });

      // 更新骑手完成订单数
      await tx.rider.update({
        where: { id: rider.id },
        data: { totalOrders: { increment: 1 } },
      });

      return updatedOrder;
    });
  }

  // 骑手：获取历史接单记录
  async getMyHistory(userId: number) {
    const rider = await this.prisma.rider.findFirst({ where: { userId } });
    if (!rider) throw new BadRequestException('无权操作');

    return this.prisma.order.findMany({
      where: { riderId: rider.id },
      include: { merchant: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // 骑手：获取今日统计数据
  async getTodayStats(userId: number) {
    const rider = await this.prisma.rider.findFirst({
      where: { userId },
    });
    if (!rider) throw new BadRequestException('您还不是骑手');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 今日已完成订单数
    const orderCount = await this.prisma.order.count({
      where: {
        riderId: rider.id,
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'delivered', // 假设送到就是完成
      },
    });

    // 今日收入（这里取订单配送费）
    const orders = await this.prisma.order.findMany({
      where: {
        riderId: rider.id,
        updatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'delivered',
      },
      select: {
        deliveryFee: true,
      },
    });

    const income = orders.reduce((sum, order) => {
      return sum + Number(order.deliveryFee);
    }, 0);

    return {
      orderCount,
      income: Number(income.toFixed(2)),
    };
  }
}
