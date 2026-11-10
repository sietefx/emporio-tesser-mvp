'use client'

import { useActionState, useState } from 'react'
import { Check, CircleX, Link2, Search, TriangleAlert } from 'lucide-react'
import { salvarItem, type EstadoItem } from '../actions'

type Insumo = { id: number; nome: string; unidade: string }
type Props = {
  notaId: number
  item: {
    id: number
    numeroItem: number
    descricao: string
    unidade: string
    quantidade: number
    valorTotal: number
    insumo: Insumo | null
    fator: number
    quantidadeRecebida: number | null
  }
  insumos: Insumo[]
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const numeroValido = (t: string) => {
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) && n > 0
}

export function ItemConferencia({ notaId, item, insumos }: Props) {
  const [estado, acao, salvando] = useActionState<EstadoItem, FormData>(salvarItem, {})
  const [escolhido, setEscolhido] = useState<Insumo | null>(item.insumo)
  const [busca, setBusca] = useState('')
  const [fator, setFator] = useState(String(item.fator).replace('.', ','))
  const [quantidade, setQuantidade] = useState(item.quantidadeRecebida === null ? '' : String(item.quantidadeRecebida).replace('.', ','))
  const [avisoBusca, setAvisoBusca] = useState(false)

  const pronto = Boolean(item.insumo) && (item.quantidadeRecebida ?? 0) > 0
  const qtdOk = numeroValido(quantidade)
  const fatorOk = numeroValido(fator)
  const unidadeDiferente = Boolean(escolhido) && semAcento(escolhido!.unidade) !== semAcento(item.unidade)

  const q = semAcento(busca.trim())
  const achados = q.length >= 2 ? insumos.filter((i) => semAcento(i.nome).includes(q)).slice(0, 5) : []
  const idErro = `err-${item.id}`

  return (
    <section className={`card item${pronto ? '' : ' pend'}`} aria-labelledby={`it-${item.id}`}>
      <div className="row between">
        <h2 id={`it-${item.id}`}>Item {item.numeroItem}</h2>
        {pronto ? (
          <span className="badge b-green"><Check className="ic ic-sm" aria-hidden />Pronto</span>
        ) : (
          <span className="badge b-amber"><TriangleAlert className="ic ic-sm" aria-hidden />{item.insumo ? 'Falta quantidade' : 'Sem insumo'}</span>
        )}
      </div>
      <p className="desc">
        <span className="small muted" style={{ fontFamily: 'Hanken' }}>Como o fornecedor descreveu:</span>
        <br />
        {item.descricao}
      </p>
      <p className="small muted">
        Na nota: {item.quantidade.toLocaleString('pt-BR')} {item.unidade} ·{' '}
        <b style={{ color: 'var(--ink)' }}>{item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
      </p>

      <form
        action={acao}
        className="field"
        style={{ gap: 12 }}
        onSubmit={(e) => {
          if (!escolhido) {
            e.preventDefault()
            setAvisoBusca(true)
          }
        }}
      >
        <input type="hidden" name="notaId" value={notaId} />
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="insumoId" value={escolhido?.id ?? ''} />

        {!item.insumo && !escolhido && (
          <div className="alert a-amber" id={idErro}>
            <TriangleAlert className="ic" aria-hidden />
            <div>
              <strong>Item {item.numeroItem} sem insumo.</strong>
              {avisoBusca ? 'Escolha um insumo na lista antes de ligar. Digite pelo menos 2 letras na busca.' : 'Escolha o insumo correspondente para aprovar a nota.'}
            </div>
          </div>
        )}

        {escolhido ? (
          <div className="row between" style={{ alignItems: 'center' }}>
            <p className="row" style={{ fontWeight: 600 }}>
              <Link2 className="ic" aria-hidden />
              <span>
                {escolhido.nome}
                <small className="muted" style={{ display: 'block', fontWeight: 400 }}>
                  {item.insumo?.id === escolhido.id ? 'Insumo ligado' : 'Escolhido, falta salvar'} · estoque em {escolhido.unidade}
                </small>
              </span>
            </p>
            <button className="btn btn-outline btn-sm" type="button" onClick={() => { setEscolhido(null); setBusca('') }}>
              Trocar
            </button>
          </div>
        ) : (
          <div className="field">
            <label htmlFor={`busca-${item.id}`}>Insumo do estoque</label>
            <div className="input row" style={{ gap: 8, padding: '0 12px' }}>
              <Search className="ic muted" aria-hidden />
              <input
                id={`busca-${item.id}`}
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setAvisoBusca(false) }}
                placeholder="Buscar insumo, ex.: manjericão"
                autoComplete="off"
                aria-describedby={!item.insumo ? idErro : undefined}
                style={{ border: 0, outline: 0, font: 'inherit', color: 'inherit', flex: 1, minWidth: 0, height: 44, background: 'transparent' }}
              />
            </div>
            {q.length >= 2 && (
              <ul className="sug" aria-label="Insumos encontrados">
                {achados.length === 0 && <li className="small muted" style={{ padding: '12px 14px' }}>Nenhum insumo com esse nome.</li>}
                {achados.map((i) => (
                  <li key={i.id}>
                    <button type="button" onClick={() => { setEscolhido(i); setBusca(''); setAvisoBusca(false) }}>
                      <span>{i.nome}</span>
                      <small>por {i.unidade}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid2">
          <div className="field">
            <label htmlFor={`fator-${item.id}`}>Fator de conversão</label>
            <div className="input-wrap">
              <input
                className="input"
                id={`fator-${item.id}`}
                name="fator"
                inputMode="decimal"
                value={fator}
                onChange={(e) => setFator(e.target.value)}
                aria-invalid={!fatorOk}
                aria-describedby={`ajuda-fator-${item.id}`}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor={`qtd-${item.id}`}>Quantidade recebida</label>
            <div className="input-wrap">
              <input
                className="input"
                id={`qtd-${item.id}`}
                name="quantidade"
                inputMode="decimal"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                aria-invalid={!qtdOk}
              />
              <span className="suffix">{escolhido?.unidade ?? item.unidade.toLowerCase()}</span>
            </div>
          </div>
        </div>
        <p className="small muted" id={`ajuda-fator-${item.id}`}>
          {unidadeDiferente
            ? `A nota vem em ${item.unidade} e o estoque usa ${escolhido!.unidade}: o fator diz quantos ${escolhido!.unidade} vêm em cada ${item.unidade}.`
            : 'Use 1 quando a unidade da nota for a mesma do estoque.'}
        </p>
        {(!qtdOk || !fatorOk) && (
          <p className="field-err" role="alert"><CircleX className="ic ic-sm" aria-hidden />Informe valores maiores que zero.</p>
        )}
        {estado.erro && <p className="field-err" role="alert"><CircleX className="ic ic-sm" aria-hidden />{estado.erro}</p>}

        <button className="btn btn-outline btn-block" type="submit" disabled={salvando || !qtdOk || !fatorOk}>
          <Link2 className="ic" aria-hidden />
          {salvando ? 'Salvando…' : item.insumo ? 'Salvar item' : 'Ligar insumo'}
        </button>
      </form>
    </section>
  )
}
