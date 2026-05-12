import { PrismaService } from '../prisma/prisma.service';
export declare class ApplicationsService {
    private prisma;
    constructor(prisma: PrismaService);
    applyMerchant(userId: number, data: {
        shopName: string;
        licenseImg: string;
        address: string;
        contactPhone: string;
    }): Promise<{
        id: number;
        userId: number;
        shopName: string;
        licenseImg: string;
        address: string;
        contactPhone: string;
        status: import(".prisma/client").$Enums.AppStatus;
        rejectReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    applyRider(userId: number, data: {
        realName: string;
        idCard: string;
        idCardImg: string;
        vehicleType: string;
    }): Promise<{
        id: number;
        userId: number;
        realName: string;
        idCard: string;
        idCardImg: string;
        vehicleType: string;
        status: import(".prisma/client").$Enums.AppStatus;
        rejectReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMerchantApplications(): Promise<({
        user: {
            id: number;
            openid: string;
            nickname: string | null;
            avatar: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        userId: number;
        shopName: string;
        licenseImg: string;
        address: string;
        contactPhone: string;
        status: import(".prisma/client").$Enums.AppStatus;
        rejectReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getRiderApplications(): Promise<({
        user: {
            id: number;
            openid: string;
            nickname: string | null;
            avatar: string | null;
            phone: string | null;
            role: import(".prisma/client").$Enums.Role;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: number;
        userId: number;
        realName: string;
        idCard: string;
        idCardImg: string;
        vehicleType: string;
        status: import(".prisma/client").$Enums.AppStatus;
        rejectReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    reviewMerchant(id: number, status: 'approved' | 'rejected', rejectReason?: string): Promise<{
        success: boolean;
    }>;
    reviewRider(id: number, status: 'approved' | 'rejected', rejectReason?: string): Promise<{
        success: boolean;
    }>;
}
