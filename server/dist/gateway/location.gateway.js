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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let LocationGateway = class LocationGateway {
    server;
    redis = new ioredis_1.default();
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    async handleLocation(client, data) {
        const riderId = 'mock_rider_id';
        await this.redis.setex(`rider:${riderId}:loc`, 30, JSON.stringify({ lat: data.lat, lng: data.lng }));
        this.server.to(`room_order_${data.orderId}`).emit('location_update', {
            lat: data.lat,
            lng: data.lng,
        });
    }
    handleJoin(client, orderId) {
        client.join(`room_order_${orderId}`);
        console.log(`Client ${client.id} joined room: room_order_${orderId}`);
    }
    handleLeave(client, orderId) {
        client.leave(`room_order_${orderId}`);
        console.log(`Client ${client.id} left room: room_order_${orderId}`);
    }
};
exports.LocationGateway = LocationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LocationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('rider_location'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], LocationGateway.prototype, "handleLocation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handleJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_order'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], LocationGateway.prototype, "handleLeave", null);
exports.LocationGateway = LocationGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ cors: true })
], LocationGateway);
//# sourceMappingURL=location.gateway.js.map