import Link from 'next/link'
import { ChevronLeft, TriangleAlert } from 'lucide-react'
import { exigirUsuario } from '@/lib/auth'
import { pratosComCmv } from '@/lib/consultas'
import { COMISSAO_DELIVERY } from '@/lib/cmv'
import { pct, reais } from '@/lib/formato'

export default async function Pratos() {
  await exigirUsuario()
  const pratos = await pratosComCmv()

  return (
    <>
      <header className="appbar">
        <Link className="back" href="/painel"><ChevronLeft className="ic ic-lg" aria-hidden />Início</Link>
        <h1>Fichas e CMV</h1>
      </header>
      <main>
        <p className="small muted">
          Custo calculado agora, com o último custo de cada insumo. No delivery o CMV considera a comissão de {pct(COMISSAO_DELIVERY)} da plataforma.
        </p>
        <div className="card tabela">
          <table className="simples">
            <caption className="small muted" style={{ textAlign: 'left', paddingBottom: 8 }}>Pratos com ficha técnica</caption>
            <thead>
              <tr>
                <th scope="col">Prato</th>
                <th scope="col" className="num">Custo</th>
                <th scope="col" className="num">CMV salão</th>
                <th scope="col" className="num">CMV delivery</th>
              </tr>
            </thead>
            <tbody>
              {pratos.map((p) => (
                <tr key={p.id}>
                  <th scope="row" style={{ fontWeight: 600 }}>
                    {p.nome}
                    {p.incompleta && (
                      <span className="badge b-amber" style={{ display: 'flex', marginTop: 4 }}>
                        <TriangleAlert className="ic ic-sm" aria-hidden />Ficha incompleta
                      </span>
                    )}
                  </th>
                  <td className="num">{reais(p.custo)}</td>
                  <td className="num">{pct(p.salao.cmv)}<br /><span className="small muted">margem {reais(p.salao.margem)}</span></td>
                  <td className="num">{pct(p.delivery.cmv)}<br /><span className="small muted">margem {reais(p.delivery.margem)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
