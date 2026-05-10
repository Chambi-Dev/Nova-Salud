# Nova Salud - Guia de instalacion y ejecucion

Esta guia cubre la clonacion del proyecto, instalacion de dependencias, configuracion de entorno, migraciones con Prisma, semilla inicial y como levantar backend y frontend.

## Requisitos previos

- Node.js (recomendado LTS)
- npm
- PostgreSQL en ejecucion

## 1) Clonar el proyecto

```powershell
# Reemplaza la URL por tu repositorio
Git clone <URL_DEL_REPOSITORIO>
Set-Location "Nova-Salud"
```

## 2) Instalar dependencias

### Backend

```powershell
Set-Location "Nova-Salud\backend"
npm install
```

### Frontend

```powershell
Set-Location "Nova-Salud\frontend"
npm install
```

## 3) Configurar variables de entorno (.env)

Crea el archivo `backend/.env` con este contenido. Reemplaza los valores con los de tu base de datos:

```dotenv
DATABASE_URL="postgresql://postgres:contrasena@host:puerto/basededatos?schema=public"
JWT_SECRET="NobaSalud2026"
```

- `DATABASE_URL`: cadena de conexion a PostgreSQL.
- `JWT_SECRET`: clave secreta para firmar los tokens JWT (cambiala en produccion).

## 4) Migrar la base de datos con Prisma

Desde `backend/` ejecuta:

```powershell
Set-Location "Nova-Salud\backend"
# Genera el cliente y aplica migraciones a la BD local
npx prisma migrate dev
```

Si deseas solo generar el cliente (opcional):

```powershell
npx prisma generate
```

## 5) Ejecutar la semilla (seed)

Desde `backend/` ejecuta:

```powershell
Set-Location "Nova-Salud\backend"
npx prisma db seed
```

Usuario inicial creado por el seed:

- usuario: `admin`
- contrasena: `admin123`

## 6) Levantar backend y frontend

### Backend (NestJS)

```powershell
Set-Location "Nova-Salud\backend"
npm run start:dev
```

### Frontend (Vite)

```powershell
Set-Location "Nova-Salud\frontend"
npm run dev
```

## Scripts utiles

Backend (`backend/package.json`):

- `npm run start:dev` ejecuta el servidor en modo desarrollo.
- `npm run build` compila el proyecto.
- `npm run test` ejecuta pruebas.
- `npx prisma migrate dev` aplica migraciones.
- `npx prisma db seed` ejecuta la semilla.

Frontend (`frontend/package.json`):

- `npm run dev` levanta el frontend.
- `npm run build` genera build de produccion.
- `npm run preview` previsualiza el build.

## Notas

- Asegurate de que PostgreSQL este encendido y accesible con la `DATABASE_URL`.
- Si el seed no inserta el usuario, puede ser porque ya existen usuarios en la tabla.

