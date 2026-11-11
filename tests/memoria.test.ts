import { describe, expect, it } from 'vitest'
import { memoriaDoCmv, memoriaDoItem, quantidadeEsperada } from '@/lib/memoria'

const n = (t: string | null) => t?.replace(/ /g, ' ')

describe('memória de cálculo', () => {
  it('recalcula a quantidade pelo fator', () => {
    expect(quantidadeEsperada(1, 20)).toBe(20)
    expect(quantidadeEsperada(3, 0.25)).toBe(0.75)
  })

  it('mostra conversão e custo do item', () => {
    const m = memoriaDoItem({ quantidadeNota: 1, unidadeNota: 'CX', fator: 20, unidadeEstoque: 'kg', quantidadeRecebida: 20, valorTotal: 158 })
    expect(n(m.conversao)).toBe('1 CX × 20 = 20 kg')
    expect(n(m.custo)).toBe('R$ 158,00 ÷ 20 kg = R$ 7,90 por kg')
    expect(m.divergente).toBe(false)
  })

  it('avisa quando o recebido é diferente da nota', () => {
    const m = memoriaDoItem({ quantidadeNota: 1, unidadeNota: 'CX', fator: 20, unidadeEstoque: 'kg', quantidadeRecebida: 18, valorTotal: 158 })
    expect(m.divergente).toBe(true)
  })

  it('explica o CMV com e sem comissão', () => {
    expect(n(memoriaDoCmv(11.88, 58))).toBe('R$ 11,88 ÷ R$ 58,00 = 20,5%')
    expect(n(memoriaDoCmv(11.88, 64, 0.23))).toBe('R$ 11,88 ÷ (R$ 64,00 − 23,0%) = 24,1%')
  })
})
