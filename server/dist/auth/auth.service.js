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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async wxLogin(code, userInfo) {
        const openid = `mock_openid_dev_test`;
        let user = await this.prisma.user.findUnique({ where: { openid } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    openid,
                    nickname: userInfo?.nickName || '微信用户',
                    avatar: userInfo?.avatarUrl || '',
                },
            });
        }
        else if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    nickname: userInfo.nickName || user.nickname,
                    avatar: userInfo.avatarUrl || user.avatar,
                },
            });
        }
        const payload = { sub: user.id, openid: user.openid, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }
    async adminLogin(username, password) {
        if (username === 'admin' && password === 'admin123') {
            const payload = { sub: 9999, username, role: 'admin' };
            return {
                access_token: this.jwtService.sign(payload),
                user: { id: 9999, username, role: 'admin' },
            };
        }
        throw new common_1.UnauthorizedException('用户名或密码错误');
    }
    async getProfile(userId) {
        if (userId === 9999) {
            return { id: 9999, nickname: '管理员', role: 'admin', avatar: '' };
        }
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map