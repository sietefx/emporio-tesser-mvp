// Precisa de banco: roda só quando DATABASE_URL está definido (CI e máquina local).
import 'dotenv/config'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { importarNota } from '@/lib/importarNota'
import { AprovacaoBloqueada, aprovarNota } from '@/lib/aprovarNota'

const temBanco = Boolean(process.env.DATABASE_URL)
const db = temBanco ? new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) }) : (null as never)

describe.runIf(temBanco)('fluxo da nota 4512 no banco', () => {
  let notaId: number
  let gerenteId: number

  beforeAll(async () => {
    execSync('npx tsx prisma/seed.ts', { stdio: 'ignore' })
    notaId = (await db.notaCompra.findFirstOrThrow({ where: { numero: '4512' } })).id
    gerenteId = (await db.usuario.findUniqueOrThrow({ where: { email: 'gerente@exemplo.com' } })).id
  }, 60_000)

  afterAll(() => db?.$disconnect())

  it('reenvio do mesmo XML não cria outra nota', async () => {
    const antes = await db.notaCompra.count()
    const r = await importarNota(db, readFileSync('fixtures/notas/nfe-4512.xml', 'utf8'))
    expect(r.tipo).toBe('duplicada')
    expect(await db.notaCompra.count()).toBe(antes)
  })

  it('sugere o insumo dos itens já ligados antes e deixa o manjericão sem insumo', async () => {
    const itens = await db.itemNota.findMany({ where: { notaId }, orderBy: { numeroItem: 'asc' }, include: { insumo: true } })
    expect(itens[0].insumo?.nome).toBe('Tomate italiano')
    expect(Number(itens[0].quantidadeRecebida)).toBe(20) // 1 caixa x fator 20
    expect(itens[2].insumoId).toBeNull()
  })

  it('não aprova com item sem insumo e não altera nada', async () => {
    await expect(aprovarNota(db, notaId, gerenteId)).rejects.toThrow(AprovacaoBloqueada)
    const nota = await db.notaCompra.findUniqueOrThrow({ where: { id: notaId } })
    expect(nota.status).toBe('PENDENTE')
    expect(await db.contaPagar.count()).toBe(0)
  })

  it('aprova depois de ligar o item 3 e atualiza custo, estoque e contas', async () => {
    const manjericao = await db.insumo.findUniqueOrThrow({ where: { nome: 'Manjericão fresco' } })
    await db.itemNota.updateMany({ where: { notaId, numeroItem: 3 }, data: { insumoId: manjericao.id, quantidadeRecebida: 12 } })

    await aprovarNota(db, notaId, gerenteId)

    const tomate = await db.insumo.findUniqueOrThrow({ where: { nome: 'Tomate italiano' } })
    expect(Number(tomate.custoUnitario)).toBeCloseTo(7.9, 4)
    expect(Number(tomate.saldo)).toBe(20)
    expect(await db.movimentoEstoque.count({ where: { notaId } })).toBe(3)
    const contas = await db.contaPagar.findMany({ where: { notaId } })
    expect(contas.map((c) => Number(c.valor))).toEqual([277])
    // a ligação nova fica lembrada para a próxima nota do fornecedor
    expect(await db.vinculoFornecedor.count({ where: { codigoProduto: '1102', insumoId: manjericao.id } })).toBe(1)
  })

  it('não aprova a mesma nota duas vezes', async () => {
    await expect(aprovarNota(db, notaId, gerenteId)).rejects.toThrow(/já foi aprovada/)
    expect(await db.contaPagar.count({ where: { notaId } })).toBe(1)
  })
})
