import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoriaDto } from './create-categoria.dto';

// PartialType hace que todos los campos de CreateCategoriaDto sean opcionales para el UPDATE
export class UpdateCategoriaDto extends PartialType(CreateCategoriaDto) {}
