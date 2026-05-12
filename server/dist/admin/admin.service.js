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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async toggleUserStatus(id, status) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('用户不存在');
        return this.prisma.user.update({
            where: { id },
            data: { status },
        });
    }
    async getOrders(status) {
        return this.prisma.order.findMany({
            where: status ? { status: status } : undefined,
            include: {
                user: { select: { nickname: true, phone: true } },
                merchant: { select: { shopName: true } },
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSettings() {
        const setting = await this.prisma.commissionSetting.findFirst();
        return (setting || {
            productRate: 5.0,
            deliveryRate: 10.0,
            deliveryRules: { baseFee: 5.0 },
        });
    }
    async updateSettings(data) {
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
        }
        else {
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
        const todayGMV = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const newMerchants = await this.prisma.merchant.count({
            where: { createdAt: { gte: today } },
        });
        const newRiders = await this.prisma.rider.count({
            where: { createdAt: { gte: today } },
        });
        const lineChart = {
            xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            series: [10, 25, 30, 45, 50, 80, 100],
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
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map