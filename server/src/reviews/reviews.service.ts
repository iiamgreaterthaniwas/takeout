import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  // 用户：提交评价
  async createReview(
    userId: number,
    orderId: number,
    data: { rating: number; content?: string },
  ) {
    // 1. 检查订单是否属于该用户且已完成
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'completed' },
      include: { review: true },
    });

    if (!order) throw new BadRequestException('订单不存在或未完成，无法评价');
    if (order.review) throw new BadRequestException('该订单已评价');

    // 2. 创建评价
    const review = await this.prisma.review.create({
      data: {
        userId,
        merchantId: order.merchantId,
        orderId,
        rating: data.rating,
        content: data.content,
      },
    });

    // 3. 更新商家的评分（简单实现：直接求平均分）
    const allReviews = await this.prisma.review.findMany({
      where: { merchantId: order.merchantId },
    });

    const avgRating =
      allReviews.reduce((acc, curr) => acc + curr.rating, 0) /
      allReviews.length;

    await this.prisma.merchant.update({
      where: { id: order.merchantId },
      data: { rating: avgRating },
    });

    return review;
  }

  // 获取某个商家的所有评价
  async getMerchantReviews(merchantId: number) {
    return this.prisma.review.findMany({
      where: { merchantId },
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        order: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
