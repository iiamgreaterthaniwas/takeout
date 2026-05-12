import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wx-login')
  async wxLogin(@Body('code') code: string, @Body('userInfo') userInfo?: any) {
    return this.authService.wxLogin(code, userInfo);
  }

  @Post('admin-login')
  async adminLogin(@Body() body: any) {
    return this.authService.adminLogin(body.username, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}
