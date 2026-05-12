import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { MerchantsService } from './merchants.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  // 商户：获取店铺信息
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async getMyShop(@Request() req) {
    return this.merchantsService.getMyShop(req.user.userId);
  }

  // 商户：更新店铺信息
  @Put('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async updateMyShop(@Request() req, @Body() data: any) {
    return this.merchantsService.updateMyShop(req.user.userId, data);
  }

  // 商户：获取今日统计数据
  @Get('my/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async getTodayStats(@Request() req) {
    return this.merchantsService.getTodayStats(req.user.userId);
  }

  // 商户：切换营业状态
  @Put('my/open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async toggleOpen(@Request() req, @Body('isOpen') isOpen: boolean) {
    return this.merchantsService.toggleOpen(req.user.userId, isOpen);
  }

  // 用户端公开接口：获取附近商家
  @Get('nearby')
  async getNearbyShops(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
  ) {
    return this.merchantsService.getNearbyShops(
      Number(lat),
      Number(lng),
      keyword,
      category,
    );
  }

  // 用户端公开接口：获取商家详情
  @Get('detail/:id')
  async getShopDetail(@Param('id') id: string) {
    return this.merchantsService.getShopDetail(Number(id));
  }
}
