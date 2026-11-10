import type { PrismaClient } from '@/generated/prisma/client'
import { hashXml, lerNfe } from './nfe'

export type ResultadoImportacao =
  | { tipo: 'importada'; notaId: number; numero: string; outroDestinatario: boolean }
  | { tipo: 'duplicada'; notaId: number; numero: string }

// RF01: registra a NF-e na fila como pendente. Não mexe em estoque nem financeiro.
export async function importarNota(db: PrismaClient, xml: string): Promise<ResultadoImportacao> {
  const nfe = lerNfe(xml)
  const hash = hashXml(xml)

  const existente = await db.notaCompra.findFirst({
    where: { OR: [{ chave: nfe.chave }, { xmlHash: hash }] },
    select: { id: true, numero: true },
  })
  if (existente) return { tipo: 'duplicada', notaId: existente.id, numero: existente.numero }

  const fornecedor = await db.fornecedor.upsert({
    where: { cnpj: nfe.emitente.cnpj },
    update: {},
    create: { cnpj: nfe.emitente.cnpj, nome: nfe.emitente.nome },
  })

  // sugestão: ligação feita em notas anteriores do mesmo fornecedor
  const vinculos = await db.vinculoFornecedor.findMany({
    where: { fornecedorId: fornecedor.id, codigoProduto: { in: nfe.itens.map((i) => i.codigoProduto) } },
  })
  const porCodigo = new Map(vinculos.map((v) => [v.codigoProduto, v]))

  const nota = await db.notaCompra.create({
    data: {
      chave: nfe.chave,
      xmlHash: hash,
      numero: nfe.numero,
      serie: nfe.serie,
      emitidaEm: nfe.emitidaEm,
      destinatarioCnpj: nfe.destinatarioCnpj,
      valorTotal: nfe.valorTotal,
      xml,
      fornecedorId: fornecedor.id,
      itens: {
        create: nfe.itens.map((i) => {
          const v = porCodigo.get(i.codigoProduto)
          const fator = v ? Number(v.fatorConversao) : 1
          return {
            numeroItem: i.numeroItem,
            codigoProduto: i.codigoProduto,
            descricao: i.descricao,
            ean: i.ean,
            quantidade: i.quantidade,
            unidade: i.unidade,
            valorTotal: i.valorTotal,
            insumoId: v?.insumoId ?? null,
            fatorConversao: fator,
            quantidadeRecebida: i.quantidade * fator,
          }
        }),
      },
      parcelas: { create: nfe.parcelas },
    },
  })

  const cnpjDaCasa = process.env.CNPJ_RESTAURANTE
  return {
    tipo: 'importada',
    notaId: nota.id,
    numero: nota.numero,
    outroDestinatario: Boolean(cnpjDaCasa && cnpjDaCasa !== nfe.destinatarioCnpj),
  }
}
