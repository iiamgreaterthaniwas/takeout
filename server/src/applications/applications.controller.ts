import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // 用户端：提交商户申请
  @Post('merchant')
  @UseGuards(JwtAuthGuard)
  async applyMerchant(@Request() req, @Body() data: any) {
    return this.applicationsService.applyMerchant(req.user.userId, data);
  }

  // 用户端：提交骑手申请
  @Post('rider')
  @UseGuards(JwtAuthGuard)
  async applyRider(@Request() req, @Body() data: any) {
    return this.applicationsService.applyRider(req.user.userId, data);
  }

  // 管理端：获取商户申请列表
  @Get('merchant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getMerchantApplications() {
    return this.applicationsService.getMerchantApplications();
  }

  // 管理端：获取骑手申请列表
  @Get('rider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getRiderApplications() {
    return this.applicationsService.getRiderApplications();
  }

  // 管理端：审核商户
  @Put('merchant/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reviewMerchant(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('rejectReason') rejectReason?: string,
  ) {
    return this.applicationsService.reviewMerchant(
      Number(id),
      status,
      rejectReason,
    );
  }

  // 管理端：审核骑手
  @Put('rider/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async reviewRider(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Body('rejectReason') rejectReason?: string,
  ) {
    return this.applicationsService.reviewRider(
      Number(id),
      status,
      rejectReason,
    );
  }
}
