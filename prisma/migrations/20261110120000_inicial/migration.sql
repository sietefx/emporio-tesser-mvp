-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('GERENTE', 'COZINHA');

-- CreateEnum
CREATE TYPE "StatusNota" AS ENUM ('PENDENTE', 'APROVADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "sessoesValidasDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insumo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "custoUnitario" DECIMAL(12,4),
    "saldo" DECIMAL(12,3) NOT NULL DEFAULT 0,
    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaCompra" (
    "id" SERIAL NOT NULL,
    "chave" TEXT NOT NULL,
    "xmlHash" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "emitidaEm" TIMESTAMP(3) NOT NULL,
    "destinatarioCnpj" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "status" "StatusNota" NOT NULL DEFAULT 'PENDENTE',
    "xml" TEXT NOT NULL,
    "recebidaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprovadaEm" TIMESTAMP(3),
    "fornecedorId" INTEGER NOT NULL,
    "aprovadaPorId" INTEGER,
    CONSTRAINT "NotaCompra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemNota" (
    "id" SERIAL NOT NULL,
    "numeroItem" INTEGER NOT NULL,
    "codigoProduto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ean" TEXT,
    "quantidade" DECIMAL(12,4) NOT NULL,
    "unidade" TEXT NOT NULL,
    "valorTotal" DECIMAL(12,2) NOT NULL,
    "fatorConversao" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "quantidadeRecebida" DECIMAL(12,4),
    "notaId" INTEGER NOT NULL,
    "insumoId" INTEGER,
    CONSTRAINT "ItemNota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelaNota" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "notaId" INTEGER NOT NULL,
    CONSTRAINT "ParcelaNota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinculoFornecedor" (
    "id" SERIAL NOT NULL,
    "codigoProduto" TEXT NOT NULL,
    "fatorConversao" DECIMAL(12,4) NOT NULL DEFAULT 1,
    "fornecedorId" INTEGER NOT NULL,
    "insumoId" INTEGER NOT NULL,
    CONSTRAINT "VinculoFornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovimentoEstoque" (
    "id" SERIAL NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "custoUnitario" DECIMAL(12,4) NOT NULL,
    "custoAnterior" DECIMAL(12,4),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insumoId" INTEGER NOT NULL,
    "notaId" INTEGER,
    CONSTRAINT "MovimentoEstoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaPagar" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "notaId" INTEGER NOT NULL,
    "fornecedorId" INTEGER NOT NULL,
    CONSTRAINT "ContaPagar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prato" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "precoSalao" DECIMAL(10,2) NOT NULL,
    "precoDelivery" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "Prato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FichaItem" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(12,4) NOT NULL,
    "perdaPercentual" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pratoId" INTEGER NOT NULL,
    "insumoId" INTEGER,
    CONSTRAINT "FichaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recebimento" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "forma" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "conciliado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Recebimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");
CREATE UNIQUE INDEX "Insumo_nome_key" ON "Insumo"("nome");
CREATE UNIQUE INDEX "NotaCompra_chave_key" ON "NotaCompra"("chave");
CREATE UNIQUE INDEX "NotaCompra_xmlHash_key" ON "NotaCompra"("xmlHash");
CREATE INDEX "NotaCompra_status_idx" ON "NotaCompra"("status");
CREATE UNIQUE INDEX "ItemNota_notaId_numeroItem_key" ON "ItemNota"("notaId", "numeroItem");
CREATE UNIQUE INDEX "VinculoFornecedor_fornecedorId_codigoProduto_key" ON "VinculoFornecedor"("fornecedorId", "codigoProduto");
CREATE UNIQUE INDEX "Prato_nome_key" ON "Prato"("nome");

-- AddForeignKey
ALTER TABLE "NotaCompra" ADD CONSTRAINT "NotaCompra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotaCompra" ADD CONSTRAINT "NotaCompra_aprovadaPorId_fkey" FOREIGN KEY ("aprovadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ItemNota" ADD CONSTRAINT "ItemNota_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NotaCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItemNota" ADD CONSTRAINT "ItemNota_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ParcelaNota" ADD CONSTRAINT "ParcelaNota_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NotaCompra"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VinculoFornecedor" ADD CONSTRAINT "VinculoFornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VinculoFornecedor" ADD CONSTRAINT "VinculoFornecedor_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MovimentoEstoque" ADD CONSTRAINT "MovimentoEstoque_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NotaCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NotaCompra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContaPagar" ADD CONSTRAINT "ContaPagar_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FichaItem" ADD CONSTRAINT "FichaItem_pratoId_fkey" FOREIGN KEY ("pratoId") REFERENCES "Prato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FichaItem" ADD CONSTRAINT "FichaItem_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
