import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { StripeService } from 'src/stripe/stripe.service';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { SubscriptionModule } from 'src/subscription/subscription.module';
@Module({
  imports: [UsersModule, SubscriptionModule],
  controllers: [PaymentController],
  providers: [PaymentService, UsersService, StripeService, SubscriptionService],
})
export class PaymentModule {}
