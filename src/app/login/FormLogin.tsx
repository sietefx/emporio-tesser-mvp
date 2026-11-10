'use client'

import { useActionState } from 'react'
import { ArrowRight, CircleX } from 'lucide-react'
import { entrar, type EstadoLogin } from './actions'

export function FormLogin() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrar, {})

  return (
    <form action={acao} className="field" style={{ gap: 16 }} noValidate>
      {estado.erro && (
        <div className="alert a-red" role="alert">
          <CircleX className="ic" aria-hidden />
          <div>{estado.erro}</div>
        </div>
      )}
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="username" required defaultValue={estado.email} />
      </div>
      <div className="field">
        <label htmlFor="senha">Senha</label>
        <input className="input" id="senha" name="senha" type="password" autoComplete="current-password" required />
      </div>
      <button className="btn btn-primary btn-block" type="submit" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'} <ArrowRight className="ic" aria-hidden />
      </button>
    </form>
  )
}
