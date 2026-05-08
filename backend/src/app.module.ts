import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard } from './auth/auth.guard';
import { ConfigModule } from '@nestjs/config';
import { CategoriasModule } from './categorias/categorias.module';
import { ProductosModule } from './productos/productos.module';
import { LotesModule } from './lotes/lotes.module';
import { VentasModule } from './ventas/ventas.module';
import { ClientesModule } from './clientes/clientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Para leer el .env en todo lado
    PrismaModule,
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    ProductosModule,
    LotesModule,
    VentasModule,
    ClientesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, //  bloquea TODA la aplicación
    },
  ],
})
export class AppModule {}
