/*
  Warnings:

  - Added the required column `emailContato` to the `sugestoes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sugestoes` ADD COLUMN `emailContato` VARCHAR(191) NOT NULL,
    ADD COLUMN `respondidoEm` DATETIME(3) NULL,
    ADD COLUMN `respondidoPorId` VARCHAR(191) NULL,
    ADD COLUMN `resposta` VARCHAR(500) NULL,
    ADD COLUMN `status` ENUM('NAO_RESPONDIDO', 'RESPONDIDO') NOT NULL DEFAULT 'NAO_RESPONDIDO';

-- CreateIndex
CREATE INDEX `sugestoes_status_idx` ON `sugestoes`(`status`);

-- AddForeignKey
ALTER TABLE `sugestoes` ADD CONSTRAINT `sugestoes_respondidoPorId_fkey` FOREIGN KEY (`respondidoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
