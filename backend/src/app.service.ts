import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly appStartTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    const uptime = Math.floor((Date.now() - this.appStartTime) / 1000);
    let dbStatus = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime,
      database: dbStatus,
    };
  }
}
