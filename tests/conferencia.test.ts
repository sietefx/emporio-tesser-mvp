import { describe, expect, it } from 'vitest'
import { motivoBloqueio, pendenciasDosItens } from '@/lib/conferencia'

describe('conferência da nota', () => {
  const ok = { numeroItem: 1, insumoId: 1, quantidadeRecebida: 20 }

  it('libera quando todos os itens estão ligados e com quantidade', () => {
    expect(pendenciasDosItens([ok, { ...ok, numeroItem: 2 }])).toEqual([])
    expect(motivoBloqueio([ok])).toBeNull()
  })

  it('aponta item sem insumo', () => {
    expect(motivoBloqueio([ok, { numeroItem: 3, insumoId: null, quantidadeRecebida: 12 }])).toBe(
      'Falta resolver 1 item (item 3 sem insumo) para aprovar.',
    )
  })

  it('lista todas as pendências quando há mais de uma', () => {
    expect(motivoBloqueio([{ numeroItem: 1, insumoId: null, quantidadeRecebida: 1 }, { numeroItem: 2, insumoId: 2, quantidadeRecebida: null }])).toBe(
      'Faltam 2 itens para aprovar: item 1 sem insumo; item 2 sem quantidade recebida.',
    )
  })

  it('aponta quantidade zerada', () => {
    expect(pendenciasDosItens([{ ...ok, quantidadeRecebida: 0 }])).toEqual(['Item 1 sem quantidade recebida'])
  })
})
