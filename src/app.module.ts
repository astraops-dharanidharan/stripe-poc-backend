import { Module ,MiddlewareConsumer, NestModule, RequestMethod} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { StripeModule } from './stripe/stripe.module';
import { PaymentModule } from './payment/payment.module';
import { ProductModule } from './product/product.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { RawBodyMiddleware } from './middleware/raw-body.middleware';
import { JsonBodyMiddleware } from './middleware/json-body.middleware';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally accessible in the app
    }),
    MongooseModule.forRoot(process.env.MONGO_URI), 
    UsersModule, StripeModule, PaymentModule, ProductModule, SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
        .apply(RawBodyMiddleware)
        .forRoutes({
            path: '/payment/webhook',
            method: RequestMethod.POST,
        })
        .apply(JsonBodyMiddleware)
        .forRoutes('*');
}
}
