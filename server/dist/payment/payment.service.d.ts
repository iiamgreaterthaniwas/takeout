import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createPrepay(userId: number, orderId: number): Promise<{
        appId: string;
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        totalFee: number;
        orderId: number;
    }>;
    handleCallback(body: any): Promise<{
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    profitSharing(orderId: number): Promise<{
        totalPlatformFee: number;
        merchantIncome: number;
        riderIncome: number;
    }>;
}
