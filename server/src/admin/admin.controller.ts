import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('admin')
// 实际环境中应取消注释，强制管理端接口必须管理员权限
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Put('users/:id/status')
  async toggleUserStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.toggleUserStatus(Number(id), status);
  }

  @Get('orders')
  async getOrders(@Query('status') status?: string) {
    return this.adminService.getOrders(status);
  }

  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Post('settings')
  async updateSettings(@Body() data: any) {
    return this.adminService.updateSettings(data);
  }

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
