import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TipoDocumento } from '@prisma/client';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  // Consulta API Externa y Creación Automática
  async consultarPorDocumento(numero: string) {
    // 1. Verificamos si ya lo tenemos guardado en nuestra BD local
    const clienteLocal = await this.prisma.cliente.findUnique({
      where: { numeroDocumento: numero },
    });

    if (clienteLocal) return clienteLocal;

    // 2. Determinamos si es DNI o RUC
    const esRuc = numero.length === 11;
    const esDni = numero.length === 8;

    if (!esRuc && !esDni) {
      throw new BadRequestException('El documento debe tener 8 o 11 dígitos');
    }

    const tipoDoc = esRuc ? TipoDocumento.RUC : TipoDocumento.DNI;
    const url = esRuc
      ? `https://api.apis.net.pe/v1/ruc?numero=${numero}`
      : `https://api.apis.net.pe/v1/dni?numero=${numero}`;

    try {
      // 3. Consultamos a la API peruana gratuita
      const respuesta = await fetch(url);

      if (!respuesta.ok) {
        throw new NotFoundException('Documento no encontrado en SUNAT/RENIEC');
      }

      const datos = await respuesta.json();

      // 4. Mapeamos la respuesta (La API devuelve 'nombre' para DNI y 'razonSocial' para RUC)
      const nombreRazon = esRuc ? datos.nombre : datos.nombre;
      const direccion = esRuc ? datos.direccion : null;

      // 5. Lo guardamos en nuestra base de datos para no volver a consultarlo a la API externa
      return await this.prisma.cliente.create({
        data: {
          tipoDocumento: tipoDoc,
          numeroDocumento: numero,
          nombreRazon: nombreRazon,
          direccion: direccion,
        },
      });
    } catch (error) {
      throw new NotFoundException(
        'Error al consultar el documento: ' + error.message,
      );
    }
  }

  // Métodos CRUD básicos por si el cajero quiere agregar clientes a mano
  async findAll() {
    return this.prisma.cliente.findMany();
  }
}
