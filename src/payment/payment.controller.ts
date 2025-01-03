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
      const { metadata, subscription } = session;

      //updating the metadata to the subscription object
      if(subscription){
        await this.stripeService.updateMetadataToSubscription(subscription, metadata);
      }
    }

    console.log(event.type, "event.type");
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      const {customer, payment_intent, subscription: subscriptionId} = invoice

      //get subscription details and metadata of the customer and plan details
      const subscription = await this.stripeService.getSubscription(subscriptionId)

      //get payment method id
      const paymentMethodId = await this.stripeService.getPaymentMethodId(payment_intent)

      //attach payment method as default to customer
      await this.stripeService.attachPaymentMethod(customer as string, paymentMethodId as string);

      const { metadata} = subscription

      //create subscription and update the details in the database
      await this.subscriptionService.addSubscription(customer, metadata.priceId, metadata, subscriptionId);
    
      
    }

    return { status: 'success' };
  }

  
}
