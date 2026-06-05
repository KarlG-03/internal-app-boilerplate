import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  /** Bcrypt truncates at 72 bytes; keep a sensible cap for UX */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
