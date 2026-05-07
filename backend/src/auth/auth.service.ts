import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  //
  async login(loginDto: LoginDto) {
    const usuarioEncontrado = await this.prisma.usuario.findUnique({
      where: { usuario: loginDto.usuario },
    });

    if (!usuarioEncontrado) {
      throw new UnauthorizedException('Credenciales incorrectass');
    }

    if (!usuarioEncontrado.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const passwordValido = await bcrypt.compare(
      loginDto.password,
      usuarioEncontrado.password,
    );

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    //generar jwt  con los datos importantes del usuario
    const payload = {
      sub: usuarioEncontrado.id,
      usuario: usuarioEncontrado.usuario,
      rol: usuarioEncontrado.rol,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: {
        id: usuarioEncontrado.id,
        nombre: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol,
      },
    };
  }
}
