import { Controller , Post, Body, Headers, UseGuards, Req} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { StripeService } from 'src/stripe/stripe.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthRolesGuard } from 'src/roles/roles.guard';
import { Roles } from 'src/roles/roles.decorator';
import { Role } from 'src/roles/roles.enum';
import { SubscriptionService } from 'src/subscription/subscription.service';


@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService, 
    private readonly stripeService: StripeService, 
    private readonly userService: UsersService, 
    private readonly jwtService: JwtService ,
    private readonly subscriptionService: SubscriptionService
  ) {}


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
  async createCheckoutSession(@Body() body: { customerId: string; priceId: string; quantity: number, stripeProductId: string}, @Headers('Authorization') authHeader: string) {
    const { customerId, priceId , quantity, stripeProductId} = body;

    const token = authHeader?.split(' ')[1];
    const decodedToken = this.jwtService.decode(token);
    const { username: name, sub: userId, email  } = decodedToken;

    const userDetails ={name, userId, email}

    const session = await this.stripeService.createCheckoutSession(customerId, priceId, quantity, userDetails, stripeProductId);
    return { sessionId: session.id, redirectUrl: session.url };
  }

  @Post('webhook')
  async handleStripeWebhook(@Req() req: Request) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const body =   req.body
    let event;
    try {
      event = this.stripeService.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.log(err, "err");
      return { status: 'Invalid webhook signature' };
    }
    // Handle the event after payment is successful
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { customer, metadata, payment_intent, subscription } = session;
      console.log(session, "session");
      
      const subscription2 = await this.subscriptionService.createSubscription(customer, metadata.priceId, metadata.stripeProductId);
      console.log(subscription2, "subscription2");
    }

    console.log(event.type, "event.type");
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      const payment_intent = invoice.payment_intent as string;
      console.log(payment_intent, "payment_intent");
      console.log(invoice, "invoice");
      const paymentMethodId = await this.stripeService.getPaymentMethodId(payment_intent)
      console.log(paymentMethodId, "paymentMethodId");
      await this.stripeService.attachPaymentMethod(invoice.customer as string, paymentMethodId as string);
      // const customerId = invoice.customer as string;
      // console.log('Default payment method updated:', paymentMethodId, invoice);
      // // Update the default payment method for the customer
      // await this.stripeService.attachPaymentMethod(customerId, 
      //   paymentMethodId
      // );
    
      
    }

    return { status: 'success' };
  }

  
}
