import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoriaDto: CreateCategoriaDto) {
    const nombreNormalizado = createCategoriaDto.nombre.trim();

    const existe = await this.prisma.categoria.findUnique({
      where: { nombre: nombreNormalizado },
    });

    if (existe) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    return this.prisma.categoria.create({
      data: { nombre: nombreNormalizado },
    });
  }

  async findAll() {
    // Solo devolvemos las categorías que no han sido eliminadas lógicamente si fuera necesario,
    // pero usualmente las categorías se mantienen para el histórico.
    return this.prisma.categoria.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productos: true }, // Nos dice cuántos productos tiene esta categoría
        },
      },
    });

    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${id} no existe`);
    }

    return categoria;
  }

  async update(id: number, updateCategoriaDto: UpdateCategoriaDto) {
    await this.findOne(id);

    return this.prisma.categoria.update({
      where: { id },
      data: updateCategoriaDto,
    });
  }

  async desactivar(id: number) {
    await this.findOne(id);

    // Si en el futuro agregas un campo 'activo' a Categoria en el schema.prisma:
    // return this.prisma.categoria.update({ where: { id }, data: { activo: false } });

    // Por ahora, como el esquema inicial de Categoria no tenía 'activo',
    // lo eliminamos físicamente SOLA SI no tiene productos asociados:
    const categoria = await this.findOne(id);
    if (categoria._count.productos > 0) {
      throw new ConflictException(
        'No se puede eliminar una categoría que tiene productos asociados',
      );
    }

    return this.prisma.categoria.delete({
      where: { id },
    });
  }
}
