import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { RidersService } from './riders.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  // 骑手：获取个人信息（包含在线状态）
  @Get('my/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async getMyProfile(@Request() req) {
    return this.ridersService.getMyProfile(req.user.userId);
  }

  // 骑手：获取当前正在配送的订单
  @Get('my/active-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async getMyActiveOrders(@Request() req) {
    return this.ridersService.getMyActiveOrders(req.user.userId);
  }

  // 切换在线状态
  @Put('online')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async toggleOnline(@Request() req, @Body('isOnline') isOnline: boolean) {
    return this.ridersService.toggleOnline(req.user.userId, isOnline);
  }

  // 骑手：获取今日统计数据
  @Get('my/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async getTodayStats(@Request() req) {
    return this.ridersService.getTodayStats(req.user.userId);
  }

  // 获取附近订单
  @Get('nearby-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async getNearbyOrders(
    @Request() req,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.ridersService.getNearbyOrders(
      req.user.userId,
      Number(lat),
      Number(lng),
    );
  }

  // 接单
  @Put('orders/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async acceptOrder(@Request() req, @Param('id') id: string) {
    return this.ridersService.acceptOrder(req.user.userId, Number(id));
  }

  // 确认送达
  @Put('orders/:id/deliver')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async deliverOrder(@Request() req, @Param('id') id: string) {
    return this.ridersService.deliverOrder(req.user.userId, Number(id));
  }

  // 获取历史接单记录
  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'both')
  async getMyHistory(@Request() req) {
    return this.ridersService.getMyHistory(req.user.userId);
  }
}
