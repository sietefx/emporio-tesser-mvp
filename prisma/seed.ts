// Base fictícia para demonstração e testes. Nenhum dado real do restaurante.
import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { gerarHash } from '../src/lib/senha'
import { importarNota } from '../src/lib/importarNota'

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const INSUMOS: [string, string, number | null][] = [
  ['Tomate italiano', 'kg', 6.8],
  ['Cebola roxa', 'kg', 6.5],
  ['Manjericão fresco', 'maço', 4.5],
  ['Manjericão roxo', 'maço', 5.0],
  ['Hortelã fresca', 'maço', 3.8],
  ['Massa grano duro', 'kg', 22.0],
  ['Queijo parmesão', 'kg', 120.0],
  ['Azeite extra virgem', 'l', 60.0],
  ['Alho', 'kg', 30.0],
  ['Pão italiano', 'kg', 18.0],
]

// [prato, preço salão, preço delivery, ficha: [ingrediente, quantidade, insumo (null = ainda não ligado)]]
const PRATOS: [string, number, number, [string, number, string | null][]][] = [
  ['Massa ao pomodoro', 58, 64, [
    ['Tomate italiano', 0.25, 'Tomate italiano'],
    ['Spaghetti', 0.15, 'Massa grano duro'],
    ['Parmesão ralado', 0.03, 'Queijo parmesão'],
    ['Azeite', 0.03, 'Azeite extra virgem'],
    ['Alho', 0.01, 'Alho'],
    ['Manjericão', 0.2, 'Manjericão fresco'],
  ]],
  ['Bruschetta da casa', 39, 44, [
    ['Pão italiano', 0.12, 'Pão italiano'],
    ['Tomate italiano', 0.1, 'Tomate italiano'],
    ['Azeite', 0.02, 'Azeite extra virgem'],
    ['Manjericão', 0.1, 'Manjericão fresco'],
    ['Muçarela de búfala', 0.06, null],
  ]],
  ['Spaghetti alho e óleo', 49, 55, [
    ['Spaghetti', 0.15, 'Massa grano duro'],
    ['Alho', 0.02, 'Alho'],
    ['Azeite', 0.04, 'Azeite extra virgem'],
    ['Parmesão ralado', 0.02, 'Queijo parmesão'],
  ]],
]

async function main() {
  // ordem importa por causa das chaves estrangeiras
  await db.contaPagar.deleteMany()
  await db.movimentoEstoque.deleteMany()
  await db.parcelaNota.deleteMany()
  await db.itemNota.deleteMany()
  await db.notaCompra.deleteMany()
  await db.vinculoFornecedor.deleteMany()
  await db.fichaItem.deleteMany()
  await db.prato.deleteMany()
  await db.insumo.deleteMany()
  await db.fornecedor.deleteMany()
  await db.recebimento.deleteMany()
  await db.usuario.deleteMany()

  const senha = process.env.SEED_SENHA ?? 'demo1234'
  const hash = await gerarHash(senha)
  await db.usuario.createMany({
    data: [
      { nome: 'Gerente Demo', email: 'gerente@exemplo.com', senhaHash: hash, papel: 'GERENTE' },
      { nome: 'Cozinha Demo', email: 'cozinha@exemplo.com', senhaHash: hash, papel: 'COZINHA' },
    ],
  })

  const insumos = new Map<string, number>()
  for (const [nome, unidade, custo] of INSUMOS) {
    const i = await db.insumo.create({ data: { nome, unidade, custoUnitario: custo, saldo: 0 } })
    insumos.set(nome, i.id)
  }

  for (const [nome, precoSalao, precoDelivery, ficha] of PRATOS) {
    await db.prato.create({
      data: {
        nome,
        precoSalao,
        precoDelivery,
        ficha: {
          create: ficha.map(([descricao, quantidade, insumo]) => ({
            descricao,
            quantidade,
            insumoId: insumo ? insumos.get(insumo)! : null,
          })),
        },
      },
    })
  }

  // ligações já feitas em compras anteriores do hortifrúti
  const horti = await db.fornecedor.create({ data: { cnpj: '12345678000190', nome: 'HORTIFRUTI SERRA VERDE LTDA' } })
  await db.vinculoFornecedor.createMany({
    data: [
      { fornecedorId: horti.id, codigoProduto: '1020', insumoId: insumos.get('Tomate italiano')!, fatorConversao: 20 },
      { fornecedorId: horti.id, codigoProduto: '1044', insumoId: insumos.get('Cebola roxa')!, fatorConversao: 1 },
    ],
  })

  const pasta = join(process.cwd(), 'fixtures', 'notas')
  for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.xml')).sort()) {
    const r = await importarNota(db, readFileSync(join(pasta, arquivo), 'utf8'))
    console.log(`${arquivo}: ${r.tipo}`)
  }

  await db.recebimento.createMany({
    data: [
      { data: new Date('2026-11-07T12:00:00-03:00'), forma: 'CARTAO', valor: 1840.5, conciliado: true },
      { data: new Date('2026-11-07T12:00:00-03:00'), forma: 'PIX', valor: 612.0, conciliado: true },
      { data: new Date('2026-11-08T12:00:00-03:00'), forma: 'CARTAO', valor: 2215.9, conciliado: true },
      { data: new Date('2026-11-08T12:00:00-03:00'), forma: 'PIX', valor: 148.0, conciliado: false },
      { data: new Date('2026-11-08T12:00:00-03:00'), forma: 'PIX', valor: 96.5, conciliado: false },
    ],
  })

  console.log(`Base pronta. Usuários: gerente@exemplo.com e cozinha@exemplo.com (senha de teste: ${senha})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
