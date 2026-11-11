import { describe, expect, it } from 'vitest'
import { calcularEntradas } from '@/lib/entradas'

describe('calcularEntradas', () => {
  it('calcula o custo unitário pelo valor da nota e guarda o custo anterior', () => {
    const [e] = calcularEntradas([{ insumoId: 1, quantidadeRecebida: 20, valorTotal: 158 }], new Map([[1, 6.8]]))
    expect(e).toEqual({ insumoId: 1, quantidade: 20, custoUnitario: 7.9, custoAnterior: 6.8 })
  })

  it('junta linhas do mesmo insumo com média ponderada', () => {
    const r = calcularEntradas(
      [
        { insumoId: 1, quantidadeRecebida: 20, valorTotal: 158 },
        { insumoId: 1, quantidadeRecebida: 5, valorTotal: 45 },
      ],
      new Map(),
    )
    expect(r).toHaveLength(1)
    expect(r[0].quantidade).toBe(25)
    expect(r[0].custoUnitario).toBe(8.12) // 203 / 25, e não 9,00 da última linha
  })

  it('recusa quantidade zerada', () => {
    expect(() => calcularEntradas([{ insumoId: 1, quantidadeRecebida: 0, valorTotal: 10 }], new Map())).toThrow()
  })
})
