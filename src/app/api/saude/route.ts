import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// usado pelo monitor agendado: responde 200 só se a aplicação e o banco estão de pé
export async function GET() {
  const inicio = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json(
      { status: 'ok', banco: 'ok', tempoMs: Date.now() - inicio, versao: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    console.error('saude: banco indisponível', e)
    return NextResponse.json({ status: 'erro', banco: 'indisponivel' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
