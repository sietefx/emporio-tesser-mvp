# Empório Tesser — MVP de conferência de notas e CMV

MVP feito para a Experiência Prática de Projeto de Software (ADS, Cruzeiro do Sul Virtual).

O Empório Tesser é um restaurante em Chapecó/SC. A entrada das notas de compra era manual e atrasava, e por isso o custo dos pratos estava sempre desatualizado. Este MVP cobre só esse fluxo:

1. a nota de compra (NF-e) chega e entra numa fila como pendente;
2. o gerente liga cada item da nota ao insumo do estoque e confere a quantidade;
3. ao aprovar, custo, estoque e contas a pagar mudam juntos;
4. o sistema mostra o que mudou no custo e no CMV dos pratos, no salão e no delivery, e o que ainda precisa de atenção.

O ERP completo que uso no restaurante tem muito mais coisa (PDV, NFC-e, delivery, conciliação bancária). Ele fica em um repositório privado. Este aqui é uma versão separada, menor, com dados fictícios, para avaliação.

## Stack

Next.js 15 (App Router, server actions), React 19, TypeScript, Prisma 7 com PostgreSQL, bcryptjs, zod, fast-xml-parser e Vitest.

O formulário da disciplina pede Java, Angular, Flutter ou Python. Mantive Next.js porque é a stack do sistema que já roda no restaurante; a justificativa está no documento da atividade.

## Rodando

Precisa de Node 22 e Docker (ou um PostgreSQL local).

```bash
cp .env.example .env          # ajuste o SESSION_SECRET
docker compose up -d          # PostgreSQL na porta 5432
npm install
npx prisma migrate deploy
npm run db:seed               # cria a base fictícia
npm run dev                   # http://localhost:3000
```

Usuários de demonstração (senha definida em `SEED_SENHA`, padrão `demo1234`):

- `gerente@exemplo.com`: vê Compras, confere e aprova notas
- `cozinha@exemplo.com`: vê só o painel e as fichas (para testar o controle por papel)

O seed coloca 3 notas na fila. A primeira, do hortifrúti, tem o item 3 (manjericão) sem insumo, que é o caso usado no teste com usuário. Há mais XMLs de exemplo em `fixtures/notas` para testar o envio e a recusa de duplicadas.

## Testes

```bash
npm test        # unitários + fluxo da nota no banco (usa o DATABASE_URL do .env)
npm run lint    # checagem de tipos
```

O CI (GitHub Actions) sobe um PostgreSQL, aplica as migrações, roda o seed, os testes, o build e o `npm audit`.

## Organização

```
prisma/            schema, migração e seed
fixtures/notas/    XMLs de NF-e fictícios
src/lib/           regras: leitura da NF-e, importação, aprovação, CMV, sessão e senha
src/app/           telas (login, painel, fila, conferência, resultado, fichas)
tests/             Vitest
docs/requisitos.md onde cada requisito está no código
```

## Fora deste MVP

- Busca automática das notas no e-mail fiscal (aqui o XML é enviado pela tela).
- Importação do extrato OFX e conciliação; aparece só o alerta de pendências.
- PDV, pedido do garçom e NFC-e (RF08, desejável).
- Cadastro de usuários e insumos pela tela (vêm do seed).

Todos os nomes, CNPJs, valores e notas são fictícios.
