import 'server-only'
import { prisma } from './db'
import { custoDoPrato, indicadores } from './cmv'

export async function pratosComCmv(custoSobrescrito?: Map<number, number>) {
  const pratos = await prisma.prato.findMany({
    orderBy: { nome: 'asc' },
    include: { ficha: { include: { insumo: true } } },
  })
  return pratos.map((p) => {
    const ficha = p.ficha.map((f) => ({
      insumoId: f.insumoId,
      quantidade: Number(f.quantidade),
      perdaPercentual: Number(f.perdaPercentual),
      custoUnitario:
        f.insumoId && custoSobrescrito?.has(f.insumoId)
          ? custoSobrescrito.get(f.insumoId)!
          : f.insumo?.custoUnitario == null
            ? null
            : Number(f.insumo.custoUnitario),
    }))
    const { custo, incompleta } = custoDoPrato(ficha)
    const precoSalao = Number(p.precoSalao)
    const precoDelivery = Number(p.precoDelivery)
    return {
      id: p.id,
      nome: p.nome,
      precoSalao,
      precoDelivery,
      custo,
      incompleta,
      faltando: p.ficha.filter((f) => !f.insumoId).map((f) => f.descricao),
      insumos: new Set(ficha.map((f) => f.insumoId).filter((x): x is number => x !== null)),
      ...indicadores(custo, precoSalao, precoDelivery),
    }
  })
}

export async function pendenciasConciliacao() {
  return prisma.recebimento.findMany({ where: { conciliado: false }, orderBy: { data: 'asc' } })
}
