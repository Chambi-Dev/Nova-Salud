import { RolUsuario } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;
  
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(4, { message: 'El nombre de usuario debe tener al menos 4 caracteres' })
  usuario: string;
  
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MinLength(6, { message: 'El nombre es obligatorio' })
  password: string;
  
  @IsOptional()
  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o CAJERO' })
  rol?: RolUsuario;
}
