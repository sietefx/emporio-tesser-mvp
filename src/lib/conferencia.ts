// regras de conferência que valem tanto para a tela quanto para o servidor

export type ItemConferencia = {
  numeroItem: number
  insumoId: number | null
  quantidadeRecebida: number | null
}

export function pendenciasDosItens(itens: ItemConferencia[]) {
  const pendencias: string[] = []
  for (const i of itens) {
    if (!i.insumoId) pendencias.push(`Item ${i.numeroItem} sem insumo`)
    else if (!i.quantidadeRecebida || i.quantidadeRecebida <= 0) pendencias.push(`Item ${i.numeroItem} sem quantidade recebida`)
  }
  return pendencias
}

export function motivoBloqueio(itens: ItemConferencia[]) {
  const p = pendenciasDosItens(itens)
  if (p.length === 0) return null
  if (p.length === 1) return `Falta resolver 1 item (${p[0].toLowerCase()}) para aprovar.`
  return `Faltam ${p.length} itens para aprovar: ${p.join('; ').toLowerCase()}.`
}
