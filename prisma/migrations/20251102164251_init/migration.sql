-- CreateTable
CREATE TABLE `organizacoes` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `sigla` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setores` (
    `id` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,

    INDEX `setores_organizacaoId_idx`(`organizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `papeis` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,

    UNIQUE INDEX `papeis_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios_setores` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `setorId` VARCHAR(191) NOT NULL,
    `papelId` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usuarios_setores_setorId_idx`(`setorId`),
    UNIQUE INDEX `usuarios_setores_usuarioId_setorId_papelId_key`(`usuarioId`, `setorId`, `papelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categorias` (
    `id` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,

    INDEX `categorias_organizacaoId_idx`(`organizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `servicos` (
    `id` VARCHAR(191) NOT NULL,
    `categoriaId` VARCHAR(191) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `servicos_categoriaId_idx`(`categoriaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NULL,
    `cursoNome` VARCHAR(191) NULL,
    `cursoSigla` VARCHAR(16) NULL,
    `nome` VARCHAR(191) NOT NULL,
    `emailPessoal` VARCHAR(191) NOT NULL,
    `emailEducacional` VARCHAR(191) NULL,
    `ra` VARCHAR(32) NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `papel` ENUM('USUARIO', 'BACKOFFICE', 'TECNICO', 'ADMINISTRADOR') NOT NULL DEFAULT 'USUARIO',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `anonimizado` BOOLEAN NOT NULL DEFAULT false,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `deletadoEm` DATETIME(3) NULL,
    `loginAttempts` INTEGER NOT NULL DEFAULT 0,
    `lockedUntil` DATETIME(3) NULL,
    `lastFailedAttempt` DATETIME(3) NULL,

    UNIQUE INDEX `usuarios_emailPessoal_key`(`emailPessoal`),
    UNIQUE INDEX `usuarios_ra_key`(`ra`),
    INDEX `usuarios_emailPessoal_idx`(`emailPessoal`),
    INDEX `usuarios_organizacaoId_idx`(`organizacaoId`),
    INDEX `usuarios_cursoSigla_idx`(`cursoSigla`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessoes` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `refreshHash` VARCHAR(255) NOT NULL,
    `userAgent` VARCHAR(191) NULL,
    `ip` VARCHAR(64) NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultimoUsoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revogadaEm` DATETIME(3) NULL,
    `substituidaPorId` VARCHAR(191) NULL,

    INDEX `sessoes_usuarioId_idx`(`usuarioId`),
    INDEX `sessoes_expiraEm_idx`(`expiraEm`),
    INDEX `sessoes_revogadaEm_idx`(`revogadaEm`),
    UNIQUE INDEX `sessoes_refreshHash_key`(`refreshHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_reset_senha` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `usadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tokens_reset_senha_usuarioId_idx`(`usuarioId`),
    INDEX `tokens_reset_senha_expiraEm_idx`(`expiraEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(14) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(20) NULL,
    `idExterno` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `deletadoEm` DATETIME(3) NULL,

    UNIQUE INDEX `clientes_cpf_key`(`cpf`),
    INDEX `clientes_nome_idx`(`nome`),
    INDEX `clientes_cpf_idx`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratos` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(64) NOT NULL,
    `plano` VARCHAR(191) NULL,
    `dataInicio` DATETIME(3) NULL,
    `dataFim` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `deletadoEm` DATETIME(3) NULL,

    INDEX `contratos_clienteId_idx`(`clienteId`),
    UNIQUE INDEX `contratos_clienteId_numero_key`(`clienteId`, `numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chamados` (
    `id` VARCHAR(191) NOT NULL,
    `organizacaoId` VARCHAR(191) NULL,
    `protocolo` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `nivel` ENUM('N1', 'N2', 'N3') NOT NULL DEFAULT 'N1',
    `status` ENUM('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'ENCERRADO') NOT NULL DEFAULT 'ABERTO',
    `prioridade` ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    `servicoId` VARCHAR(191) NULL,
    `setorId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `contratoId` VARCHAR(191) NULL,
    `responsavelId` VARCHAR(191) NULL,
    `criadoPorId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `encerradoEm` DATETIME(3) NULL,
    `deletadoEm` DATETIME(3) NULL,

    UNIQUE INDEX `chamados_protocolo_key`(`protocolo`),
    INDEX `chamados_status_nivel_idx`(`status`, `nivel`),
    INDEX `chamados_criadoEm_idx`(`criadoEm`),
    INDEX `chamados_clienteId_idx`(`clienteId`),
    INDEX `chamados_setorId_idx`(`setorId`),
    INDEX `chamados_servicoId_idx`(`servicoId`),
    INDEX `chamados_organizacaoId_idx`(`organizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historico_status_chamado` (
    `id` VARCHAR(191) NOT NULL,
    `chamadoId` VARCHAR(191) NOT NULL,
    `de` ENUM('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'ENCERRADO') NULL,
    `para` ENUM('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_USUARIO', 'RESOLVIDO', 'ENCERRADO') NOT NULL,
    `porUsuarioId` VARCHAR(191) NULL,
    `observacao` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historico_status_chamado_chamadoId_idx`(`chamadoId`),
    INDEX `historico_status_chamado_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagens` (
    `id` VARCHAR(191) NOT NULL,
    `chamadoId` VARCHAR(191) NOT NULL,
    `autorId` VARCHAR(191) NOT NULL,
    `conteudo` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `deletadoEm` DATETIME(3) NULL,

    INDEX `mensagens_chamadoId_idx`(`chamadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anexos` (
    `id` VARCHAR(191) NOT NULL,
    `chamadoId` VARCHAR(191) NOT NULL,
    `nomeArquivo` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `tamanhoBytes` INTEGER NOT NULL,
    `caminhoArquivo` VARCHAR(191) NOT NULL,
    `storageBucket` VARCHAR(191) NULL DEFAULT 'anexos',
    `checksumSha256` VARCHAR(64) NULL,
    `enviadoPorId` VARCHAR(191) NOT NULL,
    `enviadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `anexos_chamadoId_idx`(`chamadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(16) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_nome_key`(`nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chamados_tags` (
    `chamadoId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    INDEX `chamados_tags_tagId_idx`(`tagId`),
    PRIMARY KEY (`chamadoId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` VARCHAR(191) NOT NULL,
    `feitoPorId` VARCHAR(191) NULL,
    `acao` VARCHAR(191) NOT NULL,
    `alvo` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `feitoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `auditoria_feitoEm_idx`(`feitoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_envios` (
    `id` VARCHAR(191) NOT NULL,
    `destinatario` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `providerMsgId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `erro` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `enviadoEm` DATETIME(3) NULL,

    INDEX `email_envios_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `login_tentativas` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NULL,
    `sucesso` BOOLEAN NOT NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(191) NULL,
    `motivo` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `login_tentativas_email_criadoEm_idx`(`email`, `criadoEm`),
    INDEX `login_tentativas_usuarioId_criadoEm_idx`(`usuarioId`, `criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacoes` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensagem` VARCHAR(191) NOT NULL,
    `tipo` ENUM('CHAMADO_CRIADO', 'CHAMADO_ATRIBUIDO', 'CHAMADO_ATUALIZADO', 'STATUS_ALTERADO', 'MENSAGEM_NOVA', 'ANEXO_NOVO', 'SISTEMA') NOT NULL,
    `canal` ENUM('IN_APP', 'EMAIL', 'PUSH') NOT NULL DEFAULT 'IN_APP',
    `organizacaoId` VARCHAR(191) NULL,
    `chamadoId` VARCHAR(191) NULL,
    `mensagemId` VARCHAR(191) NULL,
    `anexoId` VARCHAR(191) NULL,
    `entregueEm` DATETIME(3) NULL,
    `lidaEm` DATETIME(3) NULL,
    `arquivadaEm` DATETIME(3) NULL,
    `erroEntrega` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notificacoes_usuarioId_criadoEm_idx`(`usuarioId`, `criadoEm`),
    INDEX `notificacoes_chamadoId_idx`(`chamadoId`),
    INDEX `notificacoes_organizacaoId_idx`(`organizacaoId`),
    INDEX `notificacoes_tipo_canal_idx`(`tipo`, `canal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `setores` ADD CONSTRAINT `setores_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `organizacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_setores` ADD CONSTRAINT `usuarios_setores_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_setores` ADD CONSTRAINT `usuarios_setores_setorId_fkey` FOREIGN KEY (`setorId`) REFERENCES `setores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios_setores` ADD CONSTRAINT `usuarios_setores_papelId_fkey` FOREIGN KEY (`papelId`) REFERENCES `papeis`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categorias` ADD CONSTRAINT `categorias_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `organizacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `servicos` ADD CONSTRAINT `servicos_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `categorias`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `organizacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_substituidaPorId_fkey` FOREIGN KEY (`substituidaPorId`) REFERENCES `sessoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessoes` ADD CONSTRAINT `sessoes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tokens_reset_senha` ADD CONSTRAINT `tokens_reset_senha_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratos` ADD CONSTRAINT `contratos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `organizacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `servicos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_setorId_fkey` FOREIGN KEY (`setorId`) REFERENCES `setores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `contratos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados` ADD CONSTRAINT `chamados_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_status_chamado` ADD CONSTRAINT `historico_status_chamado_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historico_status_chamado` ADD CONSTRAINT `historico_status_chamado_porUsuarioId_fkey` FOREIGN KEY (`porUsuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagens` ADD CONSTRAINT `mensagens_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anexos` ADD CONSTRAINT `anexos_enviadoPorId_fkey` FOREIGN KEY (`enviadoPorId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados_tags` ADD CONSTRAINT `chamados_tags_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chamados_tags` ADD CONSTRAINT `chamados_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_feitoPorId_fkey` FOREIGN KEY (`feitoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `login_tentativas` ADD CONSTRAINT `login_tentativas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_organizacaoId_fkey` FOREIGN KEY (`organizacaoId`) REFERENCES `organizacoes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_mensagemId_fkey` FOREIGN KEY (`mensagemId`) REFERENCES `mensagens`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notificacoes` ADD CONSTRAINT `notificacoes_anexoId_fkey` FOREIGN KEY (`anexoId`) REFERENCES `anexos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
