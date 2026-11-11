import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hashXml, lerNfe, NfeInvalida } from '@/lib/nfe'

const xml = readFileSync('fixtures/notas/nfe-4512.xml', 'utf8')

describe('lerNfe', () => {
  it('lê cabeçalho, itens e parcelas da nota de exemplo', () => {
    const n = lerNfe(xml)
    expect(n.chave).toHaveLength(44)
    expect(n.numero).toBe('4512')
    expect(n.emitente.cnpj).toBe('12345678000190')
    expect(n.valorTotal).toBe(277)
    expect(n.itens).toHaveLength(3)
    expect(n.itens[0]).toMatchObject({ codigoProduto: '1020', unidade: 'CX', quantidade: 1, valorTotal: 158 })
    expect(n.itens[1].ean).toBeNull() // SEM GTIN
    expect(n.parcelas).toEqual([{ numero: '001', vencimento: expect.any(Date), valor: 277 }])
  })

  it('mantém zeros à esquerda em códigos', () => {
    const n = lerNfe(xml.replace('<cProd>1020</cProd>', '<cProd>001020</cProd>'))
    expect(n.itens[0].codigoProduto).toBe('001020')
  })

  it('recusa arquivo que não é NF-e', () => {
    expect(() => lerNfe('<pedido><id>1</id></pedido>')).toThrow(NfeInvalida)
  })

  it('recusa XML com DOCTYPE ou ENTITY (expansão de entidades)', () => {
    const malicioso = xml.replace('<nfeProc', '<!DOCTYPE x [<!ENTITY a "aaaa"><!ENTITY b "&a;&a;&a;">]>\n<nfeProc')
    expect(() => lerNfe(malicioso)).toThrow(/DOCTYPE/)
  })

  it('recusa chave com tamanho errado', () => {
    expect(() => lerNfe(xml.replace(/Id="NFe\d+"/, 'Id="NFe123"'))).toThrow(/44 dígitos/)
  })

  it('hash ignora espaços nas pontas mas muda com o conteúdo', () => {
    expect(hashXml(`  ${xml}\n`)).toBe(hashXml(xml))
    expect(hashXml(xml.replace('158.00', '159.00'))).not.toBe(hashXml(xml))
  })
})
