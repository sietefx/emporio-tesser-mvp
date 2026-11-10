import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronLeft, Check, TriangleAlert } from 'lucide-react'
import { exigirPapel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { motivoBloqueio } from '@/lib/conferencia'
import { data, reais } from '@/lib/formato'
import { ItemConferencia } from './ItemConferencia'
import { BarraAprovacao } from './BarraAprovacao'

export default async function Conferencia({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel('GERENTE')
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const nota = await prisma.notaCompra.findUnique({
    where: { id },
    include: { fornecedor: true, parcelas: { orderBy: { vencimento: 'asc' } }, itens: { orderBy: { numeroItem: 'asc' }, include: { insumo: true } } },
  })
  if (!nota) notFound()
  if (nota.status === 'APROVADA') redirect(`/notas/${id}/resultado`)

  const [insumos, posicao, total] = await Promise.all([
    prisma.insumo.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true, unidade: true } }),
    prisma.notaCompra.count({ where: { status: 'PENDENTE', recebidaEm: { lte: nota.recebidaEm } } }),
    prisma.notaCompra.count({ where: { status: 'PENDENTE' } }),
  ])

  const itens = nota.itens.map((i) => ({
    id: i.id,
    numeroItem: i.numeroItem,
    descricao: i.descricao,
    unidade: i.unidade,
    quantidade: Number(i.quantidade),
    valorTotal: Number(i.valorTotal),
    insumo: i.insumo ? { id: i.insumo.id, nome: i.insumo.nome, unidade: i.insumo.unidade } : null,
    fator: Number(i.fatorConversao),
    quantidadeRecebida: i.quantidadeRecebida === null ? null : Number(i.quantidadeRecebida),
  }))
  const motivo = motivoBloqueio(itens.map((i) => ({ numeroItem: i.numeroItem, insumoId: i.insumo?.id ?? null, quantidadeRecebida: i.quantidadeRecebida })))
  const prontos = itens.filter((i) => i.insumo && (i.quantidadeRecebida ?? 0) > 0).length
  const parcelas = nota.parcelas.length
    ? nota.parcelas.map((p) => `vence ${data(p.vencimento)}`).join(', ')
    : 'à vista'

  return (
    <>
      <header className="appbar">
        <Link className="back" href="/notas"><ChevronLeft className="ic ic-lg" aria-hidden />Fila</Link>
        <h1>Conferir nota</h1>
        <span className="meta">{posicao} de {total}</span>
      </header>
      <main>
        <section className="card" aria-labelledby="forn">
          <div className="row between">
            <p id="forn" style={{ fontSize: 19, fontWeight: 600 }}>{nota.fornecedor.nome}</p>
            {motivo ? (
              <span className="badge b-amber"><TriangleAlert className="ic ic-sm" aria-hidden />Com pendência</span>
            ) : (
              <span className="badge b-green"><Check className="ic ic-sm" aria-hidden />Pronta para aprovar</span>
            )}
          </div>
          <dl className="kv">
            <dt>NF-e</dt><dd>nº {nota.numero} · emitida em {data(nota.emitidaEm)}</dd>
            <dt>Total</dt><dd>{reais(Number(nota.valorTotal))}</dd>
            <dt>Pagamento</dt><dd>{nota.parcelas.length || 1} parcela{nota.parcelas.length > 1 ? 's' : ''} · {parcelas}</dd>
          </dl>
          <p className="small"><b>{prontos} de {itens.length} itens prontos</b></p>
        </section>

        <p className="small muted">Confira cada item: ligue ao insumo do estoque e confirme a quantidade que chegou.</p>

        {itens.map((i) => (
          <ItemConferencia key={`${i.id}-${i.insumo?.id ?? 'x'}-${i.quantidadeRecebida}`} notaId={nota.id} item={i} insumos={insumos} />
        ))}

        <BarraAprovacao
          notaId={nota.id}
          numero={nota.numero}
          motivo={motivo}
          resumo={[
            `${itens.length} entradas no estoque`,
            `Custo de ${itens.length} insumos atualizado`,
            `${nota.parcelas.length || 1} conta(s) a pagar, total ${reais(Number(nota.valorTotal))}`,
          ]}
        />
      </main>
    </>
  )
}
