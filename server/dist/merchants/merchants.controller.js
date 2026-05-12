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
exports.MerchantsController = void 0;
const common_1 = require("@nestjs/common");
const merchants_service_1 = require("./merchants.service");
const guards_1 = require("../auth/guards");
const applications_controller_1 = require("../applications/applications.controller");
let MerchantsController = class MerchantsController {
    merchantsService;
    constructor(merchantsService) {
        this.merchantsService = merchantsService;
    }
    async getMyShop(req) {
        return this.merchantsService.getMyShop(req.user.userId);
    }
    async updateMyShop(req, data) {
        return this.merchantsService.updateMyShop(req.user.userId, data);
    }
    async getTodayStats(req) {
        return this.merchantsService.getTodayStats(req.user.userId);
    }
    async toggleOpen(req, isOpen) {
        return this.merchantsService.toggleOpen(req.user.userId, isOpen);
    }
    async getNearbyShops(lat, lng, keyword, category) {
        return this.merchantsService.getNearbyShops(Number(lat), Number(lng), keyword, category);
    }
    async getShopDetail(id) {
        return this.merchantsService.getShopDetail(Number(id));
    }
};
exports.MerchantsController = MerchantsController;
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('merchant', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "getMyShop", null);
__decorate([
    (0, common_1.Put)('my'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('merchant', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "updateMyShop", null);
__decorate([
    (0, common_1.Get)('my/stats'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('merchant', 'both'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "getTodayStats", null);
__decorate([
    (0, common_1.Put)('my/open'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard, guards_1.RolesGuard),
    (0, applications_controller_1.Roles)('merchant', 'both'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)('isOpen')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "toggleOpen", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('keyword')),
    __param(3, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "getNearbyShops", null);
__decorate([
    (0, common_1.Get)('detail/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "getShopDetail", null);
exports.MerchantsController = MerchantsController = __decorate([
    (0, common_1.Controller)('merchants'),
    __metadata("design:paramtypes", [merchants_service_1.MerchantsService])
], MerchantsController);
//# sourceMappingURL=merchants.controller.js.map