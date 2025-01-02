import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignupDTO } from './dto/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly UserModal: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async getAllUsers(): Promise<User[]> {
    return this.UserModal.find({}, { name: 1, email: 1, role: 1 }).exec();
  }

  async findUserById(userId: string): Promise<User> {
    try {
      const user = await this.UserModal.findById(userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.UserModal.findOne({ email: email });
      if (!user) {
        throw new UnauthorizedException('Wrong credientials');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Wrong credientials');
      }

      return { userId: user._id, username: user.name, role: user.role, email: user.email };
    } catch (error) {
      throw new NotAcceptableException(`Error validating user: ${error.message}`);
    }
  }

  async login(user: any) {
    try {
      const payload = {
        username: user.username,
        sub: user.userId,
        role: user.role,
        email: user.email,
      };
  
      return {
        access_token: this.jwtService.sign(payload, { secret: process.env.JWT_SECRET }),
        userName: payload.username,
        userId: payload.sub,
        role: payload.role,
        email: payload.email,
      };
    } catch (error) {
      throw new Error(`Error logging in: ${error.message}`);
    }
  }

  async signup(signupData: SignupDTO) {
   try {
    const { email, password, name, role } = signupData;
    const emailAlreadyExist = await this.UserModal.findOne({
      email: email,
    });

    if (emailAlreadyExist) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.UserModal.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return newUser;
    
   } catch (error) {
      throw new Error(`Error signing up: ${error.message}`);
   }
  }

  async updateStripeCustomerId (userId : string, stripeCustomerId: string){
    try {
      const user = this.UserModal.findByIdAndUpdate(userId, {stripeCustomerId})
      return user;
    } catch (error) {
      throw new Error("Error updating the Stripe customer Id")
    }
  }
}
