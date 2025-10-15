// prisma/seed.js
import { PrismaClient, Papel } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // IDs fixos para upsert idempotente
  const orgId = 'org_default';
  const setorSecretariaId = 'setor_secretaria';
  const setorSuporteId = 'setor_suporte';
  const catTIId = 'cat_ti';
  const catAcademicoId = 'cat_academico';
  const papelAlunoId = 'papel_aluno';
  const papelSecretariaId = 'papel_secretaria';
  const papelTecnicoId = 'papel_tecnico';
  const papelGestorId = 'papel_gestor';

  // Organização
  await prisma.organizacao.upsert({
    where: { id: orgId },
    create: { id: orgId, nome: 'Fatec Cotia', sigla: 'FATEC' },
    update: {},
  });

  // Setores
  await prisma.setor.upsert({
    where: { id: setorSecretariaId },
    create: { id: setorSecretariaId, nome: 'Secretaria', organizacaoId: orgId },
    update: {},
  });
  await prisma.setor.upsert({
    where: { id: setorSuporteId },
    create: { id: setorSuporteId, nome: 'Suporte Técnico', organizacaoId: orgId },
    update: {},
  });

  // Catálogo de papéis (por setor)
  await prisma.papelCatalogo.upsert({
    where: { id: papelAlunoId },
    create: { id: papelAlunoId, nome: 'aluno' },
    update: {},
  });
  await prisma.papelCatalogo.upsert({
    where: { id: papelSecretariaId },
    create: { id: papelSecretariaId, nome: 'secretaria' },
    update: {},
  });
  await prisma.papelCatalogo.upsert({
    where: { id: papelTecnicoId },
    create: { id: papelTecnicoId, nome: 'tecnico' },
    update: {},
  });
  await prisma.papelCatalogo.upsert({
    where: { id: papelGestorId },
    create: { id: papelGestorId, nome: 'gestor' },
    update: {},
  });

  // Categorias & serviços
  await prisma.categoria.upsert({
    where: { id: catTIId },
    create: { id: catTIId, nome: 'TI', organizacaoId: orgId },
    update: {},
  });
  await prisma.categoria.upsert({
    where: { id: catAcademicoId },
    create: { id: catAcademicoId, nome: 'Acadêmico', organizacaoId: orgId },
    update: {},
  });

  // Serviços (alguns sem categoria, outros vinculados)
  const svcLoginId = 'svc_login';
  const svcDeclaracaoId = 'svc_declaracao';
  const svcMatriculaId = 'svc_matricula';

  await prisma.servico.upsert({
    where: { id: svcLoginId },
    create: { id: svcLoginId, nome: 'Acesso ao Sistema', descricao: 'Problemas de login e senha', categoriaId: catTIId, ativo: true },
    update: {},
  });
  await prisma.servico.upsert({
    where: { id: svcDeclaracaoId },
    create: { id: svcDeclaracaoId, nome: 'Emissão de Declaração', descricao: 'Declaração de matrícula/frequência', categoriaId: catAcademicoId, ativo: true },
    update: {},
  });
  await prisma.servico.upsert({
    where: { id: svcMatriculaId },
    create: { id: svcMatriculaId, nome: 'Matrícula', descricao: 'Processos de matrícula', categoriaId: catAcademicoId, ativo: true },
    update: {},
  });

  // Usuário admin global (ajuste os dados e a hash depois)
  const adminId = 'user_admin';
  await prisma.usuario.upsert({
    where: { id: adminId },
    create: {
      id: adminId,
      organizacaoId: orgId,
      nome: 'Admin do Sistema',
      emailPessoal: 'admin@example.com',
      senhaHash: 'hash_fake_trocar_depois',
      papel: Papel.ADMINISTRADOR,
      ativo: true,
    },
    update: {},
  });

  // Vínculos do admin com setores (gestor)
  await prisma.usuarioSetor.upsert({
    where: { id: 'us_admin_secretaria' },
    create: { id: 'us_admin_secretaria', usuarioId: adminId, setorId: setorSecretariaId, papelId: papelGestorId },
    update: {},
  });
  await prisma.usuarioSetor.upsert({
    where: { id: 'us_admin_suporte' },
    create: { id: 'us_admin_suporte', usuarioId: adminId, setorId: setorSuporteId, papelId: papelGestorId },
    update: {},
  });

  console.log('✅ Seed concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
