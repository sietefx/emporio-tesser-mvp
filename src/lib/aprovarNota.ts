import type { PrismaClient } from '@/generated/prisma/client'
import { pendenciasDosItens } from './conferencia'

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

    for (const item of nota.itens) {
      const insumoId = item.insumoId!
      const qtdRecebida = Number(item.quantidadeRecebida)
      const custoNovo = Number(item.valorTotal) / qtdRecebida
      const insumo = await tx.insumo.findUniqueOrThrow({ where: { id: insumoId } })

      await tx.insumo.update({
        where: { id: insumoId },
        data: { custoUnitario: custoNovo, saldo: { increment: qtdRecebida } },
      })
      await tx.movimentoEstoque.create({
        data: { insumoId, notaId, quantidade: qtdRecebida, custoUnitario: custoNovo, custoAnterior: insumo.custoUnitario },
      })
      await tx.vinculoFornecedor.upsert({
        where: { fornecedorId_codigoProduto: { fornecedorId: nota.fornecedorId, codigoProduto: item.codigoProduto } },
        update: { insumoId, fatorConversao: item.fatorConversao },
        create: { fornecedorId: nota.fornecedorId, codigoProduto: item.codigoProduto, insumoId, fatorConversao: item.fatorConversao },
      })
    }

    const parcelas = nota.parcelas.length
      ? nota.parcelas
      : [{ numero: '001', vencimento: nota.emitidaEm, valor: nota.valorTotal }]
    for (const p of parcelas) {
      await tx.contaPagar.create({
        data: {
          notaId,
          fornecedorId: nota.fornecedorId,
          descricao: `NF-e ${nota.numero} parcela ${p.numero}`,
          valor: p.valor,
          vencimento: p.vencimento,
        },
      })
    }
  })
}
