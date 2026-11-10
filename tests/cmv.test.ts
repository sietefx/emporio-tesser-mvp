import { describe, expect, it } from 'vitest'
import { custoDoPrato, indicadores } from '@/lib/cmv'

// ficha da Massa ao pomodoro usada no seed
const massa = [
  { quantidade: 0.25, perdaPercentual: 0, custoUnitario: 6.8 },
  { quantidade: 0.15, perdaPercentual: 0, custoUnitario: 22 },
  { quantidade: 0.03, perdaPercentual: 0, custoUnitario: 120 },
  { quantidade: 0.03, perdaPercentual: 0, custoUnitario: 60 },
  { quantidade: 0.01, perdaPercentual: 0, custoUnitario: 30 },
  { quantidade: 0.2, perdaPercentual: 0, custoUnitario: 4.5 },
]

describe('custo e CMV', () => {
  it('soma a ficha', () => {
    expect(custoDoPrato(massa)).toEqual({ custo: 11.6, incompleta: false })
  })

  it('aplica a perda sobre a quantidade', () => {
    expect(custoDoPrato([{ quantidade: 1, perdaPercentual: 10, custoUnitario: 10 }]).custo).toBe(11)
  })

  it('marca ficha incompleta quando falta custo', () => {
    const r = custoDoPrato([...massa, { quantidade: 0.06, perdaPercentual: 0, custoUnitario: null }])
    expect(r).toEqual({ custo: 11.6, incompleta: true })
  })

  it('desconta a comissão no delivery', () => {
    const r = indicadores(11.88, 58, 64, 0.23)
    expect(r.salao.cmv).toBeCloseTo(0.2048, 4)
    expect(r.delivery.receitaLiquida).toBe(49.28)
    expect(r.delivery.cmv).toBeCloseTo(0.2411, 4)
    expect(r.delivery.margem).toBe(37.4)
  })
})
