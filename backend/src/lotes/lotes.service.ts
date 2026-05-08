import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LotesService {
  constructor(private prisma: PrismaService) {}

  async create(createLoteDto: CreateLoteDto) {
    // 1. Verificar existencia del producto
    const producto = await this.prisma.producto.findUnique({
      where: { id: createLoteDto.productoId },
    });

    if (!producto) {
      throw new NotFoundException('El producto especificado no existe');
    }

    // 2. Lógica de Precios: Precio Venta = Compra * (1 + Ganancia/100)
    // Convertimos Decimal a Number para el cálculo
    const ganancia = Number(producto.porcentajeGanancia) / 100;
    const nuevoPrecioVenta = createLoteDto.precioCompra * (1 + ganancia);

    // 3. Ejecutar Transacción Atómica
    return this.prisma.$transaction(async (tx) => {
      // A. Crear el Lote
      const nuevoLote = await tx.lote.create({
        data: {
          productoId: createLoteDto.productoId,
          codigoLote: createLoteDto.codigoLote,
          precioCompra: createLoteDto.precioCompra,
          cantidadInicial: createLoteDto.cantidadInicial,
          stockActual: createLoteDto.cantidadInicial, // Al inicio es igual a la recibida
          fechaVencimiento: new Date(createLoteDto.fechaVencimiento),
        },
      });

      // B. Actualizar el precio de venta en el Producto (Afecta a todos los lotes antiguos)
      await tx.producto.update({
        where: { id: createLoteDto.productoId },
        data: { precioVentaActual: nuevoPrecioVenta },
      });

      return nuevoLote;
    });
  }

  async findAll() {
    return this.prisma.lote.findMany({
      include: { producto: true },
      orderBy: { fechaVencimiento: 'asc' },
    });
  }

  async findOne(id: number) {
    const lote = await this.prisma.lote.findUnique({
      where: { id },
      include: { producto: true },
    });
    if (!lote) throw new NotFoundException('Lote no encontrado');
    return lote;
  }

  async update(id: number, updateLoteDto: UpdateLoteDto) {
    const loteExistente = await this.findOne(id);

    // Si se actualiza el precio de compra, debemos recalcular el precio de venta del producto
    if (updateLoteDto.precioCompra) {
      const producto = await this.prisma.producto.findUnique({
        where: { id: loteExistente.productoId },
      });

      // >>> AGREGA ESTA VALIDACIÓN PARA CALLAR A TYPESCRIPT <<<
      if (!producto) {
        throw new NotFoundException(
          'El producto asociado a este lote ya no existe',
        );
      }

      const ganancia = Number(producto.porcentajeGanancia) / 100;
      const nuevoPrecioVenta = updateLoteDto.precioCompra * (1 + ganancia);

      return this.prisma.$transaction(async (tx) => {
        const loteActualizado = await tx.lote.update({
          where: { id },
          data: {
            ...updateLoteDto,
            fechaVencimiento: updateLoteDto.fechaVencimiento
              ? new Date(updateLoteDto.fechaVencimiento)
              : undefined,
          },
        });

        await tx.producto.update({
          where: { id: loteExistente.productoId },
          data: { precioVentaActual: nuevoPrecioVenta },
        });

        return loteActualizado;
      });
    }

    return this.prisma.lote.update({
      where: { id },
      data: {
        ...updateLoteDto,
        fechaVencimiento: updateLoteDto.fechaVencimiento
          ? new Date(updateLoteDto.fechaVencimiento)
          : undefined,
      },
    });
  }

  async desactivar(id: number) {
    await this.findOne(id);
    return this.prisma.lote.update({
      where: { id },
      data: { activo: false },
    });
  }
}
