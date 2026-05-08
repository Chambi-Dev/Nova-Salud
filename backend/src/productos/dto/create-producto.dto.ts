import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @IsNotEmpty({ message: 'El código es obligatorio' })
  codigo: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsNumber({}, { message: 'El porcentaje debe ser un número' })
  @Min(0, { message: 'El porcentaje de ganancia no puede ser negativo' })
  porcentajeGanancia: number;

  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(1)
  @IsOptional()
  stockMinimo?: number;

  @IsNumber()
  @IsOptional()
  categoriaId?: number;
}
