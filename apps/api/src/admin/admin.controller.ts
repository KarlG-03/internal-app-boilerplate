import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { Request } from 'express';
import { PublicRoute } from '../common/decorators/public-route.decorator';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

class BootstrapDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  secret!: string;
}

type JwtRequestUser = { userId: string };

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @PublicRoute()
  @Post('bootstrap')
  bootstrap(@Body() dto: BootstrapDto) {
    return this.admin.bootstrap(dto.email, dto.secret);
  }

  @Get('stats')
  getStats() {
    return this.admin.getStats();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Get('users/:id/sessions')
  getUserSessions(@Param('id') id: string) {
    return this.admin.getUserSessions(id);
  }

  @Delete('users/:id/sessions')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeUserTokens(@Param('id') id: string) {
    return this.admin.revokeUserTokens(id);
  }

  @Delete('sessions/:tokenId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revokeSession(@Param('tokenId') tokenId: string) {
    return this.admin.revokeSession(tokenId);
  }

  @Patch('users/:id/toggle-superadmin')
  toggleSuperAdmin(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtRequestUser },
  ) {
    return this.admin.toggleSuperAdmin(id, req.user.userId);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(
    @Param('id') id: string,
    @Req() req: Request & { user: JwtRequestUser },
  ) {
    return this.admin.deleteUser(id, req.user.userId);
  }
}
