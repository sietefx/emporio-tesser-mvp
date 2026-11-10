import { exigirUsuario, podeVerCompras } from '@/lib/auth'
import { Navegacao } from '@/components/Navegacao'

export default async function LayoutInterno({ children }: { children: React.ReactNode }) {
  const usuario = await exigirUsuario()
  return (
    <div className="shell">
      {children}
      <Navegacao veCompras={podeVerCompras(usuario.papel)} />
    </div>
  )
}
