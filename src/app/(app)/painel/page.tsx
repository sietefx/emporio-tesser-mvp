import Link from 'next/link'
import { ArrowRight, ChefHat, Clock, FileText, Info, LogOut, ShoppingCart, TriangleAlert } from 'lucide-react'
import { exigirUsuario, podeVerCompras } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { pendenciasConciliacao, pratosComCmv } from '@/lib/consultas'
import { data } from '@/lib/formato'

export default async function Painel({ searchParams }: { searchParams: Promise<{ semPermissao?: string }> }) {
  const usuario = await exigirUsuario()
  const { semPermissao } = await searchParams
  const veCompras = podeVerCompras(usuario.papel)

  const [pendentes, conciliacao, pratos] = await Promise.all([
    prisma.notaCompra.findMany({ where: { status: 'PENDENTE' }, orderBy: { recebidaEm: 'asc' }, select: { id: true, emitidaEm: true } }),
    pendenciasConciliacao(),
    pratosComCmv(),
  ])
  const incompletos = pratos.filter((p) => p.incompleta)
  const papel = usuario.papel === 'GERENTE' ? 'Gerente' : 'Cozinha'

  return (
    <>
      <header className="topbar">
        <img src="/logo.svg" alt="Brielab ERP" />
        <form action="/sair" method="post">
          <button className="btn btn-outline btn-sm" type="submit">
            <LogOut className="ic ic-sm" aria-hidden /> Sair
          </button>
        </form>
      </header>
      <main>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Olá, {usuario.nome}</h1>
          <p className="small muted row" style={{ gap: 8, marginTop: 4 }}>
            <span className="badge" style={{ borderColor: 'transparent', background: '#f3e3df' }}>Papel: {papel}</span>
          </p>
        </div>

        {semPermissao && (
          <div className="alert a-amber" role="alert">
            <Info className="ic" aria-hidden />
            <div>Essa área não está liberada para o seu papel.</div>
          </div>
        )}

        {veCompras && (
          <>
            <p className="section-title">Prioridade de hoje</p>
            <section className="card priority" aria-labelledby="prio">
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <div className="icon-bubble"><FileText className="ic ic-lg" aria-hidden /></div>
                <div style={{ flex: 1 }}>
                  {pendentes.length > 0 ? (
                    <span className="badge b-amber"><Clock className="ic ic-sm" aria-hidden />Pendente</span>
                  ) : (
                    <span className="badge b-green">Em dia</span>
                  )}
                  <h2 id="prio" style={{ fontSize: 20, marginTop: 8 }}>
                    {pendentes.length === 1 ? '1 nota aguardando conferência' : `${pendentes.length} notas aguardando conferência`}
                  </h2>
                </div>
              </div>
              {pendentes.length > 0 ? (
                <>
                  <p>
                    A mais antiga foi emitida em {data(pendentes[0].emitidaEm)}. O custo dos insumos e o estoque só mudam depois que você
                    conferir e aprovar.
                  </p>
                  <Link className="btn btn-primary btn-block" href={`/notas/${pendentes[0].id}`}>
                    Conferir notas <ArrowRight className="ic" aria-hidden />
                  </Link>
                </>
              ) : (
                <p className="muted">Nenhuma nota parada. Quando chegar uma nova, ela aparece aqui.</p>
              )}
            </section>

            {conciliacao.length > 0 && (
              <section className="card" aria-labelledby="conc">
                <div className="row" style={{ alignItems: 'flex-start' }}>
                  <div className="icon-bubble bub-amber"><TriangleAlert className="ic" aria-hidden /></div>
                  <div>
                    <h2 id="conc">{conciliacao.length} pendências de conciliação</h2>
                    <p className="small muted">Recebimentos sem par no extrato. O DRE do mês fica incompleto até serem conciliados.</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {incompletos.length > 0 && (
          <section className="card" aria-labelledby="fichas">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div className="icon-bubble bub-amber"><TriangleAlert className="ic" aria-hidden /></div>
              <div>
                <h2 id="fichas">{incompletos.length === 1 ? '1 ficha incompleta' : `${incompletos.length} fichas incompletas`}</h2>
                <p className="small muted">{incompletos.map((p) => p.nome).join(', ')}: o CMV não é confiável até ligar todos os ingredientes.</p>
              </div>
            </div>
          </section>
        )}

        <p className="section-title">Seus módulos</p>
        <nav className="modules" aria-label={`Módulos do papel ${papel}`}>
          {veCompras && (
            <Link className="module" href="/notas">
              <ShoppingCart className="ic ic-lg" aria-hidden />
              <strong>Compras</strong>
              <span>Notas e fila de conferência</span>
              {pendentes.length > 0 && <b className="count" aria-label={`${pendentes.length} notas pendentes`}>{pendentes.length}</b>}
            </Link>
          )}
          <Link className="module" href="/pratos">
            <ChefHat className="ic ic-lg" aria-hidden />
            <strong>Fichas e CMV</strong>
            <span>Custo e margem dos pratos</span>
          </Link>
        </nav>
      </main>
    </>
  )
}
