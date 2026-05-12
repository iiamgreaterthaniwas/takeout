import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../applications/applications.controller';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // 用户端：发起支付，获取参数
  @Post('prepay/:orderId')
  @UseGuards(JwtAuthGuard)
  async prepay(@Request() req, @Param('orderId') orderId: string) {
    return this.paymentService.createPrepay(req.user.userId, Number(orderId));
  }

  // 用户端：模拟支付成功（仅用于测试）
  @Post('mock-pay-success/:orderId')
  @UseGuards(JwtAuthGuard)
  async mockPaySuccess(@Request() req, @Param('orderId') orderId: string) {
    return this.paymentService.handleCallback({ 
      orderId: Number(orderId), 
      transactionId: `mock_trans_${Date.now()}` 
    });
  }

  // 微信支付回调 Webhook (无需鉴权)
  @Post('callback')
  async wxpayCallback(@Body() body: any, @Headers() headers: any) {
    // 实际需要传递 headers 进行验签
    return this.paymentService.handleCallback(body);
  }

  // 管理端/系统内部调用：触发订单分账
  @Post('profit-sharing/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async triggerProfitSharing(@Param('orderId') orderId: string) {
    return this.paymentService.profitSharing(Number(orderId));
  }
}
