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
exports.AddressesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AddressesService = class AddressesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyAddresses(userId) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
    }
    async getDefaultAddress(userId) {
        return this.prisma.address.findFirst({
            where: { userId, isDefault: true },
        });
    }
    async getAddressDetail(userId, id) {
        const address = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!address)
            throw new common_1.NotFoundException('地址不存在');
        return address;
    }
    async createAddress(userId, data) {
        this.validateAddress(data);
        const count = await this.prisma.address.count({ where: { userId } });
        const shouldSetDefault = Boolean(data.isDefault) || count === 0;
        return this.prisma.$transaction(async (tx) => {
            if (shouldSetDefault) {
                await tx.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return tx.address.create({
                data: {
                    userId,
                    name: data.name.trim(),
                    phone: data.phone.trim(),
                    address: data.address.trim(),
                    detail: data.detail.trim(),
                    lat: Number(data.lat),
                    lng: Number(data.lng),
                    isDefault: shouldSetDefault,
                },
            });
        });
    }
    async updateAddress(userId, id, data) {
        this.validateAddress(data);
        const existing = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existing)
            throw new common_1.NotFoundException('地址不存在');
        const shouldSetDefault = Boolean(data.isDefault);
        return this.prisma.$transaction(async (tx) => {
            if (shouldSetDefault) {
                await tx.address.updateMany({
                    where: { userId, isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                });
            }
            return tx.address.update({
                where: { id },
                data: {
                    name: data.name.trim(),
                    phone: data.phone.trim(),
                    address: data.address.trim(),
                    detail: data.detail.trim(),
                    lat: Number(data.lat),
                    lng: Number(data.lng),
                    isDefault: shouldSetDefault ? true : existing.isDefault,
                },
            });
        });
    }
    async setDefaultAddress(userId, id) {
        const existing = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existing)
            throw new common_1.NotFoundException('地址不存在');
        return this.prisma.$transaction(async (tx) => {
            await tx.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
            return tx.address.update({
                where: { id },
                data: { isDefault: true },
            });
        });
    }
    async deleteAddress(userId, id) {
        const existing = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!existing)
            throw new common_1.NotFoundException('地址不存在');
        return this.prisma.$transaction(async (tx) => {
            await tx.address.delete({ where: { id } });
            if (existing.isDefault) {
                const next = await tx.address.findFirst({
                    where: { userId },
                    orderBy: { updatedAt: 'desc' },
                });
                if (next) {
                    await tx.address.update({
                        where: { id: next.id },
                        data: { isDefault: true },
                    });
                }
            }
            return { success: true };
        });
    }
    validateAddress(data) {
        if (!data.name?.trim())
            throw new common_1.BadRequestException('请填写联系人');
        if (!data.phone?.trim())
            throw new common_1.BadRequestException('请填写手机号');
        if (!/^1\d{10}$/.test(data.phone.trim())) {
            throw new common_1.BadRequestException('手机号格式不正确');
        }
        if (!data.address?.trim())
            throw new common_1.BadRequestException('请选择地址');
        if (!data.detail?.trim())
            throw new common_1.BadRequestException('请填写详细地址');
        if (data.lat === undefined || data.lng === undefined) {
            throw new common_1.BadRequestException('地址坐标缺失');
        }
    }
};
exports.AddressesService = AddressesService;
exports.AddressesService = AddressesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AddressesService);
//# sourceMappingURL=addresses.service.js.map