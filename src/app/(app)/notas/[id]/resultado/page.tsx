import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowDown, ArrowRight, ArrowUp, ChevronLeft, CircleCheck, Landmark, Package, ReceiptText, TriangleAlert } from 'lucide-react'
import { exigirPapel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pendenciasConciliacao, pratosComCmv } from '@/lib/consultas'
import { data, hora, pct, qtd, reais } from '@/lib/formato'

function Variacao({ antes, depois, tipo }: { antes: number; depois: number; tipo: 'pct' | 'reais' }) {
  const dif = depois - antes
  if (Math.abs(dif) < 0.0005) return <span className="small muted">sem mudança</span>
  const texto = tipo === 'pct' ? `${(Math.abs(dif) * 100).toFixed(1).replace('.', ',')} ponto` : reais(Math.abs(dif))
  const Seta = dif > 0 ? ArrowUp : ArrowDown
  return (
    <span className={`delta${dif > 0 ? '' : ' baixou'}`}>
      <Seta className="ic ic-sm" aria-hidden />
      {dif > 0 ? 'subiu' : 'baixou'} {texto}
    </span>
  )
}

export default async function Resultado({ params }: { params: Promise<{ id: string }> }) {
  await exigirPapel('GERENTE')
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()

  const nota = await prisma.notaCompra.findUnique({
    where: { id },
    include: { fornecedor: true, aprovadaPor: true, movimentos: { include: { insumo: true } }, contas: { orderBy: { vencimento: 'asc' } } },
  })
  if (!nota) notFound()
  if (nota.status !== 'APROVADA') redirect(`/notas/${id}`)

  const custoAntes = new Map(
    nota.movimentos.filter((m) => m.custoAnterior !== null).map((m) => [m.insumoId, Number(m.custoAnterior)] as const),
  )
  const insumosDaNota = new Set(nota.movimentos.map((m) => m.insumoId))
  const [depois, antes, conciliacao, restantes] = await Promise.all([
    pratosComCmv(),
    pratosComCmv(custoAntes),
    pendenciasConciliacao(),
    prisma.notaCompra.findMany({ where: { status: 'PENDENTE' }, orderBy: { recebidaEm: 'asc' }, select: { id: true } }),
  ])
  const afetados = depois.filter((p) => [...p.insumos].some((i) => insumosDaNota.has(i)))
  const incompletos = depois.filter((p) => p.incompleta)
  const mudancasCusto = nota.movimentos.filter((m) => m.custoAnterior !== null && Math.abs(Number(m.custoAnterior) - Number(m.custoUnitario)) > 0.0001)

  return (
    <>
      <header className="appbar">
        <Link className="back" href="/notas"><ChevronLeft className="ic ic-lg" aria-hidden />Fila</Link>
        <h1>Resultado</h1>
        <span className="meta">{restantes.length} na fila</span>
      </header>
      <main>
        <div className="success" role="status">
          <CircleCheck className="ic ic-lg" aria-hidden />
          <div>
            <h2>Nota {nota.numero} aprovada</h2>
            <p className="small">
              {nota.fornecedor.nome} · aprovada por {nota.aprovadaPor?.nome ?? '—'} em {data(nota.aprovadaEm!)} às {hora(nota.aprovadaEm!)}
            </p>
          </div>
        </div>

        <section className="card" aria-labelledby="mud">
          <h2 id="mud">O que mudou</h2>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="icon-bubble"><ReceiptText className="ic" aria-hidden /></div>
            <div>
              <b>Custo de {nota.movimentos.length} insumos atualizado</b>
              {mudancasCusto.map((m) => {
                const a = Number(m.custoAnterior), d = Number(m.custoUnitario)
                return (
                  <p key={m.id} className="small muted">
                    {m.insumo.nome}: de {reais(a)} para {reais(d)} por {m.insumo.unidade} ({d > a ? 'subiu' : 'baixou'} {Math.round(Math.abs(d / a - 1) * 100)}%)
                  </p>
                )
              })}
            </div>
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="icon-bubble"><Package className="ic" aria-hidden /></div>
            <div>
              <b>{nota.movimentos.length} entradas no estoque</b>
              <p className="small muted">{nota.movimentos.map((m) => `${m.insumo.nome} +${qtd(Number(m.quantidade))} ${m.insumo.unidade}`).join(' · ')}</p>
            </div>
          </div>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <div className="icon-bubble"><Landmark className="ic" aria-hidden /></div>
            <div>
              <b>{nota.contas.length === 1 ? '1 parcela a pagar' : `${nota.contas.length} parcelas a pagar`}</b>
              <p className="small muted">{nota.contas.map((c) => `${reais(Number(c.valor))} · vence em ${data(c.vencimento)}`).join(' / ')}</p>
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="pratos">
          <h2 id="pratos">Pratos afetados ({afetados.length})</h2>
          {afetados.length === 0 && <p className="small muted">Nenhuma ficha técnica usa os insumos desta nota.</p>}
          {afetados.map((p) => {
            const a = antes.find((x) => x.id === p.id)!
            return (
              <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <strong style={{ fontSize: 18 }}>{p.nome}{p.incompleta ? ' (ficha incompleta)' : ''}</strong>
                <p className="small">
                  <span className="muted">Custo do prato:</span> {reais(a.custo)} → <b>{reais(p.custo)}</b> <Variacao antes={a.custo} depois={p.custo} tipo="reais" />
                </p>
                <div className="channels">
                  <div className="channel">
                    <h3>Salão</h3>
                    <span className="muted small">Preço</span><b>{reais(p.precoSalao)}</b>
                    <span className="muted small">CMV</span><b>{pct(a.salao.cmv)} → {pct(p.salao.cmv)}</b>
                    <Variacao antes={a.salao.cmv} depois={p.salao.cmv} tipo="pct" />
                    <span className="muted small">Margem</span><b>{reais(p.salao.margem)}</b>
                  </div>
                  <div className="channel">
                    <h3>Delivery</h3>
                    <span className="muted small">Preço</span><b>{reais(p.precoDelivery)}</b>
                    <span className="muted small">já descontada a comissão</span>
                    <span className="muted small">CMV</span><b>{pct(a.delivery.cmv)} → {pct(p.delivery.cmv)}</b>
                    <Variacao antes={a.delivery.cmv} depois={p.delivery.cmv} tipo="pct" />
                    <span className="muted small">Margem</span><b>{reais(p.delivery.margem)}</b>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {(incompletos.length > 0 || conciliacao.length > 0) && (
          <p className="section-title">Precisa de atenção ({incompletos.length + (conciliacao.length > 0 ? 1 : 0)})</p>
        )}
        {incompletos.map((p) => (
          <section key={p.id} className="card alert-card" aria-labelledby={`fi-${p.id}`}>
            <h2 id={`fi-${p.id}`}><TriangleAlert className="ic" aria-hidden />Ficha incompleta</h2>
            <p><b>{p.nome}</b> tem {p.faltando.length} ingrediente(s) sem insumo ({p.faltando.join(', ')}). O CMV desse prato não é confiável até a ficha ser completada.</p>
            <Link className="btn btn-outline btn-sm" href="/pratos" style={{ alignSelf: 'flex-start' }}>Ver fichas</Link>
          </section>
        ))}
        {conciliacao.length > 0 && (
          <section className="card alert-card" aria-labelledby="conc">
            <h2 id="conc"><TriangleAlert className="ic" aria-hidden />Pendência de conciliação</h2>
            <p>
              {conciliacao.length} recebimentos sem par no extrato ({[...new Set(conciliacao.map((r) => `${r.forma} de ${data(r.data)}`))].join(', ')}).{' '}
              <b>O DRE do mês está incompleto.</b>
            </p>
          </section>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {restantes.length > 0 && (
            <Link className="btn btn-primary btn-block" href={`/notas/${restantes[0].id}`}>
              Próxima nota ({restantes.length} na fila) <ArrowRight className="ic" aria-hidden />
            </Link>
          )}
          <Link className="btn btn-outline btn-block" href="/painel">Voltar ao painel</Link>
        </div>
      </main>
    </>
  )
}
