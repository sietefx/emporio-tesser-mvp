// CMV calculado na hora, com o custo atual de cada insumo (não é gravado)

export const COMISSAO_DELIVERY = Number(process.env.COMISSAO_DELIVERY ?? 0.23)

export type LinhaFicha = {
  quantidade: number
  perdaPercentual: number
  custoUnitario: number | null // null = sem insumo ou insumo sem custo
}

export function custoDoPrato(ficha: LinhaFicha[]) {
  let custo = 0
  let incompleta = false
  for (const l of ficha) {
    if (l.custoUnitario === null) {
      incompleta = true
      continue
    }
    // a perda aumenta a quantidade que precisa ser comprada
    custo += l.quantidade * (1 + l.perdaPercentual / 100) * l.custoUnitario
  }
  return { custo: arredonda(custo), incompleta }
}

export function indicadores(custo: number, precoSalao: number, precoDelivery: number, comissao = COMISSAO_DELIVERY) {
  const receitaDelivery = precoDelivery * (1 - comissao)
  return {
    salao: { cmv: custo / precoSalao, margem: arredonda(precoSalao - custo) },
    delivery: { cmv: custo / receitaDelivery, margem: arredonda(receitaDelivery - custo), receitaLiquida: arredonda(receitaDelivery) },
  }
}

const arredonda = (v: number) => Math.round(v * 100) / 100
