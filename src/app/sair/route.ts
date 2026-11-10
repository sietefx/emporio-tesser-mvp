import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { usuarioAtual } from '@/lib/auth'
import { COOKIE_SESSAO } from '@/lib/sessao'

// sair encerra a sessão em todos os aparelhos
export async function POST(req: Request) {
  const usuario = await usuarioAtual()
  if (usuario) {
    await prisma.usuario.update({ where: { id: usuario.id }, data: { sessoesValidasDesde: new Date() } })
  }
  ;(await cookies()).delete(COOKIE_SESSAO)
  return NextResponse.redirect(new URL('/login', req.url), 303)
}
