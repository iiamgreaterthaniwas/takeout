import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    adminLogin(body: any): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            role: string;
        };
    }>;
    getProfile(req: any): Promise<{
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
