import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    wxLogin(code: string, userInfo?: any): Promise<{
        access_token: string;
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
    }>;
    adminLogin(username: string, password: string): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            role: string;
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        openid: string;
        nickname: string | null;
        avatar: string | null;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: number;
        nickname: string;
        role: string;
        avatar: string;
    } | null>;
}
