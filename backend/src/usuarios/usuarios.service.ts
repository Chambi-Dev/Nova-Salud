import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  // Inyectamos nuestro servicio de Prisma (Similar al @Autowired de Java)
  constructor(private prisma: PrismaService) {}

  private readonly usuarioSelect = {
    id: true,
    nombre: true,
    usuario: true,
    rol: true,
    activo: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(createUsuarioDto: CreateUsuarioDto) {
    // 1. Verificamos si el usuario ya existe
    const usuarioExiste = await this.prisma.usuario.findUnique({
      where: { usuario: createUsuarioDto.usuario },
      select: { id: true },
    });

    if (usuarioExiste) {
      throw new BadRequestException('El nombre de usuario ya está en uso');
    }

    // 2. Encriptamos la contraseña (Salt de 10 rondas es el estándar seguro)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUsuarioDto.password,
      saltRounds,
    );

    // 3. Guardamos en la base de datos usando Prisma
    return this.prisma.usuario.create({
      data: {
        nombre: createUsuarioDto.nombre,
        usuario: createUsuarioDto.usuario,
        password: hashedPassword,
        rol: createUsuarioDto.rol, // 'ADMIN' o 'CAJERO'
      },
      select: this.usuarioSelect,
    });
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: this.usuarioSelect,
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: this.usuarioSelect,
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    await this.assertUsuarioExiste(id);

    const data: UpdateUsuarioDto = { ...updateUsuarioDto };

    if (updateUsuarioDto.password) {
      const saltRounds = 10;
      data.password = await bcrypt.hash(updateUsuarioDto.password, saltRounds);
    }

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: this.usuarioSelect,
    });
  }

  async remove(id: number) {
    await this.assertUsuarioExiste(id);

    return this.prisma.usuario.delete({
      where: { id },
      select: this.usuarioSelect,
    });
  }

  private async assertUsuarioExiste(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
