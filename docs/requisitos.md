# Onde cada requisito está no código

Requisitos do documento da Experiência Prática. RF08 (pedido do garçom e NFC-e) ficou fora deste MVP por ser desejável.

| Requisito | O que faz | Onde |
|---|---|---|
| RF01 | Recebe a NF-e (XML), registra como pendente e não duplica pela chave de 44 dígitos ou pelo hash do XML | `src/lib/nfe.ts`, `src/lib/importarNota.ts`, tela `/notas` |
| RF02 | Liga cada item ao insumo, com fator de conversão e quantidade recebida; lembra a ligação para a próxima nota do fornecedor | `src/app/(app)/notas/[id]/ItemConferencia.tsx`, `VinculoFornecedor` no schema |
| RF03 | Aprova em uma transação: custo do insumo, entrada no estoque, contas a pagar e registro de quem aprovou | `src/lib/aprovarNota.ts` |
| RF04 | Custo, CMV e margem por prato no salão e no delivery (com comissão), calculados na consulta | `src/lib/cmv.ts`, `src/lib/consultas.ts`, tela `/pratos` |
| RF05 / RF06 | Alerta de recebimentos sem conciliação e aviso de DRE incompleto (a importação do extrato fica para a próxima etapa) | painel e tela de resultado |
| RF07 | Papel de gestão para Compras e aprovação; o papel vem da sessão, conferido no servidor a cada ação | `src/lib/auth.ts`, `exigirPapel` nas actions |
| RNF01 | bcrypt custo 12, cookie HttpOnly assinado com HMAC-SHA256, Sair invalida as sessões, 10 tentativas por minuto | `src/lib/senha.ts`, `src/lib/sessao.ts`, `src/app/login/actions.ts`, `src/app/sair/route.ts` |
| RNF02 | Validação com zod no servidor, consultas parametrizadas pelo Prisma, XML tratado como dado, erros sem detalhe técnico, cabeçalhos de segurança | actions, `next.config.ts` |
| RNF03 | Fila paginada (20 por página), build de produção no CI | `src/app/(app)/notas/page.tsx` |
| RNF04 | Alvos de 44 px ou mais, contraste AA, status com texto e ícone, rótulos visíveis, foco visível | `src/app/globals.css` e componentes |
