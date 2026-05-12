import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantsService {
  constructor(private prisma: PrismaService) {}

  // 商户：获取我的店铺信息
  async getMyShop(userId: number) {
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      throw new BadRequestException('无效的用户ID');
    }
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId: numericUserId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');
    
    // 转换 Decimal
    return {
      ...merchant,
      minOrder: merchant.minOrder ? Number(merchant.minOrder) : 0,
      deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : 0,
    };
  }

  // 商户：更新店铺信息
  async updateMyShop(userId: number, data: any) {
    console.log('Updating My Shop, userId:', userId, 'data:', data);
    const numericUserId = Number(userId);
    if (isNaN(numericUserId)) {
      console.error('Invalid userId:', userId);
      throw new BadRequestException('无效的用户ID');
    }

    const merchant = await this.prisma.merchant.findFirst({
      where: { userId: numericUserId },
    });
    if (!merchant) {
      console.warn('Merchant not found for userId:', numericUserId);
      throw new BadRequestException('您还不是商户');
    }

    // 过滤掉不可更新的字段，并确保类型正确
    const updateData: any = {};
    const allowedFields = [
      'shopName',
      'description',
      'logo',
      'address',
      'lat',
      'lng',
      'isOpen',
      'minOrder',
      'deliveryFee',
      'category',
      'phone',
      'licenseImg',
    ];

    for (const field of allowedFields) {
      const val = data[field];
      // 严格检查：必须不是 undefined, 必须不是 null, 必须不是空字符串, 必须不是字符串 "null"
      if (val !== undefined && val !== null && val !== '' && val !== 'null') {
        if (field === 'minOrder' || field === 'deliveryFee' || field === 'lat' || field === 'lng') {
          const numVal = Number(val);
          if (!isNaN(numVal)) {
            updateData[field] = numVal;
          }
        } else {
          updateData[field] = val;
        }
      }
    }

    // 额外校验：如果 lat/lng 为空，且数据库中也是必填项，确保不传递 null
    // 其实上面的过滤已经确保了不会有 null，但如果 Prisma 报错，说明某些字段可能被意外设置了
    console.log('Final Prepared updateData:', JSON.stringify(updateData, null, 2));

    try {
      const updated = await this.prisma.merchant.update({
        where: { id: merchant.id },
        data: updateData,
      });

      console.log('Update success:', updated.id);

      return {
        ...updated,
        minOrder: Number(updated.minOrder),
        deliveryFee: Number(updated.deliveryFee),
      };
    } catch (error) {
      console.error('Update My Shop Error:', error);
      throw new BadRequestException('更新店铺信息失败：' + (error.message || '未知错误'));
    };
  }

  // 商户：获取今日统计数据
  async getTodayStats(userId: number) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 今日订单数（排除已取消的订单）
    const orderCount = await this.prisma.order.count({
      where: {
        merchantId: merchant.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'cancelled',
        },
      },
    });

    // 今日收入（仅统计已完成的订单，排除运费）
    const orders = await this.prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['completed', 'delivered'],
        },
      },
      select: {
        totalAmount: true,
        deliveryFee: true,
      },
    });

    const income = orders.reduce((sum, order) => {
      return sum + (Number(order.totalAmount) - Number(order.deliveryFee));
    }, 0);

    return {
      orderCount,
      income: Number(income.toFixed(2)),
    };
  }

  // 商户：切换营业状态
  async toggleOpen(userId: number, isOpen: boolean) {
    const merchant = await this.prisma.merchant.findFirst({
      where: { userId },
    });
    if (!merchant) throw new BadRequestException('您还不是商户');

    return this.prisma.merchant.update({
      where: { id: merchant.id },
      data: { isOpen },
    });
  }

  // 用户端：获取附近商家列表（营业中）
  async getNearbyShops(
    lat: number,
    lng: number,
    keyword?: string,
    category?: string,
  ) {
    // 获取所有正常营业/休息中的商家（排除被下架或封禁的商家）
    const merchants = await this.prisma.merchant.findMany({
      where: {
        ...(keyword ? { shopName: { contains: keyword } } : {}),
        ...(category ? { category } : {}),
        user: {
          role: { in: ['merchant', 'both', 'admin'] },
          status: 'active',
        },
      },
    });

    return merchants.map((m: any) => {
      const distance = Math.random() * 5; // 模拟距离
      const merchantData = {
        ...m,
        distance: distance.toFixed(1),
        rating: Number(m.rating) || 5.0,
        sales: Number(m.sales) || 0,
        minOrder: Number(m.minOrder) || 0,
        deliveryFee: Number(m.deliveryFee) || 0,
        category: m.category || '综合',
      };

      return merchantData;
    });
  }

  // 用户端：获取商家详情
  async getShopDetail(id: number) {
    const merchant = await this.prisma.merchant.findUnique({ 
      where: { id },
      include: { user: true }
    });
    
    if (!merchant) throw new BadRequestException('商家不存在');
    
    // 检查商家是否已被下架（角色被收回）或账号被封禁
    if (!['merchant', 'both', 'admin'].includes(merchant.user.role) || merchant.user.status !== 'active') {
      throw new BadRequestException('该商家已下架或暂停营业');
    }

    const { user, ...merchantData } = merchant;

    return {
      ...merchantData,
      minOrder: Number(merchant.minOrder),
      deliveryFee: Number(merchant.deliveryFee),
    };
  }
}
