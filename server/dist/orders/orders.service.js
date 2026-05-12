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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const distance_util_1 = require("../utils/distance.util");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrder(userId, data) {
        const merchant = await this.prisma.merchant.findUnique({
            where: { id: data.merchantId },
            include: { user: true },
        });
        if (!merchant || !['merchant', 'both', 'admin'].includes(merchant.user.role) || merchant.user.status !== 'active') {
            throw new common_1.BadRequestException('商家已下架或暂停营业，无法下单');
        }
        if (!merchant.isOpen) {
            throw new common_1.BadRequestException('商家休息中，无法下单');
        }
        let totalAmount = 0;
        const orderItems = [];
        for (const item of data.items) {
            const product = await this.prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product ||
                product.status !== 'approved' ||
                product.merchantId !== data.merchantId) {
                throw new common_1.BadRequestException(`商品ID ${item.productId} 无效或未上架`);
            }
            if (product.stock < item.quantity) {
                throw new common_1.BadRequestException(`商品 ${product.name} 库存不足`);
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
        const deliveryFee = 5.0;
        totalAmount += deliveryFee;
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
            await tx.payment.create({
                data: {
                    orderId: order.id,
                    amount: totalAmount,
                    platformFee: 0,
                    status: 'pending'
                }
            });
            for (const item of orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
            }
            return order;
        });
    }
    async getMyOrders(userId) {
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
    async getShopOrders(userId, status) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        const orders = await this.prisma.order.findMany({
            where: {
                merchantId: merchant.id,
                ...(status ? { status: status } : {}),
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
    async acceptOrder(userId, orderId) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('无权操作');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, merchantId: merchant.id, status: 'paid' },
        });
        if (!order)
            throw new common_1.NotFoundException('订单状态不正确或不存在');
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'accepted' },
        });
    }
    async readyOrder(userId, orderId) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('无权操作');
        return this.prisma.order.update({
            where: { id: orderId, merchantId: merchant.id, status: 'accepted' },
            data: { status: 'ready' },
        });
    }
    async getOrderDetail(orderId) {
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
        if (!order)
            return null;
        let distanceToUser = null;
        if (order.rider && order.rider.currentLat && order.rider.currentLng && order.lat && order.lng) {
            distanceToUser = distance_util_1.DistanceUtil.calculateDistance(order.rider.currentLat, order.rider.currentLng, order.lat, order.lng);
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
    async cancelOrder(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId, status: 'pending_payment' },
        });
        if (!order)
            throw new common_1.NotFoundException('订单不存在或不可取消');
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
    async deleteOrder(userId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
                status: { in: ['completed', 'cancelled', 'refunded'] },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('订单不存在或不可删除');
        await this.prisma.$transaction(async (tx) => {
            await tx.orderItem.deleteMany({ where: { orderId } });
            await tx.payment.deleteMany({ where: { orderId } });
            await tx.order.delete({ where: { id: orderId } });
        });
        return { success: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map