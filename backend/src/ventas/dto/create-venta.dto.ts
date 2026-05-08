import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  Min,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';

// 1. DTO para cada línea del "carrito"
export class DetalleVentaDto {
  @IsNumber()
  @IsNotEmpty()
  productoId: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}

// 2. DTO para la venta total
export class CreateVentaDto {
  @IsOptional()
  @IsNumber()
  clienteId?: number; // Por si buscan al cliente por DNI/RUC. Si es al paso, va vacío.

  @IsOptional()
  @IsString()
  numeroDocumento?: string; // Para la API de DNI que haremos luego

  @IsArray()
  @ValidateNested({ each: true }) // Valida que cada elemento del array cumpla las reglas de DetalleVentaDto
  @Type(() => DetalleVentaDto)
  @IsNotEmpty({ message: 'El carrito no puede estar vacío' })
  detalles: DetalleVentaDto[];
}
