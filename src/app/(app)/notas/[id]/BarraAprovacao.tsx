'use client'

import { useActionState, useRef } from 'react'
import Link from 'next/link'
import { CircleCheck, CircleX, Info } from 'lucide-react'
import { aprovar, type EstadoAprovacao } from '../actions'

type Props = { notaId: number; numero: string; motivo: string | null; resumo: string[] }

export function BarraAprovacao({ notaId, numero, motivo, resumo }: Props) {
  const [estado, acao, aprovando] = useActionState<EstadoAprovacao, FormData>(aprovar, {})
  const dialogo = useRef<HTMLDialogElement>(null)

  return (
    <div className="approvebar">
      {motivo ? (
        <p className="reason" id="motivo"><Info className="ic" aria-hidden />{motivo}</p>
      ) : (
        <p className="reason ok"><CircleCheck className="ic" aria-hidden />Tudo conferido. Revise e aprove a nota.</p>
      )}
      {estado.erro && <p className="field-err" role="alert"><CircleX className="ic ic-sm" aria-hidden />{estado.erro}</p>}
      <div className="grid2" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <Link className="btn btn-outline" href="/notas">Voltar à fila</Link>
        <button
          className={`btn${motivo ? '' : ' btn-primary'}`}
          type="button"
          disabled={Boolean(motivo)}
          aria-describedby={motivo ? 'motivo' : undefined}
          onClick={() => dialogo.current?.showModal()}
        >
          Aprovar nota
        </button>
      </div>

      <dialog ref={dialogo} aria-labelledby="dlg-titulo">
        <h2 id="dlg-titulo" style={{ fontSize: 21 }}>Aprovar a nota {numero}?</h2>
        <p style={{ marginTop: 8 }}>O custo dos insumos, o estoque e as contas a pagar serão atualizados. A aprovação fica registrada com o seu nome.</p>
        <ul style={{ margin: '12px 0 0 18px' }}>
          {resumo.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <form action={acao} className="btns" onSubmit={() => dialogo.current?.close()}>
          <input type="hidden" name="notaId" value={notaId} />
          <button className="btn btn-outline" type="button" onClick={() => dialogo.current?.close()}>Cancelar</button>
          <button className="btn btn-primary" type="submit" disabled={aprovando}>{aprovando ? 'Aprovando…' : 'Aprovar'}</button>
        </form>
      </dialog>
    </div>
  )
}
