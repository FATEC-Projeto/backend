import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { FastifyRequest } from 'fastify';
import { notifyMany } from '../notifications/notify'; 


type Ctx = PrismaClient;
const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads'); 

// Função auxiliar para garantir nome de arquivo único
const generateUniqueFilename = (originalName: string): string => {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    // Limpa caracteres não seguros e adiciona hash + timestamp
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const hash = crypto.randomBytes(4).toString('hex');
    return `${Date.now()}_${hash}_${safeBaseName}${ext}`;
};

export async function listAnexosByTicketId(prisma: Ctx, chamadoId: string) {
    // Verifica se chamado existe
    await prisma.chamado.findUniqueOrThrow({ where: { id: chamadoId }});

    return prisma.anexo.findMany({
        where: { chamadoId },
        orderBy: { enviadoEm: 'asc' },
        select: {
            id: true,
            nomeArquivo: true,
            mimeType: true,
            tamanhoBytes: true,
            enviadoEm: true,
            enviadoPor: { select: { id: true, nome: true } },
        },
    });
}

export async function createAnexo(prisma: Ctx, req: FastifyRequest, chamadoId: string, userId: string) {
    const data = await req.file();
    if (!data) {
        throw new Error("Nenhum arquivo enviado.");
    }

    // Verifica se chamado existe
     const chamado = await prisma.chamado.findUnique({
         where: { id: chamadoId },
         select: { id: true, protocolo: true, criadoPorId: true, responsavelId: true, organizacaoId: true, setorId: true }, 
     });
     if (!chamado) {
         throw Object.assign(new Error("Chamado não encontrado"), { statusCode: 404 });
     }


    const uniqueFilename = generateUniqueFilename(data.filename);
    const filePath = path.join(UPLOADS_DIR, uniqueFilename);

    // Salva o arquivo no disco
    await fs.writeFile(filePath, await data.toBuffer());
    const stats = await fs.stat(filePath); 

    const anexo = await prisma.anexo.create({
        data: {
            chamadoId: chamadoId,
            enviadoPorId: userId,
            nomeArquivo: data.filename, 
            mimeType: data.mimetype,
            tamanhoBytes: stats.size,
            caminhoArquivo: uniqueFilename
        },
        select: {
            id: true,
            nomeArquivo: true,
            mimeType: true,
            tamanhoBytes: true,
            enviadoEm: true,
            enviadoPor: { select: { id: true, nome: true } },
        }
    });

     const alvosNotificacao = new Set<string>();
     if (chamado.criadoPorId && chamado.criadoPorId !== userId) alvosNotificacao.add(chamado.criadoPorId);
     if (chamado.responsavelId && chamado.responsavelId !== userId) alvosNotificacao.add(chamado.responsavelId);

     if (alvosNotificacao.size > 0) {
         try {
             await notifyMany(prisma, Array.from(alvosNotificacao), {
                 titulo: "Novo anexo no chamado",
                 mensagem: `Um novo arquivo (${anexo.nomeArquivo}) foi adicionado ao chamado ${chamado.protocolo ?? chamado.id}.`,
                 tipo: "ANEXO_NOVO",
                 canal: "IN_APP", 
                 chamadoId: chamado.id,
                 anexoId: anexo.id,
                 organizacaoId: chamado.organizacaoId ?? null,
             });
         } catch (notifyError) {
             req.log.error({ err: notifyError }, "Falha ao enviar notificação de novo anexo");
         }
     }


    return anexo;
}

export async function getAnexoForDownload(prisma: Ctx, anexoId: string, userId: string, userRole?: string) {
    const anexo = await prisma.anexo.findUnique({
        where: { id: anexoId },
        include: { chamado: { select: { id: true, criadoPorId: true, responsavelId: true, setor: { select: { usuarioSetores: { select: { usuarioId: true } } } } } } } // Inclui dados para verificação de permissão
    });

    if (!anexo) {
        throw Object.assign(new Error("Anexo não encontrado"), { statusCode: 404 });
    }

    const elevatedRoles = new Set(['ADMINISTRADOR', 'BACKOFFICE']);
    if (userRole && elevatedRoles.has(userRole)) {
        // allow
    } else {
        const isCriador = anexo.chamado.criadoPorId === userId;
        const isResponsavel = anexo.chamado.responsavelId === userId;
        const isUploader = anexo.enviadoPorId === userId;
        // Verifica se o usuário pertence ao setor do chamado
        const isMembroSetor = anexo.chamado.setor?.usuarioSetores.some(us => us.usuarioId === userId) ?? false;

        const hasPermission = isCriador || isResponsavel || isUploader || isMembroSetor;

        if (!hasPermission) {
            throw Object.assign(new Error("Acesso negado a este anexo"), { statusCode: 403 });
        }
    }


    const filePath = path.join(UPLOADS_DIR, anexo.caminhoArquivo);

    // Verifica se o arquivo físico existe
    try {
        await fs.access(filePath);
    } catch {
        throw Object.assign(new Error("Arquivo físico não encontrado no servidor"), { statusCode: 404 });
    }

    return {
        filePath, 
        fileName: anexo.nomeArquivo, 
        mimeType: anexo.mimeType,
    };
}