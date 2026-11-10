import { createHmac, timingSafeEqual } from 'node:crypto'

export const COOKIE_SESSAO = 'sessao'
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 30

type DadosSessao = { uid: number; iat: number }

function segredo() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('SESSION_SECRET ausente ou com menos de 32 caracteres')
  return s
}

function assinar(conteudo: string) {
  return createHmac('sha256', segredo()).update(conteudo).digest('base64url')
}

export function criarToken(uid: number, agora = Date.now()) {
  const dados: DadosSessao = { uid, iat: Math.floor(agora / 1000) }
  const conteudo = Buffer.from(JSON.stringify(dados)).toString('base64url')
  return `${conteudo}.${assinar(conteudo)}`
}

export function lerToken(token: string | undefined, agora = Date.now()): DadosSessao | null {
  if (!token) return null
  const [conteudo, assinatura] = token.split('.')
  if (!conteudo || !assinatura) return null

  const esperada = Buffer.from(assinar(conteudo))
  const recebida = Buffer.from(assinatura)
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null

  try {
    const dados = JSON.parse(Buffer.from(conteudo, 'base64url').toString()) as DadosSessao
    if (typeof dados.uid !== 'number' || typeof dados.iat !== 'number') return null
    if (agora / 1000 - dados.iat > DURACAO_SESSAO_S) return null
    return dados
  } catch {
    return null
  }
}
