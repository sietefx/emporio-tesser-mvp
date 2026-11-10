// limite simples em memória: suficiente para um container só
const janelas = new Map<string, { inicio: number; total: number }>()

export function registrarTentativa(chave: string, limite = 10, janelaMs = 60_000, agora = Date.now()) {
  const atual = janelas.get(chave)
  if (!atual || agora - atual.inicio > janelaMs) {
    janelas.set(chave, { inicio: agora, total: 1 })
    return true
  }
  atual.total++
  return atual.total <= limite
}
