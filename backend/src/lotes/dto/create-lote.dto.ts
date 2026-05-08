import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateLoteDto {
  @IsNumber()
  @IsNotEmpty()
  productoId: number;

  @IsString()
  @IsOptional()
  codigoLote?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El precio de compra debe ser mayor a 0' })
  precioCompra: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad inicial debe ser al menos 1' })
  cantidadInicial: number;

  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida' },
  )
  fechaVencimiento: string;
}
