import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

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

  async createPrice(productId: string,amount: number, currency: string): Promise<string> {
    const price = await this.stripe.prices.create({
      unit_amount: amount, // Price in cents (e.g., 1000 = $10.00)
      currency,
      product: productId,
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
      console.log(deletedProduct);

      return deletedProduct;
    } catch (error) {
      console.log(error);
      throw new Error(`Error deleting product from Stripe: ${error.message}`);
    }
  }

  async createCheckoutSession(customerId: string, priceId: string, quantity: number) {
    return await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/purchase',
      cancel_url: 'http://localhost:5173/purchase',
    });
  }
  
  
}
