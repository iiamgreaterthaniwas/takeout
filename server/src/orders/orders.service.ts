import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DistanceUtil } from '../utils/distance.util';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // 用户：创建订单
  async createOrder(
    userId: number,
    data: {
      merchantId: number;
      items: { productId: number; quantity: number }[];
      address: string;
      addressDetail: string;
      lat?: number;
      lng?: number;
      remark?: string;
    },
  ) {
    // 检查商家是否正常营业
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: data.merchantId },
      include: { user: true },
    });
    if (!merchant || !['merchant', 'both', 'admin'].includes(merchant.user.role) || merchant.user.status !== 'active') {
      throw new BadRequestException('商家已下架或暂停营业，无法下单');
    }
    if (!merchant.isOpen) {
      throw new BadRequestException('商家休息中，无法下单');
    }

    // 1. 获取商品信息计算总价
    let totalAmount = 0;
    const orderItems: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (
        !product ||
        product.status !== 'approved' ||
        product.merchantId !== data.merchantId
      ) {
        throw new BadRequestException(`商品ID ${item.productId} 无效或未上架`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(`商品 ${product.name} 库存不足`);
      }

      const unitPrice = Number(product.price);
      totalAmount += unitPrice * item.quantity;
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: unitPrice,
      });
    }

    // 2. 计算运费 (这里简单写死，实际应从配置或地图API获取距离计算)
    const deliveryFee = 5.0;
    totalAmount += deliveryFee;

    // 3. 开启事务创建订单和扣减库存
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          merchantId: data.merchantId,
          totalAmount,
          deliveryFee,
          address: data.address,
          addressDetail: data.addressDetail,
          lat: data.lat,
          lng: data.lng,
          remark: data.remark,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // 创建支付记录
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          platformFee: 0,
          status: 'pending'
        }
      });

      // 扣减库存
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });
  }

  // 用户：获取我的订单列表
  async getMyOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        merchant: true,
        items: {
          include: { product: true },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      deliveryFee: Number(order.deliveryFee),
      merchant: order.merchant ? {
        ...order.merchant,
        minOrder: Number(order.merchant.minOrder),
        deliveryFee: Number(order.merchant.deliveryFee),
      } : null,
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        product: item.product ? {
          ...item.product,
          price: Number(item.product.price),
        } : null,
      })),
    }));
  }

  // 商户：获取店铺订单
  async getShopOrders(userId: number, status?: string) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    const orders = await this.prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        ...(status ? { status: status as any } : {}),
      },
      include: { items: true, user: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      deliveryFee: Number(order.deliveryFee),
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
      })),
    }));
  }

  // 商户：接单
  async acceptOrder(userId: number, orderId: number) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('无权操作');

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, merchantId: merchant.id, status: 'paid' },
    });

    if (!order) throw new NotFoundException('订单状态不正确或不存在');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'accepted' },
    });
  }

  // 商户：备餐完成，等待骑手
  async readyOrder(userId: number, orderId: number) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('无权操作');

    return this.prisma.order.update({
      where: { id: orderId, merchantId: merchant.id, status: 'accepted' }, // 简化状态流转，直接从 accepted -> ready
      data: { status: 'ready' },
    });
  }

  // 获取订单详情
  async getOrderDetail(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true },
        },
        merchant: true,
        rider: true,
        review: true,
      },
    });

    if (!order) return null;

    // 计算骑手与用户之间的距离
    let distanceToUser: number | null = null;
    if (order.rider && order.rider.currentLat && order.rider.currentLng && order.lat && order.lng) {
      distanceToUser = DistanceUtil.calculateDistance(
        order.rider.currentLat,
        order.rider.currentLng,
        order.lat,
        order.lng
      );
    }

    return {
      ...order,
      distanceToUser,
      totalAmount: Number(order.totalAmount),
      deliveryFee: Number(order.deliveryFee),
      merchant: order.merchant ? {
        ...order.merchant,
        minOrder: Number(order.merchant.minOrder),
        deliveryFee: Number(order.merchant.deliveryFee),
      } : null,
      items: order.items.map(item => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        product: item.product ? {
          ...item.product,
          price: Number(item.product.price),
        } : null,
      })),
    };
  }

  // 用户：取消订单（仅限待支付状态）
  async cancelOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'pending_payment' },
    });

    if (!order) throw new NotFoundException('订单不存在或不可取消');

    // 恢复库存
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });
    return { success: true };
  }

  // 用户：删除订单（仅限已完成或已取消状态）
  async deleteOrder(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: { in: ['completed', 'cancelled', 'refunded'] },
      },
    });

    if (!order) throw new NotFoundException('订单不存在或不可删除');

    // 由于有关联，可以级联删除或只删除主表（前提是有级联设置）
    // Prisma schema中如果不加 onDelete: Cascade，需要手动删关联
    await this.prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });
      await tx.payment.deleteMany({ where: { orderId } });
      await tx.order.delete({ where: { id: orderId } });
    });
    return { success: true };
  }
}
