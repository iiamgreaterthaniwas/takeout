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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReview(userId, orderId, data) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId, status: 'completed' },
            include: { review: true },
        });
        if (!order)
            throw new common_1.BadRequestException('订单不存在或未完成，无法评价');
        if (order.review)
            throw new common_1.BadRequestException('该订单已评价');
        const review = await this.prisma.review.create({
            data: {
                userId,
                merchantId: order.merchantId,
                orderId,
                rating: data.rating,
                content: data.content,
            },
        });
        const allReviews = await this.prisma.review.findMany({
            where: { merchantId: order.merchantId },
        });
        const avgRating = allReviews.reduce((acc, curr) => acc + curr.rating, 0) /
            allReviews.length;
        await this.prisma.merchant.update({
            where: { id: order.merchantId },
            data: { rating: avgRating },
        });
        return review;
    }
    async getMerchantReviews(merchantId) {
        return this.prisma.review.findMany({
            where: { merchantId },
            include: {
                user: { select: { id: true, nickname: true, avatar: true } },
                order: { include: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map