import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './schema/product.schema';
import { StripeService } from 'src/stripe/stripe.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly stripeService: StripeService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const existingProduct = await this.productModel.findOne({ name: createProductDto.name });
      if (existingProduct) {
        throw new ConflictException('Product already exists');
      }
      const stripeProductId = await this.stripeService.createProduct(createProductDto.name, createProductDto.description);
      const stripePriceId = await this.stripeService.createPrice(stripeProductId, createProductDto.price, createProductDto.currency || 'usd', createProductDto.interval || 'month', createProductDto.name);
      const product = await this.productModel.create({...createProductDto, stripeProductId,stripePriceId});

      return product;
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    try {
      const products = await this.productModel.find();
      return products;
    } catch (error) {
      return error;
    }
  }

  async findOne(id: string) {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      return product;
    } catch (error) {
      return error;
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productModel.findByIdAndUpdate(id, updateProductDto, { new: true });
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if(product.stripePriceId){
        const stripePrice = await this.stripeService.getPrice(product.stripePriceId);
        if(stripePrice.unit_amount !== product.price || stripePrice.currency !== product.currency){
          const newStripePriceId = await this.stripeService.updatePrice(product.stripePriceId, product.price, product.currency || 'usd');
          await this.productModel.findByIdAndUpdate(id, { stripePriceId: newStripePriceId.id });
          product.stripePriceId = newStripePriceId.id;
        }
      }
      return product;
    } catch (error) {
      return error;
    }
  }

  async remove(id: string) {
    try {
      const product = await this.productModel.findByIdAndDelete(id);
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (product.stripeProductId) {
        await this.stripeService.deleteProduct(product.stripeProductId);
      }
      return product;
    } catch (error) {
      return error;
    }
  }
}
