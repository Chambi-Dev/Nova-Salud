import { Injectable } from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  create(createProductoDto: CreateProductoDto) {
    return this.prisma.producto.create({
      // Usamos "as any" para evitar el choque estricto de tipos entre el DTO y Prisma
      // Inicializamos precioVentaActual en 0, ya que se actualizará al ingresar un lote
      data: {
        ...createProductoDto,
        precioVentaActual: 0,
      } as any,
    });
  }

  findAll() {
    return this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: true,
        lotes: {
          where: { activo: true, stockActual: { gt: 0 } },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        lotes: {
          where: { activo: true, stockActual: { gt: 0 } },
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
    });
  }

  update(id: number, updateProductoDto: UpdateProductoDto) {
    return this.prisma.producto.update({
      where: { id },
      data: updateProductoDto as any,
    });
  }

  // Solución al primer error: Renombramos la función a "desactivar"
  desactivar(id: number) {
    return this.prisma.producto.update({
      where: { id },
      data: { activo: false },
    });
  }

  async obtenerAlertasStock() {
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        lotes: {
          where: { activo: true, stockActual: { gt: 0 } },
        },
      },
    });

    const alertas = productos.map((producto) => {
      const stockTotal = producto.lotes.reduce(
        (suma, lote) => suma + lote.stockActual,
        0,
      );

      return {
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        stockMinimo: producto.stockMinimo,
        stockTotal: stockTotal,
      };
    });

    return alertas.filter((p) => p.stockTotal <= p.stockMinimo);
  }
}
