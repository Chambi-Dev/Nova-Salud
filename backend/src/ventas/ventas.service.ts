import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateVentaDto } from './dto/create-venta.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VentasService {
  constructor(private prisma: PrismaService) {}

  async create(createVentaDto: CreateVentaDto, usuarioId: number) {
    // Iniciamos la Transacción Interactiva.
    // TODO lo que pase aquí dentro debe usar "tx" en lugar de "this.prisma".
    // Si una sola línea falla, PostgreSQL revierte todo automáticamente (Rollback).
    return this.prisma.$transaction(async (tx) => {
      let totalVenta = 0;
      const detallesParaInsertar: {
        productoId: number;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }[] = [];

      // 1. Procesar cada producto del carrito
      for (const item of createVentaDto.detalles) {
        // Aseguramos que la cantidad sea tratada como número
        const cantidadAVender = Number(item.cantidad);

        const producto = await tx.producto.findUnique({
          where: { id: item.productoId },
        });

        if (!producto || !producto.activo) {
          throw new BadRequestException(
            `El producto ${item.productoId} no está disponible`,
          );
        }

        const lotes = await tx.lote.findMany({
          where: {
            productoId: item.productoId,
            stockActual: { gt: 0 },
            activo: true,
          },
          orderBy: { fechaVencimiento: 'asc' },
        });

        const stockTotal = lotes.reduce(
          (suma, lote) => suma + lote.stockActual,
          0,
        );

        if (stockTotal < cantidadAVender) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.nombre}`,
          );
        }

        let pendientePorRestar = cantidadAVender;

        for (const lote of lotes) {
          if (pendientePorRestar <= 0) break;

          const cantidadARestarDeEsteLote = Math.min(
            lote.stockActual,
            pendientePorRestar,
          );

          // ACTUALIZACIÓN ATÓMICA: Le pedimos a la DB que reste
          await tx.lote.update({
            where: { id: lote.id },
            data: {
              stockActual: {
                decrement: cantidadARestarDeEsteLote,
              },
            },
          });

          pendientePorRestar -= cantidadARestarDeEsteLote;
        }

        const precioUnitario = Number(producto.precioVentaActual);
        const subtotal = precioUnitario * cantidadAVender;
        totalVenta += subtotal;

        detallesParaInsertar.push({
          productoId: producto.id,
          cantidad: cantidadAVender,
          precioUnitario: precioUnitario,
          subtotal: subtotal,
        });
      }

      // 2. Crear la Cabecera de la Venta
      const nuevaVenta = await tx.venta.create({
        data: {
          usuarioId: usuarioId, // El cajero que hizo la venta
          clienteId: createVentaDto.clienteId || null,
          total: totalVenta,
          estado: 'COMPLETADA',
          // 3. Crear los Detalles de la Venta enlazados a la cabecera
          detalles: {
            create: detallesParaInsertar,
          },
        },
        include: {
          detalles: true, // Que nos devuelva los detalles en el JSON de respuesta
        },
      });

      return nuevaVenta;
    });
  }

  // Métodos de lectura básicos
  async findAll() {
    return this.prisma.venta.findMany({
      include: { usuario: { select: { nombre: true } }, cliente: true },
      orderBy: { fechaVenta: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.venta.findUnique({
      where: { id },
      include: {
        detalles: { include: { producto: true } },
        usuario: { select: { nombre: true } },
        cliente: true,
      },
    });
  }
}
