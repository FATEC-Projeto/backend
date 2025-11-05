import { z } from 'zod';

export const ParamsWithTicketIdSchema = z.object({
  id: z.string().min(1),
});

export const ParamsWithAnexoIdSchema = z.object({
  anexoId: z.string().cuid(), 
});

export const ListAnexosSchema = z.object({
    params: ParamsWithTicketIdSchema,
});

export const DownloadAnexoSchema = z.object({
    params: ParamsWithAnexoIdSchema,
});

export const UploadAnexoSchema = z.object({
    params: ParamsWithTicketIdSchema,
});