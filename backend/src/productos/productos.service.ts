import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    const existeCodigo = await this.prisma.producto.findUnique({
      where: { codigo: createProductoDto.codigo },
    });

    if (existeCodigo) {
      throw new ConflictException('Ya existe un producto con este código');
    }

    return this.prisma.producto.create({
      data: {
        ...createProductoDto,
        // Al crear, el precio de venta es 0 hasta que llegue el primer lote
        precioVentaActual: 0,
      },
      include: {
        categoria: true, // Que nos devuelva los datos de la categoría al crearlo
      },
    });
  }

  async findAll() {
    return this.prisma.producto.findMany({
      include: {
        categoria: true,
        // Opcional: Podríamos incluir el stock total aquí sumando los lotes
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const producto = await this.prisma.producto.findUnique({
      where: { id },
      include: {
        categoria: true,
        lotes: {
          where: { stockActual: { gt: 0 } }, // Solo traemos los lotes que tienen stock
          orderBy: { fechaVencimiento: 'asc' },
        },
      },
    });

    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    await this.findOne(id);
    return this.prisma.producto.update({
      where: { id },
      data: updateProductoDto,
    });
  }

  async desactivar(id: number) {
    await this.findOne(id); // Reutilizamos findOne para verificar que existe

    return this.prisma.producto.update({
      where: { id },
      data: { activo: false }, // Borrado Lógico estricto
    });
  }

  async obtenerAlertasStock() {
    // 1. Traemos todos los productos activos con sus lotes vigentes
    const productos = await this.prisma.producto.findMany({
      where: { activo: true },
      include: {
        lotes: {
          where: { activo: true, stockActual: { gt: 0 } },
        },
      },
    });

    // 2. Mapeamos y sumamos el stock total
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

    // 3. Filtramos solo los que están por debajo o igual al mínimo
    return alertas.filter((p) => p.stockTotal <= p.stockMinimo);
  }
}
