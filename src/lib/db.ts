import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'

const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient }

function criarCliente() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// em dev o Next recarrega os módulos; reaproveita a conexão
export const prisma = globalParaPrisma.prisma ?? criarCliente()
if (process.env.NODE_ENV !== 'production') globalParaPrisma.prisma = prisma
