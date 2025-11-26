-- CreateTable
CREATE TABLE `avaliacoes_chamados` (
    `id` VARCHAR(191) NOT NULL,
    `chamadoId` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `avaliacoes_chamados_chamadoId_idx`(`chamadoId`),
    INDEX `avaliacoes_chamados_usuarioId_idx`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `avaliacoes_chamados` ADD CONSTRAINT `avaliacoes_chamados_chamadoId_fkey` FOREIGN KEY (`chamadoId`) REFERENCES `chamados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacoes_chamados` ADD CONSTRAINT `avaliacoes_chamados_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `auditoria` RENAME INDEX `auditoria_feitoPorId_fkey` TO `auditoria_feitoPorId_idx`;
