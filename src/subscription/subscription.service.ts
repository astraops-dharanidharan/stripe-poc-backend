import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
@Injectable()
export class SubscriptionService {
    constructor(private readonly stripeService: StripeService) {}

    async createSubscription(customerId: string,  priceId: string, stripeProductId: string) {
        const subscription = await this.stripeService.createSubscription(customerId, priceId, stripeProductId);
        console.log(subscription, "subscription");
        return subscription;
    }
}
