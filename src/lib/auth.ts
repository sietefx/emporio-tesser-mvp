import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import { COOKIE_SESSAO, lerToken } from './sessao'
import type { Papel } from '@/generated/prisma/enums'

export async function usuarioAtual() {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value
  const dados = lerToken(token)
  if (!dados) return null

  const usuario = await prisma.usuario.findUnique({ where: { id: dados.uid } })
  if (!usuario || !usuario.ativo) return null
  // token emitido antes do último "sair de todos os aparelhos"
  if (dados.iat < Math.floor(usuario.sessoesValidasDesde.getTime() / 1000)) return null
  return usuario
}

export async function exigirUsuario() {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/login')
  return usuario
}

export async function exigirPapel(...papeis: Papel[]) {
  const usuario = await exigirUsuario()
  if (!papeis.includes(usuario.papel)) redirect('/painel?semPermissao=1')
  return usuario
}

export const podeVerCompras = (papel: Papel) => papel === 'GERENTE'
