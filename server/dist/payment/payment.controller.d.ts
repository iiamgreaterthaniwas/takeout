import { PaymentService } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    prepay(req: any, orderId: string): Promise<{
        appId: string;
        timeStamp: string;
        nonceStr: string;
        package: string;
        signType: string;
        paySign: string;
        totalFee: number;
        orderId: number;
    }>;
    mockPaySuccess(req: any, orderId: string): Promise<{
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    wxpayCallback(body: any, headers: any): Promise<{
        message: string;
        success?: undefined;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    triggerProfitSharing(orderId: string): Promise<{
        totalPlatformFee: number;
        merchantIncome: number;
        riderIncome: number;
    }>;
}
