import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { StripeService } from 'src/stripe/stripe.service';
@Module({
  imports: [UsersModule],
  controllers: [PaymentController],
  providers: [PaymentService, UsersService, StripeService],
})
export class PaymentModule {}
