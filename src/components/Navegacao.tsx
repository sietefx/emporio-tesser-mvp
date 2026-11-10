'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChefHat, House, ShoppingCart } from 'lucide-react'

export function Navegacao({ veCompras }: { veCompras: boolean }) {
  const caminho = usePathname()
  const itens = [
    { href: '/painel', rotulo: 'Início', Icone: House },
    ...(veCompras ? [{ href: '/notas', rotulo: 'Compras', Icone: ShoppingCart }] : []),
    { href: '/pratos', rotulo: 'Fichas e CMV', Icone: ChefHat },
  ]
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {itens.map(({ href, rotulo, Icone }) => (
        <Link key={href} href={href} aria-current={caminho.startsWith(href) ? 'page' : undefined}>
          <Icone className="ic" aria-hidden />
          {rotulo}
        </Link>
      ))}
    </nav>
  )
}
