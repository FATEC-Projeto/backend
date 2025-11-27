// users/users.controller.test.ts

import * as UserController from '../../src/core/users/users.controller';
import * as UserService from '../../src/core/users/users.service'; 
import { PrismaClient } from '@prisma/client';

const mockPrismaClient = {} as PrismaClient; 

describe('UserController', () => {
  
  // Objetos de retorno para mocks
  const mockUserReturn = {
    id: '1', nome: 'João', emailPessoal: 'joao@teste.com', papel: 'USUARIO', ativo: true,
    senhaHash: 'senha_hash_simulado', organizacaoId: null, cursoNome: null, cursoSigla: null,
    emailEducacional: null, ra: null, criadoEm: new Date(), atualizadoEm: new Date(),
    deletadoEm: null, anonimizado: false, passwordUpdatedAt: null, loginAttempts: 0,
    lockedUntil: null, lastFailedAttempt: null, precisaTrocarSenha: false,
  };

  const mockUserReturnAluno = {
    ...mockUserReturn,
    id: '2', 
    nome: 'Maria Aluna Fatec', 
    emailPessoal: 'maria.aluna@email.com',
    // DADOS FATEC/DSM ATUALIZADOS AQUI
    emailEducacional: 'maria.a.silva@fatec.sp.gov.br', 
    ra: '12345678',
    cursoNome: 'Desenvolvimento de Software Multiplataforma', 
    cursoSigla: 'DSM', 
  };
    
  const mockUserServiceCreate = jest.spyOn(UserService, 'createUser');

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- CENÁRIO 1: USUÁRIO PADRÃO ---
  it('deve criar um novo usuário padrão', async () => {
    mockUserServiceCreate.mockResolvedValueOnce(mockUserReturn as any);

    const userData = {
      nome: 'João', emailPessoal: 'joao@teste.com', senha: 'senha123',
      papel: 'USUARIO' as const, ativo: true, organizacaoId: null,
    };

    const mockRequest: any = {
      body: userData,   
      server: { prisma: mockPrismaClient }, 
      params: {}, query: {}, raw: {}, headers: {},      
      log: { info: jest.fn(), error: jest.fn() }, 
      ip: '127.0.0.1', req: {}, host: 'localhost', id: 'mock-request-id', 
    };

    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    await UserController.create(mockRequest, mockReply);

    expect(mockUserServiceCreate).toHaveBeenCalledWith(
      mockPrismaClient, 
      expect.objectContaining({ 
        nome: 'João', emailPessoal: 'joao@teste.com', papel: 'USUARIO',
        ativo: true, senha: 'senha123', organizacaoId: null, 
      }),
      expect.objectContaining({ 
        feitoPorId: undefined, 
      })
    );

    expect(mockReply.code).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1', nome: 'João', emailPessoal: 'joao@teste.com', papel: 'USUARIO',
      })
    );
  });

  // --- CENÁRIO 2: USUÁRIO ALUNO  ---
  it('deve criar um novo usuário Aluno Fatec (DSM) com RA e Email Educacional', async () => {
    mockUserServiceCreate.mockResolvedValueOnce(mockUserReturnAluno as any);

    const userDataAluno = {
      nome: 'Maria Aluna Fatec', 
      emailPessoal: 'maria.aluna@email.com',
      emailEducacional: 'maria.a.silva@fatec.sp.gov.br', 
      ra: '12345678',
      cursoNome: 'Desenvolvimento de Software Multiplataforma', 
      cursoSigla: 'DSM' as const, 
      senha: 'senha456', papel: 'USUARIO' as const, ativo: true,
      organizacaoId: null,
    };

    const mockRequest: any = {
      body: userDataAluno,   
      server: { prisma: mockPrismaClient }, 
      log: { info: jest.fn(), error: jest.fn() }, 
      ip: '127.0.0.1',
    };

    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    await UserController.create(mockRequest, mockReply);

    // Esperando o que o Controller REALMENTE PASSA (sem cursoNome/cursoSigla, se estiver filtrando)
    expect(mockUserServiceCreate).toHaveBeenCalledWith(
      mockPrismaClient, 
      expect.objectContaining({
        nome: 'Maria Aluna Fatec', 
        emailPessoal: 'maria.aluna@email.com',
        emailEducacional: 'maria.a.silva@fatec.sp.gov.br',
        ra: '12345678',
        senha: 'senha456',
        ativo: true,
        papel: 'USUARIO',
        organizacaoId: null,
      }),
      expect.objectContaining({ 
        feitoPorId: undefined, 
      })
    );

    expect(mockReply.code).toHaveBeenCalledWith(201);
    
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2', 
        nome: 'Maria Aluna Fatec', 
        emailPessoal: 'maria.aluna@email.com',
        emailEducacional: 'maria.a.silva@fatec.sp.gov.br', 
        ra: '12345678',
        cursoNome: 'Desenvolvimento de Software Multiplataforma', 
        cursoSigla: 'DSM',
      })
    );
  });
});