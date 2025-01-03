import { Injectable, RawBodyRequest } from '@nestjs/common';
import Stripe from 'stripe';
import {v4 as uuidv4} from 'uuid';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async findAllCustomers() {
    return await this.stripe.customers.list();
  }

  async findOrCreateCustomer(email: string, name: string): Promise<{ customerId: string; isNew: boolean }> {
    // Check if the customer already exists in Stripe
    const existingCustomer = await this.stripe.customers.list({ email });
    if (existingCustomer.data.length > 0) {
      return { 
        customerId: existingCustomer.data[0].id,
        isNew: false 
      };
    }

    // Create a new customer in Stripe
    const customer = await this.stripe.customers.create({
      email,
      name,
    });

    return { 
      customerId: customer.id,
      isNew: true 
    };
  }


  async createProduct(name: string, description: string): Promise<string> {
    const product = await this.stripe.products.create({
      name,
      description,
    });
    return product.id;
  }

  async createPrice(productId: string,amount: number, currency: string, interval: Stripe.Price.Recurring.Interval, productName: string): Promise<string> {
    const price = await this.stripe.prices.create({
      unit_amount: amount, // Price in cents (e.g., 1000 = $10.00)
      currency,
      product: productId,
      recurring: {
        interval: interval,
      },
      product_data:{
        name:  productName,
      }
    });
    return price.id;
  }

  // Get a price by ID
  async getPrice(priceId: string) {
    return await this.stripe.prices.retrieve(priceId);
  }

  async updatePrice(priceId: string, amount: number, currency: string) {
    // Mark the old price as inactive
    await this.stripe.prices.update(priceId, { active: false });
    
    // Get the product ID from the old price
    const oldPrice = await this.stripe.prices.retrieve(priceId);
    
    // Create a new price
    return await this.stripe.prices.create({
      unit_amount: amount,
      currency,
      product: oldPrice.product as string,
    });
  }

  // Delete all prices for a product
  async deletePrices(productId: string) {
    try {
      // List all prices associated with the product
      const prices = await this.stripe.prices.list({ product: productId });

      // Loop through each price and delete it
      for (const price of prices.data) {
        await this.stripe.prices.update(price.id, { active: false });
      }

      return { message: 'Prices deleted successfully.' };
    } catch (error) {
      throw new Error(`Error deleting prices: ${error.message}`);
    }
  }

   // Delete product from Stripe (after deleting associated prices)
  async deleteProduct(productId: string) {
    try {
      // First, delete all associated prices
      await this.deletePrices(productId);

      // Then, delete the product
      const deletedProduct = await this.stripe.products.update(productId, { active: false });
      return deletedProduct;
    } catch (error) {
      throw new Error(`Error deleting product from Stripe: ${error.message}`);
    }
  }

  async  attachPaymentMethod(customerId: string, paymentMethodId: string) {
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  
    return 'Payment method attached successfully';
  }

  async createCheckoutSession(customerId: string, priceId: string, quantity: number, userDetails: any, stripeProductId: string) {
    console.log(stripeProductId, "stripeProductId");  
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:5173/purchase',
      cancel_url: 'http://localhost:5173/purchase',
      metadata: {
        orderId: uuidv4(),
        priceId: priceId,
        stripeProductId,
        ...userDetails
      },
    });
  }

  async createSubscription(customerId: string, priceId: string, metadata: any) {
    return await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        ...metadata
      },
    });
  }

  async getPaymentMethodId(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.payment_method;
  }

  constructEvent(body:any, signature: string, endpointSecret: string) {
    try {
      console.log(body, "body");
      console.log(signature, "signature");
      console.log(endpointSecret, "endpointSecret");
      return this.stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.log(err.message, "err");
      throw new Error('Webhook signature verification failed');
    }
  }

  async getSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      throw new Error(`Error retrieving subscription: ${error.message}`);
    }
  }

  async updateMetadataToSubscription(subscription: any, metadata: any) {
    try {
      return await this.stripe.subscriptions.update(subscription, {
        metadata: metadata,
      });
    } catch (error) {
      throw new Error(`Error updating subscription metadata: ${error.message}`);
    }
  }
  
}
