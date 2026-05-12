import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// 实际环境应使用 wechatpay-node-v3
// import WxPay from 'wechatpay-node-v3';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(private prisma: PrismaService) {}

  // 1. 统一下单获取 prepay_id（模拟）
  async createPrepay(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: 'pending_payment' },
    });

    if (!order) throw new BadRequestException('订单不存在或状态不正确');

    // 将元转换为分（微信支付要求）
    const totalFee = Math.round(Number(order.totalAmount) * 100);

    // 这里模拟调用微信统一下单接口
    const mockPrepayId = `wx_prepay_${Date.now()}`;

    // 创建或更新支付记录
    await this.prisma.payment.upsert({
      where: { orderId },
      create: {
        orderId,
        wxPrepayId: mockPrepayId,
        amount: order.totalAmount,
        platformFee: 0, // 分账时再计算
        status: 'pending',
      },
      update: {
        wxPrepayId: mockPrepayId,
        amount: order.totalAmount,
      },
    });

    // 返回前端需要的支付参数（模拟）
    // 注意：微信小程序的 wx.requestPayment 实际还需要 appId 和其他签名，
    // 但是这里只要确保必填参数不为空即可通过接口层校验，实际环境中这里是真实的签名
    return {
      appId: 'wx_app_id', // 必须有这个字段，哪怕是模拟的
      timeStamp: String(Math.floor(Date.now() / 1000)),
      nonceStr: 'mock_nonce_str',
      package: `prepay_id=${mockPrepayId}`,
      signType: 'RSA',
      paySign: 'mock_pay_sign',
      totalFee: totalFee, // 添加 total_fee 参数
      orderId: order.id,
    };
  }

  // 2. 支付回调 Webhook (模拟)
  async handleCallback(body: any) {
    // 实际项目中这里需要使用微信公钥验签 body
    const { orderId, transactionId } = body;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new BadRequestException('订单不存在');
    }
    if (order.status !== 'pending_payment' && order.status !== 'paid') {
      throw new BadRequestException('订单状态不正确');
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' },
      });

      // 查找或创建支付记录
      const existingPayment = await tx.payment.findUnique({
        where: { orderId },
      });

      if (existingPayment && existingPayment.status === 'paid') {
        return { message: '支付已处理' };
      }

      if (existingPayment) {
        // 更新现有支付记录
        await tx.payment.update({
          where: { orderId },
          data: {
            wxTransactionId: transactionId || `wx_trans_${Date.now()}`,
            status: 'paid',
            paidAt: new Date(),
          },
        });
      } else {
        // 创建新的支付记录
        await tx.payment.create({
          data: {
            orderId,
            amount: order.totalAmount,
            platformFee: 0,
            wxTransactionId: transactionId || `wx_trans_${Date.now()}`,
            status: 'paid',
            paidAt: new Date(),
          },
        });
      }

      this.logger.log(`Order ${orderId} paid successfully.`);
      return { success: true };
    });
  }

  // 3. 模拟触发分账 (通常在订单完成 completed 时调用)
  async profitSharing(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || order.status !== 'completed' || !order.payment) {
      throw new BadRequestException('订单未完成或未支付，无法分账');
    }

    // 假设平台抽成商品 5%，运费 10%
    const productAmount = Number(order.totalAmount) - Number(order.deliveryFee);
    const platformProductFee = productAmount * 0.05;
    const platformDeliveryFee = Number(order.deliveryFee) * 0.1;
    const totalPlatformFee = platformProductFee + platformDeliveryFee;

    const merchantIncome = productAmount - platformProductFee;
    const riderIncome = Number(order.deliveryFee) - platformDeliveryFee;

    // 更新 payment 记录平台抽成
    await this.prisma.payment.update({
      where: { orderId },
      data: {
        platformFee: totalPlatformFee,
        status: 'shared',
      },
    });

    this.logger.log(
      `Order ${orderId} shared: Platform(￥${totalPlatformFee.toFixed(2)}), Merchant(￥${merchantIncome.toFixed(2)}), Rider(￥${riderIncome.toFixed(2)})`,
    );

    return {
      totalPlatformFee,
      merchantIncome,
      riderIncome,
    };
  }
}
