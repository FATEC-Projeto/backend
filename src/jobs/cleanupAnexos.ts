import fs from "fs/promises";
import path from "path";
import type { PrismaClient } from "@prisma/client";

const BUSINESS_DAY_RETENTION = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Adds N business days (Mon–Fri) to a date, returning a new Date. */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

function shouldDeleteAnexo(enviadoEm: Date, now: Date): boolean {
  return addBusinessDays(enviadoEm, BUSINESS_DAY_RETENTION) <= now;
}

/** Deletes attachments whose 7-business-day retention window has elapsed. */
export async function runCleanupAnexos(
  prisma: PrismaClient,
  uploadsDir: string,
): Promise<void> {
  const now = new Date();
  // 7 calendar days is the minimum for 7 business days — safe pre-filter
  const preFilter = new Date(now.getTime() - BUSINESS_DAY_RETENTION * MS_PER_DAY);

  const candidates = await prisma.anexo.findMany({
    where: { enviadoEm: { lt: preFilter } },
    select: { id: true, caminhoArquivo: true, enviadoEm: true },
  });

  let deleted = 0;
  for (const anexo of candidates) {
    if (!shouldDeleteAnexo(anexo.enviadoEm, now)) continue;

    try {
      const filePath = path.isAbsolute(anexo.caminhoArquivo)
        ? anexo.caminhoArquivo
        : path.join(uploadsDir, anexo.caminhoArquivo);
      await fs.unlink(filePath).catch(() => {});
      await prisma.anexo.delete({ where: { id: anexo.id } });
      deleted++;
    } catch (err) {
      console.error(`[cleanup-anexos] erro ao deletar id=${anexo.id}:`, err);
    }
  }

  if (candidates.length > 0) {
    console.info(
      `[cleanup-anexos] candidatos=${candidates.length} deletados=${deleted}`,
    );
  }
}

/**
 * Schedules runCleanupAnexos to execute daily at 03:00 local time.
 * Uses only Node.js built-ins (no external scheduler package required).
 */
export function scheduleCleanupAnexos(
  prisma: PrismaClient,
  uploadsDir: string,
): void {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function msUntilNext3am(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next.getTime() - now.getTime();
  }

  function tick() {
    runCleanupAnexos(prisma, uploadsDir).catch((err) =>
      console.error("[cleanup-anexos] falha no job diário:", err),
    );
    setTimeout(tick, MS_PER_DAY);
  }

  setTimeout(tick, msUntilNext3am());
}
