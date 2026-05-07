import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // pa ra todos los módulos
@Module({
  providers: [PrismaService],
  exports: [PrismaService], //  Exportamos el servicio
})
export class PrismaModule {}
