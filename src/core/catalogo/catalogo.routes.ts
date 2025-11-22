import type { FastifyInstance } from "fastify";

export async function catalogoRoutes(app: FastifyInstance) {
  app.get("/", async (req, res) => {
    const prisma = (req.server as any).prisma;

    try {
      const categorias = await prisma.categoria.findMany({
        include: {
          servicos: {
            where: { ativo: true },
            select: {
              id: true,
              nome: true,
              descricao: true,
              ativo: true,
              categoriaId: true,
            },
          },
        },
        orderBy: { nome: "asc" },
      });

      if (!categorias || categorias.length === 0) {
        return res.status(200).send({ categorias: [] });
      }

      return res.status(200).send({ categorias });
    } catch (e: any) {
      req.log.error(e, "Erro ao carregar catálogo");
      return res.status(500).send({ error: "Erro ao carregar catálogo" });
    }
  });
}
