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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProduct(userId, data) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        return this.prisma.product.create({
            data: {
                merchantId: merchant.id,
                name: data.name,
                price: data.price,
                imageUrl: data.imageUrl,
                description: data.description,
                stock: data.stock,
                category: data.category || '默认分类',
                status: 'pending',
            },
        });
    }
    async getMyProducts(userId) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            return [];
        return this.prisma.product.findMany({
            where: { merchantId: merchant.id },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateProduct(userId, productId, data) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        const product = await this.prisma.product.findFirst({
            where: { id: productId, merchantId: merchant.id },
        });
        if (!product)
            throw new common_1.NotFoundException('商品不存在或无权修改');
        return this.prisma.product.update({
            where: { id: productId },
            data: { ...data, status: 'pending' },
        });
    }
    async deleteProduct(userId, productId) {
        const merchant = await this.prisma.merchant.findFirst({
            where: { userId },
        });
        if (!merchant)
            throw new common_1.BadRequestException('您还不是商户');
        const product = await this.prisma.product.findFirst({
            where: { id: productId, merchantId: merchant.id },
        });
        if (!product)
            throw new common_1.NotFoundException('商品不存在或无权修改');
        return this.prisma.product.delete({
            where: { id: productId },
        });
    }
    async getShopProducts(merchantId) {
        return this.prisma.product.findMany({
            where: { merchantId, status: 'approved' },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getAllProducts(status) {
        return this.prisma.product.findMany({
            where: status ? { status: status } : undefined,
            include: { merchant: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async reviewProduct(id, status) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('商品不存在');
        return this.prisma.product.update({
            where: { id },
            data: { status },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map