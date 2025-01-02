import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    Matches,
    MinLength,
  } from 'class-validator';
  import { Role } from '../../roles/roles.enum';
  
  export class SignupDTO {
    @IsString()
    name: string;
  
    @IsEmail()
    email: string;
  
    @IsString()
    @MinLength(6)
    @Matches(/^(?=.*[0-9])/, {
      message: 'Password must contain at least one number',
    })
    password: string;
  
    @IsEnum(Role)
    @IsOptional()
    role: Role;
  }
  