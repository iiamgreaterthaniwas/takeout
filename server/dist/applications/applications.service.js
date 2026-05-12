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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ApplicationsService = class ApplicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async applyMerchant(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (user && ['merchant', 'both'].includes(user.role)) {
            throw new common_1.BadRequestException('您已经是商户了');
        }
        if (user && user.role === 'admin') {
            const existingMerchant = await this.prisma.merchant.findFirst({
                where: { userId },
            });
            if (existingMerchant) {
                throw new common_1.BadRequestException('您已经开设过店铺了');
            }
        }
        const existingApp = await this.prisma.merchantApplication.findFirst({
            where: {
                userId,
                status: { in: ['pending', 'approved'] },
            },
        });
        if (existingApp) {
            throw new common_1.BadRequestException('您已提交过商户申请或已通过审核');
        }
        return this.prisma.merchantApplication.create({
            data: {
                userId,
                ...data,
            },
        });
    }
    async applyRider(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (user && ['rider', 'both'].includes(user.role)) {
            throw new common_1.BadRequestException('您已经是骑手了');
        }
        if (user && user.role === 'admin') {
            const existingRider = await this.prisma.rider.findFirst({
                where: { userId },
            });
            if (existingRider) {
                throw new common_1.BadRequestException('您已经是骑手了');
            }
        }
        const existingApp = await this.prisma.riderApplication.findFirst({
            where: {
                userId,
                status: { in: ['pending', 'approved'] },
            },
        });
        if (existingApp) {
            throw new common_1.BadRequestException('您已提交过骑手申请或已通过审核');
        }
        return this.prisma.riderApplication.create({
            data: {
                userId,
                ...data,
            },
        });
    }
    async getMerchantApplications() {
        return this.prisma.merchantApplication.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getRiderApplications() {
        return this.prisma.riderApplication.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async reviewMerchant(id, status, rejectReason) {
        const app = await this.prisma.merchantApplication.findUnique({
            where: { id },
        });
        if (!app)
            throw new common_1.BadRequestException('申请不存在');
        await this.prisma.merchantApplication.update({
            where: { id },
            data: { status, rejectReason },
        });
        if (status === 'approved') {
            const existingMerchant = await this.prisma.merchant.findFirst({ where: { userId: app.userId } });
            if (!existingMerchant) {
                await this.prisma.merchant.create({
                    data: {
                        userId: app.userId,
                        shopName: app.shopName,
                        address: app.address,
                        lat: 0,
                        lng: 0,
                        minOrder: 0,
                    },
                });
            }
            const user = await this.prisma.user.findUnique({
                where: { id: app.userId },
            });
            if (user && user.role !== 'admin') {
                const newRole = user.role === 'rider' ? 'both' : 'merchant';
                await this.prisma.user.update({
                    where: { id: app.userId },
                    data: { role: newRole },
                });
            }
        }
        else if (status === 'rejected') {
            await this.prisma.merchant.updateMany({
                where: { userId: app.userId },
                data: { isOpen: false }
            });
            const user = await this.prisma.user.findUnique({
                where: { id: app.userId },
            });
            if (user && user.role !== 'admin') {
                const newRole = user.role === 'both' ? 'rider' : 'user';
                await this.prisma.user.update({
                    where: { id: app.userId },
                    data: { role: newRole },
                });
            }
        }
        return { success: true };
    }
    async reviewRider(id, status, rejectReason) {
        const app = await this.prisma.riderApplication.findUnique({
            where: { id },
        });
        if (!app)
            throw new common_1.BadRequestException('申请不存在');
        await this.prisma.riderApplication.update({
            where: { id },
            data: { status, rejectReason },
        });
        if (status === 'approved') {
            const existingRider = await this.prisma.rider.findFirst({ where: { userId: app.userId } });
            if (!existingRider) {
                await this.prisma.rider.create({
                    data: {
                        userId: app.userId,
                        realName: app.realName,
                    },
                });
            }
            const user = await this.prisma.user.findUnique({
                where: { id: app.userId },
            });
            if (user && user.role !== 'admin') {
                const newRole = user.role === 'merchant' ? 'both' : 'rider';
                await this.prisma.user.update({
                    where: { id: app.userId },
                    data: { role: newRole },
                });
            }
        }
        else if (status === 'rejected') {
            await this.prisma.rider.updateMany({
                where: { userId: app.userId },
                data: { isOnline: false }
            });
            const user = await this.prisma.user.findUnique({
                where: { id: app.userId },
            });
            if (user && user.role !== 'admin') {
                const newRole = user.role === 'both' ? 'merchant' : 'user';
                await this.prisma.user.update({
                    where: { id: app.userId },
                    data: { role: newRole },
                });
            }
        }
        return { success: true };
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map