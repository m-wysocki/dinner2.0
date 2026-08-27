import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@dinner/shared';

@Controller('api/v1')
export class AppController {
  @Get('health')
  health(): HealthResponse {
    return { status: 'ok', service: 'api' };
  }
}
