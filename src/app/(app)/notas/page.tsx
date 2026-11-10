import Link from 'next/link'
import { ChevronLeft, CircleCheck, Clock } from 'lucide-react'
import { exigirPapel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { data, reais } from '@/lib/formato'
import { FormImportar } from './FormImportar'

const POR_PAGINA = 20

export default async function Fila({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await exigirPapel('GERENTE')
  const pagina = Math.max(1, Number((await searchParams).pagina) || 1)

  const [pendentes, totalPendentes, aprovadas] = await Promise.all([
    prisma.notaCompra.findMany({
      where: { status: 'PENDENTE' },
      orderBy: { recebidaEm: 'asc' },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: { fornecedor: true, itens: { select: { insumoId: true } } },
    }),
    prisma.notaCompra.count({ where: { status: 'PENDENTE' } }),
    prisma.notaCompra.findMany({ where: { status: 'APROVADA' }, orderBy: { aprovadaEm: 'desc' }, take: 5, include: { fornecedor: true } }),
  ])

  return (
    <>
      <header className="appbar">
        <Link className="back" href="/painel"><ChevronLeft className="ic ic-lg" aria-hidden />Início</Link>
        <h1>Fila de notas</h1>
        <span className="meta">{totalPendentes} pendentes</span>
      </header>
      <main>
        <ul className="lista" aria-label="Notas pendentes">
          {pendentes.length === 0 && <li className="card muted">Nenhuma nota pendente.</li>}
          {pendentes.map((n) => {
            const semInsumo = n.itens.filter((i) => !i.insumoId).length
            return (
              <li key={n.id}>
                <Link className="card" href={`/notas/${n.id}`}>
                  <div className="row between">
                    <strong>{n.fornecedor.nome}</strong>
                    <span className="badge b-amber"><Clock className="ic ic-sm" aria-hidden />Pendente</span>
                  </div>
                  <p className="small muted">
                    NF-e {n.numero} · {data(n.emitidaEm)} · {reais(Number(n.valorTotal))} · {n.itens.length} itens
                    {semInsumo > 0 ? ` · ${semInsumo} sem insumo` : ''}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
        {totalPendentes > POR_PAGINA && (
          <nav className="row" aria-label="Páginas">
            {pagina > 1 && <Link className="btn btn-outline btn-sm" href={`/notas?pagina=${pagina - 1}`}>Anteriores</Link>}
            {pagina * POR_PAGINA < totalPendentes && <Link className="btn btn-outline btn-sm" href={`/notas?pagina=${pagina + 1}`}>Próximas</Link>}
          </nav>
        )}

        <FormImportar />

        {aprovadas.length > 0 && (
          <>
            <p className="section-title">Aprovadas recentemente</p>
            <ul className="lista">
              {aprovadas.map((n) => (
                <li key={n.id}>
                  <Link className="card" href={`/notas/${n.id}/resultado`}>
                    <div className="row between">
                      <strong>{n.fornecedor.nome}</strong>
                      <span className="badge b-green"><CircleCheck className="ic ic-sm" aria-hidden />Aprovada</span>
                    </div>
                    <p className="small muted">NF-e {n.numero} · {reais(Number(n.valorTotal))}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  )
}
