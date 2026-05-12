import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 用户端：创建订单
  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Request() req, @Body() data: any) {
    return this.ordersService.createOrder(req.user.userId, data);
  }

  // 用户端：获取我的订单
  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Request() req) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  // 商户端：获取店铺订单
  @Get('shop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async getShopOrders(@Request() req, @Query('status') status?: string) {
    return this.ordersService.getShopOrders(req.user.userId, status);
  }

  // 获取订单详情
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderDetail(@Param('id') id: string) {
    return this.ordersService.getOrderDetail(Number(id));
  }

  // 商户端：接单
  @Put('shop/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async acceptOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.acceptOrder(req.user.userId, Number(id));
  }

  // 商户端：备餐完成
  @Put('shop/:id/ready')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async readyOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.readyOrder(req.user.userId, Number(id));
  }

  // 用户端：取消订单
  @Put(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.userId, Number(id));
  }

  // 用户端：删除订单
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.deleteOrder(req.user.userId, Number(id));
  }
}
