import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { ProductService } from 'src/product/product.service';
@Injectable()
export class PaymentService {
    constructor(
        private readonly userService: UsersService,
        // private readonly productService: ProductService,
    ) {}

    async getCustomerId(userId: string) {
        const user = await this.userService.findUserById(userId);
        return user.stripeCustomerId;
    }

    
}