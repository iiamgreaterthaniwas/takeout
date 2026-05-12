import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(req: any, orderId: string, data: {
        rating: number;
        content?: string;
    }): Promise<{
        id: number;
        userId: number;
        merchantId: number;
        orderId: number;
        rating: number;
        content: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMerchantReviews(merchantId: string): Promise<({
        user: {
            id: number;
            nickname: string | null;
            avatar: string | null;
        };
        order: {
            items: {
                id: number;
                orderId: number;
                productId: number;
                productName: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: number;
            userId: number;
            merchantId: number;
            riderId: number | null;
            totalAmount: import("@prisma/client/runtime/library").Decimal;
            deliveryFee: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.OrderStatus;
            address: string;
            addressDetail: string;
            lat: number | null;
            lng: number | null;
            estimatedArrival: Date | null;
            remark: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        userId: number;
        merchantId: number;
        orderId: number;
        rating: number;
        content: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
}
