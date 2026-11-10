import bcrypt from 'bcryptjs'

export const CUSTO_BCRYPT = 12

// hash usado quando o e-mail não existe, para o tempo de resposta ser parecido
let hashFalso: string | undefined
const obterHashFalso = () => (hashFalso ??= bcrypt.hashSync('usuario-inexistente', CUSTO_BCRYPT))

const SENHAS_COMUNS = new Set(['12345678', '123456789', 'senha123', 'password', 'qwertyui', '11111111', 'emporio123'])

export function validarNovaSenha(senha: string): string | null {
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (SENHAS_COMUNS.has(senha.toLowerCase())) return 'Essa senha é muito comum. Escolha outra.'
  return null
}

export function gerarHash(senha: string) {
  return bcrypt.hash(senha, CUSTO_BCRYPT)
}

export async function conferirSenha(senha: string, hash: string | null | undefined) {
  const ok = await bcrypt.compare(senha, hash ?? obterHashFalso())
  return hash ? ok : false
}
