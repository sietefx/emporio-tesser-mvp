// Regra de custo da aprovação, separada do banco para poder ser testada sozinha.

export type ItemAprovado = {
  insumoId: number
  quantidadeRecebida: number
  valorTotal: number
}

export type EntradaInsumo = {
  insumoId: number
  quantidade: number
  custoUnitario: number
  custoAnterior: number | null
}

// Agrupa por insumo: se a nota trouxer o mesmo insumo em duas linhas (ex.: tomate em caixa e a granel),
// o custo é a média ponderada da nota, e não o valor da última linha.
export function calcularEntradas(itens: ItemAprovado[], custosAtuais: Map<number, number | null>): EntradaInsumo[] {
  const porInsumo = new Map<number, { quantidade: number; valor: number }>()
  for (const i of itens) {
    if (!(i.quantidadeRecebida > 0)) throw new Error(`quantidade inválida para o insumo ${i.insumoId}`)
    const atual = porInsumo.get(i.insumoId) ?? { quantidade: 0, valor: 0 }
    atual.quantidade += i.quantidadeRecebida
    atual.valor += i.valorTotal
    porInsumo.set(i.insumoId, atual)
  }

  return [...porInsumo].map(([insumoId, { quantidade, valor }]) => ({
    insumoId,
    quantidade,
    custoUnitario: Math.round((valor / quantidade) * 10000) / 10000,
    custoAnterior: custosAtuais.get(insumoId) ?? null,
  }))
}
