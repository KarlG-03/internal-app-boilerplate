import { Controller, Get } from '@nestjs/common';
import { PublicRoute } from '../common/decorators/public-route.decorator';

@Controller('health')
export class HealthController {
  @PublicRoute()
  @Get()
  check(): { ok: boolean; at: string } {
    return { ok: true, at: new Date().toISOString() };
  }
}
