import { ApplicationsService } from './applications.service';
export declare const Roles: (...roles: string[]) => import("@nestjs/common").CustomDecorator<string>;
export declare class ApplicationsController {
    private readonly applicationsService;
    constructor(applicationsService: ApplicationsService);
    applyMerchant(req: any, data: any): Promise<{
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
    applyRider(req: any, data: any): Promise<{
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
    reviewMerchant(id: string, status: 'approved' | 'rejected', rejectReason?: string): Promise<{
        success: boolean;
    }>;
    reviewRider(id: string, status: 'approved' | 'rejected', rejectReason?: string): Promise<{
        success: boolean;
    }>;
}
