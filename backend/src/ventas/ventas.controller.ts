import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UsuarioActual } from '../auth/decorators/current-user.decorator';
import type { PayloadUsuario } from '../auth/decorators/current-user.decorator';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  create(
    @Body() createVentaDto: CreateVentaDto,
    // Inyectamos el usuario que viene en el Token JWT
    @UsuarioActual() usuario: PayloadUsuario,
  ) {
    // Pasamos el ID del usuario (sub) al servicio para registrarlo en la CabeceraVenta
    return this.ventasService.create(createVentaDto, usuario.sub);
  }

  @Get()
  findAll() {
    return this.ventasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }
}
