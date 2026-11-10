import { beforeAll, describe, expect, it } from 'vitest'
import { CUSTO_BCRYPT, conferirSenha, gerarHash, validarNovaSenha } from '@/lib/senha'
import { criarToken, lerToken } from '@/lib/sessao'
import { registrarTentativa } from '@/lib/limiteTentativas'

beforeAll(() => {
  process.env.SESSION_SECRET = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres'
})

describe('senha', () => {
  it('gera bcrypt com custo 12 e confere', async () => {
    const hash = await gerarHash('cozinha-quente-2026')
    expect(hash).toMatch(new RegExp(`^\\$2[ab]\\$${CUSTO_BCRYPT}\\$`))
    expect(await conferirSenha('cozinha-quente-2026', hash)).toBe(true)
    expect(await conferirSenha('outra', hash)).toBe(false)
  }, 20_000)

  it('responde falso para usuário inexistente', async () => {
    expect(await conferirSenha('qualquer', undefined)).toBe(false)
  }, 20_000)

  it('recusa senha curta ou comum', () => {
    expect(validarNovaSenha('1234')).not.toBeNull()
    expect(validarNovaSenha('12345678')).not.toBeNull()
    expect(validarNovaSenha('manjericao-verde')).toBeNull()
  })
})

describe('sessão', () => {
  it('lê o token que assinou', () => {
    expect(lerToken(criarToken(7))?.uid).toBe(7)
  })

  it('recusa token alterado', () => {
    const [conteudo, assinatura] = criarToken(7).split('.')
    const outro = Buffer.from(JSON.stringify({ uid: 1, iat: Math.floor(Date.now() / 1000) })).toString('base64url')
    expect(lerToken(`${outro}.${assinatura}`)).toBeNull()
    expect(lerToken(`${conteudo}.x${assinatura}`)).toBeNull()
  })

  it('expira depois de 30 dias', () => {
    const token = criarToken(7, Date.now() - 31 * 24 * 3600 * 1000)
    expect(lerToken(token)).toBeNull()
  })
})

describe('limite de tentativas', () => {
  it('bloqueia a 11ª tentativa no mesmo minuto', () => {
    const agora = 1_000_000
    for (let i = 0; i < 10; i++) expect(registrarTentativa('teste', 10, 60_000, agora)).toBe(true)
    expect(registrarTentativa('teste', 10, 60_000, agora + 1000)).toBe(false)
    expect(registrarTentativa('teste', 10, 60_000, agora + 61_000)).toBe(true)
  })
})
