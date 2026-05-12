import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 用户端：提交评价
  @Post('order/:orderId')
  @UseGuards(JwtAuthGuard)
  async createReview(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() data: { rating: number; content?: string },
  ) {
    return this.reviewsService.createReview(
      req.user.userId,
      Number(orderId),
      data,
    );
  }

  // 获取商家评价列表
  @Get('merchant/:merchantId')
  async getMerchantReviews(@Param('merchantId') merchantId: string) {
    return this.reviewsService.getMerchantReviews(Number(merchantId));
  }
}
