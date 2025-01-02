import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { SignupDTO } from './dto/signup.dto';
import { LoginDTO } from './dto/login.dto';
import { Roles } from 'src/roles/roles.decorator';
import { Role } from 'src/roles/roles.enum';
import { AuthRolesGuard } from 'src/roles/roles.guard';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @Roles(Role.ADMIN)
  @UseGuards(AuthRolesGuard)
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post('signup')
  async signup(@Body() signupData: SignupDTO) {
    return this.usersService.signup(signupData);
  }

  @Post('login')
  async login(@Body() body: LoginDTO) {
    const user = await this.usersService.validateUser(body.email, body.password);
    if (!user) {
      return { message: 'Invalid credentials' };
    }
    return this.usersService.login(user);
  }
}
