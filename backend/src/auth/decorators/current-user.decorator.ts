import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 1. Le decimos a TypeScript exactamente qué forma tiene el usuario dentro del token
export interface PayloadUsuario {
  sub: number;
  usuario: string;
  rol: string;
}

//  la Request normal de Express para decirle que ahora trae un 'user'
export interface AuthenticatedRequest extends Request {
  user: PayloadUsuario;
}

export const UsuarioActual = createParamDecorator(
  //  Le ponemos un guion bajo a _data para decirle a ESLint "sé que no la uso, ignórala"
  (_data: unknown, ctx: ExecutionContext) => {
    // 4Casteamos la request con nuestra interfaz estricta en lugar de usar 'any'
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user;
  },
);
