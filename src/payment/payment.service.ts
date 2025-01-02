import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PaymentService {
    constructor(
        private readonly userService: UsersService,
    ) {}

    async getCustomerId(userId: string) {
        const user = await this.userService.findUserById(userId);
        return user.stripeCustomerId;
    }
}