import { Controller , Post, Body, Headers, UseGuards} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { StripeService } from 'src/stripe/stripe.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthRolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { Role } from 'src/roles/roles.enum';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService, 
    private readonly stripeService: StripeService, 
    private readonly userService: UsersService, 
    private readonly jwtService: JwtService ) {}


  @Post('initiate')
  @Roles(Role.USER, Role.ADMIN)
  @UseGuards(AuthRolesGuard)
  async initiatePayment(@Headers('Authorization') authHeader: string) {

    const token = authHeader?.split(' ')[1];
    const decodedToken = this.jwtService.decode(token);
    const { username: name, sub: userId, email  } = decodedToken;

    // Check if the user already has a Stripe customer ID in your database.
    let user = await this.userService.findUserById(userId);
    let stripeCustomerId : string= user.stripeCustomerId;
    // If not, create one.
    if (!user.stripeCustomerId) {
      const {customerId} = await this.stripeService.findOrCreateCustomer(email, name);
      stripeCustomerId = customerId
      await this.userService.updateStripeCustomerId(userId, stripeCustomerId);
    }

    return { stripeCustomerId };
  }

  @Post('checkout-session')
  async createCheckoutSession(@Body() body: { customerId: string; priceId: string; quantity: number }) {
    const { customerId, priceId , quantity} = body;

    const session = await this.stripeService.createCheckoutSession(customerId, priceId, quantity);
    return { sessionId: session.id, redirectUrl: session.url };
  }

  
}
