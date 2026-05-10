import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Cargamos tu .env a la memoria de Node.js
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  console.error(
    `❌ ERROR CRÍTICO: No se encontró DATABASE_URL en el archivo: ${envPath}`,
  );
  process.exit(1);
}

// 2. Inicializacion con adapter para Prisma 7.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando la siembra (seeding) de la base de datos...');

  const usuariosCount = await prisma.usuario.count();

  if (usuariosCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const superAdmin = await prisma.usuario.create({
      data: {
        nombre: 'Administrador Principal',
        usuario: 'admin',
        password: hashedPassword,
        rol: 'ADMIN',
        activo: true,
      },
    });

    console.log(' ¡Éxito! Usuario administrador creado.');
    console.log(` Usuario: ${superAdmin.usuario}`);
    console.log(' Contraseña: admin123');
  } else {
    console.log(
      '⚠️ La base de datos ya tiene usuarios. No se requiere siembra inicial.',
    );
  }
}

main()
  .catch((e) => {
    console.error('❌ Error durante la siembra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
