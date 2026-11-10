import { redirect } from 'next/navigation'
import { usuarioAtual } from '@/lib/auth'
import { FormLogin } from './FormLogin'

export default async function Login() {
  if (await usuarioAtual()) redirect('/painel')

  return (
    <div className="shell" style={{ maxWidth: 440 }}>
      <main style={{ justifyContent: 'center', gap: 20, padding: '32px 20px' }}>
        <img src="/logo.svg" alt="Brielab ERP" style={{ height: 34, alignSelf: 'flex-start' }} />
        <div>
          <p className="small" style={{ fontWeight: 600, color: '#7a3a33' }}>Empório Tesser · Compras</p>
          <h1 style={{ fontSize: 28, fontWeight: 600 }}>Entrar no sistema</h1>
          <p className="muted" style={{ marginTop: 6 }}>Use o e-mail e a senha que a gestão cadastrou para você.</p>
        </div>
        <FormLogin />
      </main>
    </div>
  )
}
