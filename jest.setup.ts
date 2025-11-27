import { PrismaClient } from '@prisma/client';

// Mock do Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    usuario: {
      create: jest.fn(),
      findUnique: jest.fn(),
      // adicione outros métodos conforme necessário
    },
    auditoria: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
  };
});
