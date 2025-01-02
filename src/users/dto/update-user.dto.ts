import { PartialType } from '@nestjs/mapped-types';
import { SignupDTO } from './signup.dto';

export class UpdateUserDto extends PartialType(SignupDTO) {}
