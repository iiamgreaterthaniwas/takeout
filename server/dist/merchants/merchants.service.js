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
exports.MerchantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MerchantsService = class MerchantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyShop(userId) {
        const numericUserId = Number(userId);
        if (isNaN(numericUserId)) {
            throw new common_1.BadRequestException('无效的用户ID');
        }
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId: numericUserId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        return {
            ...merchant,
            minOrder: merchant.minOrder ? Number(merchant.minOrder) : 0,
            deliveryFee: merchant.deliveryFee ? Number(merchant.deliveryFee) : 0,
        };
    }
    async updateMyShop(userId, data) {
        console.log('Updating My Shop, userId:', userId, 'data:', data);
        const numericUserId = Number(userId);
        if (isNaN(numericUserId)) {
            console.error('Invalid userId:', userId);
            throw new common_1.BadRequestException('无效的用户ID');
        }
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId: numericUserId },
        });
        if (!merchant) {
            console.warn('Merchant not found for userId:', numericUserId);
            throw new common_1.BadRequestException('您还不是商户');
        }
        const updateData = {};
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
            if (val !== undefined && val !== null && val !== '' && val !== 'null') {
                if (field === 'minOrder' || field === 'deliveryFee' || field === 'lat' || field === 'lng') {
                    const numVal = Number(val);
                    if (!isNaN(numVal)) {
                        updateData[field] = numVal;
                    }
                }
                else {
                    updateData[field] = val;
                }
            }
        }
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
        }
        catch (error) {
            console.error('Update My Shop Error:', error);
            throw new common_1.BadRequestException('更新店铺信息失败：' + (error.message || '未知错误'));
        }
        ;
    }
    async getTodayStats(userId) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
    async toggleOpen(userId, isOpen) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        return this.prisma.merchant.update({
            where: { id: merchant.id },
            data: { isOpen },
        });
    }
    async getNearbyShops(lat, lng, keyword, category) {
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
        return merchants.map((m) => {
            const distance = Math.random() * 5;
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
    async getShopDetail(id) {
        const merchant = await this.prisma.merchant.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!merchant)
            throw new common_1.BadRequestException('商家不存在');
        if (!['merchant', 'both', 'admin'].includes(merchant.user.role) || merchant.user.status !== 'active') {
            throw new common_1.BadRequestException('该商家已下架或暂停营业');
        }
        const { user, ...merchantData } = merchant;
        return {
            ...merchantData,
            minOrder: Number(merchant.minOrder),
            deliveryFee: Number(merchant.deliveryFee),
        };
    }
};
exports.MerchantsService = MerchantsService;
exports.MerchantsService = MerchantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MerchantsService);
//# sourceMappingURL=merchants.service.js.map