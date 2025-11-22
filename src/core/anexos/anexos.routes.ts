import { FastifyInstance } from 'fastify';
import { list, upload, download } from './anexos.controller';

export async function anexoRoutes(app: FastifyInstance) {
    // Aplica autenticação a todas as rotas de anexo
    app.addHook('preHandler', app.authenticate as any);

    // Listar anexos de um chamado específico
    app.get('/tickets/:id/anexos', list);

    // Fazer upload de um anexo para um chamado específico
    app.post('/tickets/:id/anexos', upload);

    // Baixar um anexo específico pelo ID do anexo
    app.get('/anexos/:anexoId/download', download);

    // Gerar token de download temporário (curta duração)
    app.post('/anexos/:anexoId/download-token', async (req, res) => {
        return (await import('./anexos.controller')).generateDownloadTokenRoute(req, res);
    });
}