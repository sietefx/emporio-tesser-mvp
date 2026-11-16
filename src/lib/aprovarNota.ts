import type { PrismaClient } from '@/generated/prisma/client'
import { pendenciasDosItens } from './conferencia'
import { calcularEntradas } from './entradas'

export class AprovacaoBloqueada extends Error {}

// RF03: custo, estoque e contas a pagar mudam juntos; se algo falhar, nada é gravado
export async function aprovarNota(db: PrismaClient, notaId: number, usuarioId: number) {
  return db.$transaction(async (tx) => {
    const nota = await tx.notaCompra.findUnique({
      where: { id: notaId },
      include: { itens: true, parcelas: true },
    })
    if (!nota) throw new AprovacaoBloqueada('Nota não encontrada.')
    if (nota.status !== 'PENDENTE') throw new AprovacaoBloqueada('Esta nota já foi aprovada.')

    const pendencias = pendenciasDosItens(
      nota.itens.map((i) => ({
        numeroItem: i.numeroItem,
        insumoId: i.insumoId,
        quantidadeRecebida: i.quantidadeRecebida === null ? null : Number(i.quantidadeRecebida),
      })),
    )
    if (pendencias.length) throw new AprovacaoBloqueada(`Não dá para aprovar: ${pendencias.join(', ').toLowerCase()}.`)

    // trava contra aprovação dupla (dois cliques, duas abas)
    const marcada = await tx.notaCompra.updateMany({
      where: { id: notaId, status: 'PENDENTE' },
      data: { status: 'APROVADA', aprovadaEm: new Date(), aprovadaPorId: usuarioId },
    })
    if (marcada.count === 0) throw new AprovacaoBloqueada('Esta nota já foi aprovada.')

    const itens = nota.itens.map((i) => ({
      insumoId: i.insumoId!,
      quantidadeRecebida: Number(i.quantidadeRecebida),
      valorTotal: Number(i.valorTotal),
    }))
    const insumos = await tx.insumo.findMany({
      where: { id: { in: [...new Set(itens.map((i) => i.insumoId))] } },
      select: { id: true, custoUnitario: true },
    })
    const custosAtuais = new Map(insumos.map((i) => [i.id, i.custoUnitario === null ? null : Number(i.custoUnitario)]))
    const entradas = calcularEntradas(itens, custosAtuais)

    for (const e of entradas) {
      await tx.insumo.update({
        where: { id: e.insumoId },
        data: { custoUnitario: e.custoUnitario, saldo: { increment: e.quantidade } },
      })
    }
    await tx.movimentoEstoque.createMany({ data: entradas.map((e) => ({ ...e, notaId })) })

    for (const item of nota.itens) {
      await tx.vinculoFornecedor.upsert({
        where: { fornecedorId_codigoProduto: { fornecedorId: nota.fornecedorId, codigoProduto: item.codigoProduto } },
        update: { insumoId: item.insumoId!, fatorConversao: item.fatorConversao },
        create: { fornecedorId: nota.fornecedorId, codigoProduto: item.codigoProduto, insumoId: item.insumoId!, fatorConversao: item.fatorConversao },
      })
    }

    const parcelas = nota.parcelas.length
      ? nota.parcelas
      : [{ numero: '001', vencimento: nota.emitidaEm, valor: nota.valorTotal }]
    await tx.contaPagar.createMany({
      data: parcelas.map((p) => ({
        notaId,
        fornecedorId: nota.fornecedorId,
        descricao: `NF-e ${nota.numero} parcela ${p.numero}`,
        valor: p.valor,
        vencimento: p.vencimento,
      })),
    })
  })
}
