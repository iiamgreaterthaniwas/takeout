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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RidersController = void 0;
const common_1 = require("@nestjs/common");
const riders_service_1 = require("./riders.service");
const guards_1 = require("../auth/guards");
const applications_controller_1 = require("../applications/applications.controller");
let RidersController = class RidersController {
    ridersService;
    constructor(ridersService) {
        this.ridersService = ridersService;
    }
    async getMyProfile(req) {
        return this.ridersService.getMyProfile(req.user.userId);
    }
    async getMyActiveOrders(req) {
        return this.ridersService.getMyActiveOrders(req.user.userId);
    }
    async toggleOnline(req, isOnline) {
        return this.ridersService.toggleOnline(req.user.userId, isOnline);
    }
    async getTodayStats(req) {
        return this.ridersService.getTodayStats(req.user.userId);
    }
    async getNearbyOrders(req, lat, lng) {
        return this.ridersService.getNearbyOrders(req.user.userId, Number(lat), Number(lng));
    }
    async acceptOrder(req, id) {
        return this.ridersService.acceptOrder(req.user.userId, Number(id));
    }
    async deliverOrder(req, id) {
        return this.ridersService.deliverOrder(req.user.userId, Number(id));
    }
    async getMyHistory(req) {
        return this.ridersService.getMyHistory(req.user.userId);
    }
};
exports.RidersController = RidersController;
__decorate([
    (0, common_1.Get)('my/profile'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "getMyProfile", null);
__decorate([
    (0, common_1.Get)('my/active-orders'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "getMyActiveOrders", null);
__decorate([
    (0, common_1.Put)('online'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('isOnline')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "toggleOnline", null);
__decorate([
    (0, common_1.Get)('my/stats'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "getTodayStats", null);
__decorate([
    (0, common_1.Get)('nearby-orders'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('lat')),
    __param(2, (0, common_1.Query)('lng')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "getNearbyOrders", null);
__decorate([
    (0, common_1.Put)('orders/:id/accept'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "acceptOrder", null);
__decorate([
    (0, common_1.Put)('orders/:id/deliver'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "deliverOrder", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('rider', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RidersController.prototype, "getMyHistory", null);
exports.RidersController = RidersController = __decorate([
    (0, common_1.Controller)('riders'),
    __metadata("design:paramtypes", [riders_service_1.RidersService])
], RidersController);
//# sourceMappingURL=riders.controller.js.map