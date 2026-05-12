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
import { ProductsService } from './products.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 商户端：创建商品
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async createProduct(@Request() req, @Body() data: any) {
    return this.productsService.createProduct(req.user.userId, data);
  }

  // 商户端：获取我的商品
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async getMyProducts(@Request() req) {
    return this.productsService.getMyProducts(req.user.userId);
  }

  // 商户端：修改商品
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async updateProduct(
    @Request() req,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.productsService.updateProduct(
      req.user.userId,
      Number(id),
      data,
    );
  }

  // 商户端：删除商品
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('merchant', 'both')
  async deleteProduct(@Request() req, @Param('id') id: string) {
    return this.productsService.deleteProduct(req.user.userId, Number(id));
  }

  // 用户端：获取某商家的商品（公开）
  @Get('shop/:merchantId')
  async getShopProducts(@Param('merchantId') merchantId: string) {
    return this.productsService.getShopProducts(Number(merchantId));
  }

  // 管理端：获取所有商品
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getAllProducts(@Query('status') status?: string) {
    return this.productsService.getAllProducts(status);
  }

  // 管理端：审核商品
  @Put('admin/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reviewProduct(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected' | 'off',
  ) {
    return this.productsService.reviewProduct(Number(id), status);
  }
}
