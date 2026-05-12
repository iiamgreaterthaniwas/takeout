import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { LocationGateway } from './gateway/location.gateway';
import { UploadModule } from './upload/upload.module';
import { ApplicationsModule } from './applications/applications.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { RidersModule } from './riders/riders.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AddressesModule } from './addresses/addresses.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UploadModule,
    ApplicationsModule,
    ProductsModule,
    OrdersModule,
    RidersModule,
    MerchantsModule,
    PaymentModule,
    AdminModule,
    ReviewsModule,
    AddressesModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationGateway],
})
export class AppModule {}
