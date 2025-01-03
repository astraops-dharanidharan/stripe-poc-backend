import { Injectable } from '@nestjs/common';
import { StripeService } from 'src/stripe/stripe.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schema/subscription.schema';

@Injectable()
export class SubscriptionService {
    constructor(
        private readonly stripeService: StripeService,
        @InjectModel(Subscription.name)
        private subscriptionModel: Model<SubscriptionDocument>,
    ) {}

    async addSubscription(customerId: string,  priceId: string, metadata: any, subscriptionId: string) {
        const {userId, status} = metadata
        // Create subscription in our database
        const subscription = new this.subscriptionModel({
            stripeSubscriptionId: subscriptionId,
            userId: userId,
            stripeCustomerId: customerId,
            planId: priceId,
            status: status,
        });

        return await subscription.save();
    }
}
