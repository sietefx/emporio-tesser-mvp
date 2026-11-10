'use client'

import { useActionState } from 'react'
import { CircleCheck, CircleX, TriangleAlert, Upload } from 'lucide-react'
import { importarXml, type EstadoImportacao } from './actions'

export function FormImportar() {
  const [estado, acao, enviando] = useActionState<EstadoImportacao, FormData>(importarXml, {})
  return (
    <form action={acao} className="card" aria-labelledby="imp">
      <h2 id="imp">Receber nota por XML</h2>
      <p className="small muted">
        No sistema completo as notas chegam sozinhas pelo e-mail fiscal. Neste MVP, envie o XML da NF-e (há exemplos em fixtures/notas).
      </p>
      <div className="field">
        <label htmlFor="xml">Arquivo XML</label>
        <input className="input" id="xml" name="xml" type="file" accept=".xml,text/xml,application/xml" style={{ paddingTop: 11 }} />
      </div>
      {estado.erro && <p className="field-err" role="alert"><CircleX className="ic ic-sm" aria-hidden />{estado.erro}</p>}
      {estado.ok && <p className="reason ok" role="status"><CircleCheck className="ic ic-sm" aria-hidden />{estado.ok}</p>}
      {estado.aviso && <p className="reason" role="status"><TriangleAlert className="ic ic-sm" aria-hidden />{estado.aviso}</p>}
      <button className="btn btn-outline" type="submit" disabled={enviando} style={{ alignSelf: 'flex-start' }}>
        <Upload className="ic" aria-hidden /> {enviando ? 'Enviando…' : 'Enviar XML'}
      </button>
    </form>
  )
}
