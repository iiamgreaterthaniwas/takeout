import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<{
        id: number;
        openid: string;
        nickname: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    toggleUserStatus(id: string, status: string): Promise<{
        id: number;
        openid: string;
        nickname: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getOrders(status?: string): Promise<({
        user: {
            nickname: string | null;
            phone: string | null;
        };
        merchant: {
            shopName: string;
        };
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
    })[]>;
    getSettings(): Promise<{
        id: number;
        productRate: number;
        deliveryRate: number;
        deliveryRules: import(".prisma/client").Prisma.JsonValue;
        updatedBy: string;
        updatedAt: Date;
    } | {
        productRate: number;
        deliveryRate: number;
        deliveryRules: {
            baseFee: number;
        };
    }>;
    updateSettings(data: any): Promise<{
        id: number;
        productRate: number;
        deliveryRate: number;
        deliveryRules: import(".prisma/client").Prisma.JsonValue;
        updatedBy: string;
        updatedAt: Date;
    }>;
    getDashboardStats(): Promise<{
        stats: {
            todayOrders: number;
            todayGMV: number;
            newMerchants: number;
            newRiders: number;
        };
        lineChart: {
            xAxis: string[];
            series: number[];
        };
        pieChart: {
            name: any;
            value: number;
        }[];
    }>;
}
