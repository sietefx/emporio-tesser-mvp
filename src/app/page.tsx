import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'

export default async function Inicio() {
  redirect((await usuarioAtual()) ? '/painel' : '/login')
}
