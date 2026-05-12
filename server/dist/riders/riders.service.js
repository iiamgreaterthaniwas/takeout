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
exports.RidersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const distance_util_1 = require("../utils/distance.util");
let RidersService = class RidersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(userId) {
        const rider = await this.prisma.rider.findFirst({
            where: { userId },
            include: { user: { select: { nickname: true, avatar: true } } }
        });
        if (!rider)
            throw new common_1.BadRequestException('您还不是骑手');
        return rider;
    }
    async getMyActiveOrders(userId) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider)
            throw new common_1.BadRequestException('您还不是骑手');
        const orders = await this.prisma.order.findMany({
            where: {
                riderId: rider.id,
                status: 'delivering'
            },
            include: { merchant: true, user: true },
            orderBy: { createdAt: 'asc' },
        });
        return orders.map(order => {
            let distanceToUser = null;
            if (rider.currentLat && rider.currentLng && order.lat && order.lng) {
                distanceToUser = distance_util_1.DistanceUtil.calculateDistance(rider.currentLat, rider.currentLng, order.lat, order.lng);
            }
            return {
                ...order,
                distanceToUser
            };
        });
    }
    async toggleOnline(userId, isOnline) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider)
            throw new common_1.BadRequestException('您还不是骑手');
        return this.prisma.rider.update({
            where: { id: rider.id },
            data: { isOnline },
        });
    }
    async getNearbyOrders(userId, lat, lng) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider || !rider.isOnline)
            throw new common_1.BadRequestException('骑手不在线');
        return this.prisma.order.findMany({
            where: {
                status: 'ready',
                riderId: null,
            },
            include: { merchant: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async acceptOrder(userId, orderId) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider)
            throw new common_1.BadRequestException('无权操作');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, riderId: null, status: 'ready' },
        });
        if (!order)
            throw new common_1.BadRequestException('订单已被抢或状态不正确');
        let estimatedArrival = null;
        if (rider.currentLat && rider.currentLng && order.lat && order.lng) {
            const distance = distance_util_1.DistanceUtil.calculateDistance(rider.currentLat, rider.currentLng, order.lat, order.lng);
            const avgSpeed = 30;
            const hours = distance / avgSpeed;
            const minutes = Math.round(hours * 60);
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
    async deliverOrder(userId, orderId) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider)
            throw new common_1.BadRequestException('无权操作');
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, riderId: rider.id, status: 'delivering' },
        });
        if (!order)
            throw new common_1.BadRequestException('订单不存在或状态不正确');
        return this.prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: 'delivered' },
            });
            await tx.rider.update({
                where: { id: rider.id },
                data: { totalOrders: { increment: 1 } },
            });
            return updatedOrder;
        });
    }
    async getMyHistory(userId) {
        const rider = await this.prisma.rider.findFirst({ where: { userId } });
        if (!rider)
            throw new common_1.BadRequestException('无权操作');
        return this.prisma.order.findMany({
            where: { riderId: rider.id },
            include: { merchant: true },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getTodayStats(userId) {
        const rider = await this.prisma.rider.findFirst({
            where: { userId },
        });
        if (!rider)
            throw new common_1.BadRequestException('您还不是骑手');
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const orderCount = await this.prisma.order.count({
            where: {
                riderId: rider.id,
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: 'delivered',
            },
        });
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
};
exports.RidersService = RidersService;
exports.RidersService = RidersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RidersService);
//# sourceMappingURL=riders.service.js.map