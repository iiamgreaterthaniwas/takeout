"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    logger = new common_1.Logger(PaymentService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPrepay(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId, status: 'pending_payment' },
        });
        if (!order)
            throw new common_1.BadRequestException('订单不存在或状态不正确');
        const totalFee = Math.round(Number(order.totalAmount) * 100);
        const mockPrepayId = `wx_prepay_${Date.now()}`;
        await this.prisma.payment.upsert({
            where: { orderId },
            create: {
                orderId,
                wxPrepayId: mockPrepayId,
                amount: order.totalAmount,
                platformFee: 0,
                status: 'pending',
            },
            update: {
                wxPrepayId: mockPrepayId,
                amount: order.totalAmount,
            },
        });
        return {
            appId: 'wx_app_id',
            timeStamp: String(Math.floor(Date.now() / 1000)),
            nonceStr: 'mock_nonce_str',
            package: `prepay_id=${mockPrepayId}`,
            signType: 'RSA',
            paySign: 'mock_pay_sign',
            totalFee: totalFee,
            orderId: order.id,
        };
    }
    async handleCallback(body) {
        const { orderId, transactionId } = body;
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.BadRequestException('订单不存在');
        }
        if (order.status !== 'pending_payment' && order.status !== 'paid') {
            throw new common_1.BadRequestException('订单状态不正确');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'paid' },
            });
            const existingPayment = await tx.payment.findUnique({
                where: { orderId },
            });
            if (existingPayment && existingPayment.status === 'paid') {
                return { message: '支付已处理' };
            }
            if (existingPayment) {
                await tx.payment.update({
                    where: { orderId },
                    data: {
                        wxTransactionId: transactionId || `wx_trans_${Date.now()}`,
                        status: 'paid',
                        paidAt: new Date(),
                    },
                });
            }
            else {
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
    async profitSharing(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });
        if (!order || order.status !== 'completed' || !order.payment) {
            throw new common_1.BadRequestException('订单未完成或未支付，无法分账');
        }
        const productAmount = Number(order.totalAmount) - Number(order.deliveryFee);
        const platformProductFee = productAmount * 0.05;
        const platformDeliveryFee = Number(order.deliveryFee) * 0.1;
        const totalPlatformFee = platformProductFee + platformDeliveryFee;
        const merchantIncome = productAmount - platformProductFee;
        const riderIncome = Number(order.deliveryFee) - platformDeliveryFee;
        await this.prisma.payment.update({
            where: { orderId },
            data: {
                platformFee: totalPlatformFee,
                status: 'shared',
            },
        });
        this.logger.log(`Order ${orderId} shared: Platform(￥${totalPlatformFee.toFixed(2)}), Merchant(￥${merchantIncome.toFixed(2)}), Rider(￥${riderIncome.toFixed(2)})`);
        return {
            totalPlatformFee,
            merchantIncome,
            riderIncome,
        };
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map