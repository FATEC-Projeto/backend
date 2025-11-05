import { FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import { buildRouteValidator } from '../../utils/zod-helpers';
import { ListAnexosSchema, ParamsWithTicketIdSchema, UploadAnexoSchema, DownloadAnexoSchema } from './anexos.types';
import { listAnexosByTicketId, createAnexo, getAnexoForDownload } from './anexos.service';
import { generateDownloadToken } from '../../utils/jwt';

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

const listValidator = buildRouteValidator({
    params: ListAnexosSchema.shape.params 
});
const uploadValidator = buildRouteValidator({
    params: UploadAnexoSchema.shape.params 
});
const downloadValidator = buildRouteValidator({
    params: DownloadAnexoSchema.shape.params
});


/* GET /tickets/:id/anexos */
export async function list(req: FastifyRequest, res: FastifyReply) {
    const parsed = listValidator.parse(req); 
    if ('error' in parsed) return res.code(400).send(parsed.error);

    const prisma = (req.server as any).prisma;
    const { id: chamadoId } = parsed.data!.params!;

    try {
        const anexos = await listAnexosByTicketId(prisma, chamadoId);
        return res.send(anexos);
    } catch (e: any) {
        req.log.error({ e }, "Erro ao listar anexos");
        const code = e?.code === 'P2025' ? 404 : 500;
        const message = e?.code === 'P2025' ? "Chamado não encontrado" : errMsg(e);
        return res.code(code).send({ error: message });
    }
}

/* POST /tickets/:id/anexos */
export async function upload(req: FastifyRequest, res: FastifyReply) {
     const parsed = uploadValidator.parse(req); 
     if ('error' in parsed) return res.code(400).send(parsed.error);

    const prisma = (req.server as any).prisma;
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) return res.code(401).send({ error: "Não autenticado" });

    const { id: chamadoId } = parsed.data!.params!;

    try {
        const anexo = await createAnexo(prisma, req, chamadoId, userId);
        return res.code(201).send(anexo);
    } catch (e: any) {
        req.log.error({ e }, "Erro ao fazer upload de anexo");
         const code = e?.statusCode || 500;
        return res.code(code).send({ error: errMsg(e) });
    }
}

/* GET /anexos/:anexoId/download */
export async function download(req: FastifyRequest, res: FastifyReply) {
    const parsed = downloadValidator.parse(req); 
    if ('error' in parsed) return res.code(400).send(parsed.error);

    const prisma = (req.server as any).prisma;
     const userId = (req as any).user?.sub as string | undefined;
     if (!userId) return res.code(401).send({ error: "Não autenticado" });

    const { anexoId } = parsed.data!.params!;

    const userRole = (req as any).user?.role as string | undefined;

    try {
        const { filePath, fileName, mimeType } = await getAnexoForDownload(prisma, anexoId, userId, userRole);

        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        res.header('Content-Type', mimeType);

        const stream = fs.createReadStream(filePath);
        return res.send(stream);

    } catch (e: any) {
        req.log.error({ e }, "Erro ao baixar anexo");
        const code = e?.statusCode || 500;
        return res.code(code).send({ error: errMsg(e) });
    }
}

/* POST /anexos/:anexoId/download-token */
export async function generateDownloadTokenRoute(req: FastifyRequest, res: FastifyReply): Promise<any> {
    const userId = (req as any).user?.sub as string | undefined;
    if (!userId) return res.code(401).send({ error: "Não autenticado" });

    const anexoId = (req.params as any)?.anexoId as string | undefined;
    if (!anexoId) return res.code(400).send({ error: 'Parâmetro anexoId ausente' });

    const prisma = (req.server as any).prisma;

    try {
        const userRole = (req as any).user?.role as string | undefined;
        await getAnexoForDownload(prisma, anexoId, userId, userRole);

        const token: string = generateDownloadToken({ sub: userId, anexoId }, { expiresIn: '5m' });
        return res.send({ token, expiresIn: 300 });
    } catch (e: any) {
        req.log.error({ e }, "Erro ao gerar token de download");
        const code = e?.statusCode || 500;
        return res.code(code).send({ error: e?.message ?? String(e) });
    }
}