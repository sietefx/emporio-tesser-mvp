// Textos de "como foi calculado", para o usuário conferir os números na tela.
import { reais, qtd, pct } from './formato'

export function quantidadeEsperada(quantidadeNota: number, fator: number) {
  return Math.round(quantidadeNota * fator * 1000) / 1000
}

export function memoriaDoItem(p: {
  quantidadeNota: number
  unidadeNota: string
  fator: number
  unidadeEstoque: string
  quantidadeRecebida: number
  valorTotal: number
}) {
  const esperada = quantidadeEsperada(p.quantidadeNota, p.fator)
  const conversao = `${qtd(p.quantidadeNota)} ${p.unidadeNota} × ${qtd(p.fator)} = ${qtd(esperada)} ${p.unidadeEstoque}`
  const custo =
    p.quantidadeRecebida > 0
      ? `${reais(p.valorTotal)} ÷ ${qtd(p.quantidadeRecebida)} ${p.unidadeEstoque} = ${reais(p.valorTotal / p.quantidadeRecebida)} por ${p.unidadeEstoque}`
      : null
  const divergente = p.quantidadeRecebida > 0 && Math.abs(p.quantidadeRecebida - esperada) > 0.0005
  return { conversao, custo, esperada, divergente }
}

export function memoriaDoCmv(custo: number, preco: number, comissao = 0) {
  if (comissao > 0) {
    const liquido = preco * (1 - comissao)
    return `${reais(custo)} ÷ (${reais(preco)} − ${pct(comissao)}) = ${pct(custo / liquido)}`
  }
  return `${reais(custo)} ÷ ${reais(preco)} = ${pct(custo / preco)}`
}
