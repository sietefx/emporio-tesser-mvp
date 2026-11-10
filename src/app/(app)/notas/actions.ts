'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { exigirPapel } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { importarNota } from '@/lib/importarNota'
import { NfeInvalida } from '@/lib/nfe'
import { AprovacaoBloqueada, aprovarNota } from '@/lib/aprovarNota'

const TAMANHO_MAXIMO = 1024 * 1024

export type EstadoImportacao = { ok?: string; aviso?: string; erro?: string }

export async function importarXml(_: EstadoImportacao, form: FormData): Promise<EstadoImportacao> {
  await exigirPapel('GERENTE')
  const arquivo = form.get('xml')
  if (!(arquivo instanceof File) || arquivo.size === 0) return { erro: 'Escolha um arquivo XML de NF-e.' }
  if (arquivo.size > TAMANHO_MAXIMO) return { erro: 'O arquivo passa de 1 MB. Confira se é mesmo o XML da nota.' }

  try {
    const r = await importarNota(prisma, await arquivo.text())
    revalidatePath('/notas')
    if (r.tipo === 'duplicada') return { aviso: `A nota ${r.numero} já estava na fila. Nada foi duplicado.` }
    return {
      ok: `Nota ${r.numero} recebida e colocada na fila como pendente.`,
      aviso: r.outroDestinatario ? 'Atenção: o destinatário desta nota não é o CNPJ do restaurante.' : undefined,
    }
  } catch (e) {
    if (e instanceof NfeInvalida) return { erro: e.message }
    console.error('falha ao importar XML', e)
    return { erro: 'Não foi possível ler esta nota agora. Tente de novo.' }
  }
}

const itemSchema = z.object({
  notaId: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
  insumoId: z.coerce.number().int().positive().nullable(),
  fator: z.coerce.number().positive().max(100000),
  quantidade: z.coerce.number().positive().max(1000000),
})

export type EstadoItem = { erro?: string; salvoEm?: number }

export async function salvarItem(_: EstadoItem, form: FormData): Promise<EstadoItem> {
  await exigirPapel('GERENTE')
  const insumo = form.get('insumoId')
  const dados = itemSchema.safeParse({
    notaId: form.get('notaId'),
    itemId: form.get('itemId'),
    insumoId: insumo ? insumo : null,
    fator: String(form.get('fator') ?? '').replace(',', '.'),
    quantidade: String(form.get('quantidade') ?? '').replace(',', '.'),
  })
  if (!dados.success) return { erro: 'Informe valores maiores que zero no fator e na quantidade recebida.' }

  const { notaId, itemId, insumoId, fator, quantidade } = dados.data
  // só altera item de nota pendente; o where garante que o item é desta nota
  const r = await prisma.itemNota.updateMany({
    where: { id: itemId, notaId, nota: { status: 'PENDENTE' } },
    data: { insumoId, fatorConversao: fator, quantidadeRecebida: quantidade },
  })
  if (r.count === 0) return { erro: 'Esta nota não pode mais ser alterada.' }

  revalidatePath(`/notas/${notaId}`)
  return { salvoEm: Date.now() }
}

export type EstadoAprovacao = { erro?: string }

export async function aprovar(_: EstadoAprovacao, form: FormData): Promise<EstadoAprovacao> {
  const usuario = await exigirPapel('GERENTE')
  const notaId = z.coerce.number().int().positive().safeParse(form.get('notaId'))
  if (!notaId.success) return { erro: 'Nota inválida.' }

  try {
    await aprovarNota(prisma, notaId.data, usuario.id)
  } catch (e) {
    if (e instanceof AprovacaoBloqueada) return { erro: e.message }
    console.error('falha ao aprovar nota', e)
    return { erro: 'Não foi possível aprovar a nota agora. Nada foi alterado. Tente de novo em instantes.' }
  }
  revalidatePath('/notas')
  redirect(`/notas/${notaId.data}/resultado`)
}
