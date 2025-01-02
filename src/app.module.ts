import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeModule } from './stripe/stripe.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally accessible in the app
    }),
    MongooseModule.forRoot(process.env.MONGO_URI), 
    UsersModule, StripeModule, PaymentModule, ProductModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
