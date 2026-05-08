import { Controller, Get, Param } from '@nestjs/common';
import { ClientesService } from './clientes.service';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get('consulta/:numero')
  consultarDocumento(@Param('numero') numero: string) {
    return this.clientesService.consultarPorDocumento(numero);
  }

  @Get()
  findAll() {
    return this.clientesService.findAll();
  }
}
