import { createHash } from 'node:crypto'
import { XMLParser } from 'fast-xml-parser'

export type ItemNfe = {
  numeroItem: number
  codigoProduto: string
  descricao: string
  ean: string | null
  quantidade: number
  unidade: string
  valorTotal: number
}

export type NotaNfe = {
  chave: string
  numero: string
  serie: string
  emitidaEm: Date
  emitente: { cnpj: string; nome: string }
  destinatarioCnpj: string
  valorTotal: number
  itens: ItemNfe[]
  parcelas: { numero: string; vencimento: Date; valor: number }[]
}

export class NfeInvalida extends Error {}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  parseTagValue: false, // CNPJ, EAN e códigos ficam como texto (zeros à esquerda)
  processEntities: false,
  isArray: (nome) => nome === 'det' || nome === 'dup',
})

const texto = (v: unknown) => (v === undefined || v === null ? '' : String(v).trim())

function numero(v: unknown, campo: string) {
  const n = Number(texto(v))
  if (!Number.isFinite(n)) throw new NfeInvalida(`Valor inválido em ${campo}`)
  return n
}

export function hashXml(xml: string) {
  return createHash('sha256').update(xml.trim()).digest('hex')
}

// NF-e válida nunca traz DOCTYPE; recusar antes do parser evita expansão de entidades (XXE / "billion laughs")
const DECLARACAO_PROIBIDA = /<!(DOCTYPE|ENTITY)/i

export function lerNfe(xml: string): NotaNfe {
  if (DECLARACAO_PROIBIDA.test(xml)) throw new NfeInvalida('O XML contém declarações que não são permitidas em uma NF-e (DOCTYPE/ENTITY).')
  let doc: any
  try {
    doc = parser.parse(xml)
  } catch {
    throw new NfeInvalida('O arquivo não é um XML válido.')
  }

  const inf = doc?.nfeProc?.NFe?.infNFe ?? doc?.NFe?.infNFe
  if (!inf) throw new NfeInvalida('O XML não parece ser uma NF-e (infNFe não encontrado).')

  const chave = texto(inf['@Id']).replace(/^NFe/, '')
  if (!/^\d{44}$/.test(chave)) throw new NfeInvalida('Chave de acesso inválida: precisa ter 44 dígitos.')

  const dets: any[] = inf.det ?? []
  if (dets.length === 0) throw new NfeInvalida('A nota não tem itens.')

  const itens = dets.map((det, i) => {
    const prod = det.prod ?? {}
    const ean = texto(prod.cEAN)
    return {
      numeroItem: Number(det['@nItem'] ?? i + 1),
      codigoProduto: texto(prod.cProd),
      descricao: texto(prod.xProd),
      ean: ean && ean !== 'SEM GTIN' ? ean : null,
      quantidade: numero(prod.qCom, `qCom do item ${i + 1}`),
      unidade: texto(prod.uCom).toUpperCase(),
      valorTotal: numero(prod.vProd, `vProd do item ${i + 1}`),
    }
  })

  const parcelas = ((inf.cobr?.dup as any[]) ?? []).map((d) => ({
    numero: texto(d.nDup),
    vencimento: new Date(`${texto(d.dVenc)}T12:00:00-03:00`),
    valor: numero(d.vDup, 'vDup'),
  }))

  const emitidaEm = new Date(texto(inf.ide?.dhEmi))
  if (Number.isNaN(emitidaEm.getTime())) throw new NfeInvalida('Data de emissão inválida.')

  return {
    chave,
    numero: texto(inf.ide?.nNF),
    serie: texto(inf.ide?.serie),
    emitidaEm,
    emitente: { cnpj: texto(inf.emit?.CNPJ), nome: texto(inf.emit?.xNome) },
    destinatarioCnpj: texto(inf.dest?.CNPJ),
    valorTotal: numero(inf.total?.ICMSTot?.vNF, 'vNF'),
    itens,
    parcelas,
  }
}
