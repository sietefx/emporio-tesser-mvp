'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { conferirSenha, gerarHash, CUSTO_BCRYPT } from '@/lib/senha'
import { COOKIE_SESSAO, DURACAO_SESSAO_S, criarToken } from '@/lib/sessao'
import { registrarTentativa } from '@/lib/limiteTentativas'

const entrada = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  senha: z.string().min(1).max(200),
})

export type EstadoLogin = { erro?: string; email?: string }

const ERRO_GENERICO = 'E-mail ou senha incorretos.'

export async function entrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!registrarTentativa(`login:${ip}`)) {
    return { erro: 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.' }
  }

  const dados = entrada.safeParse({ email: form.get('email'), senha: form.get('senha') })
  if (!dados.success) return { erro: ERRO_GENERICO, email: String(form.get('email') ?? '') }

  const usuario = await prisma.usuario.findUnique({ where: { email: dados.data.email } })
  const ok = await conferirSenha(dados.data.senha, usuario?.senhaHash)
  if (!usuario || !ok || !usuario.ativo) return { erro: ERRO_GENERICO, email: dados.data.email }

  // hash antigo com custo menor é refeito no login
  if (!usuario.senhaHash.startsWith(`$2b$${CUSTO_BCRYPT}$`) && !usuario.senhaHash.startsWith(`$2a$${CUSTO_BCRYPT}$`)) {
    await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash: await gerarHash(dados.data.senha) } })
  }

  ;(await cookies()).set(COOKIE_SESSAO, criarToken(usuario.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DURACAO_SESSAO_S,
  })
  redirect('/painel')
}
