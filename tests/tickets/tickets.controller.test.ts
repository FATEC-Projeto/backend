import { PrismaClient } from '@prisma/client';
import * as NotifyModule from '../../src/core/notifications/notify'; 

// -----------------------------------------------------
// 1. MOCKS ESSENCIAIS (DEFINIDOS PRIMEIRO)
// -----------------------------------------------------

// Define a função mockada usando LET no escopo superior
let mockCreateTicket: jest.Mock;

jest.mock('../../src/core/tickets/tickets.service', () => ({
 
   createTicket: mockCreateTicket = jest.fn(), 
   getTicketById: jest.fn(),
   listTickets: jest.fn(),
   updateTicket: jest.fn(),
   softDeleteTicket: jest.fn(),
}));

import * as TicketController from '../../src/core/tickets/tickets.controller'; 

// -----------------------------------------------------
// 2. CONSTANTES
// -----------------------------------------------------

const MOCK_CRIADOR_ID = 'user-creator-id-123';
const MOCK_ORGANIZACAO_ID = 'org-id-001';
const mockPrismaClient = {} as PrismaClient; 
const mockNotifyMany = jest.spyOn(NotifyModule, 'notifyMany').mockResolvedValue(undefined as any);


const mockCreatedTicket = {
  id: 'tck-007',
  titulo: 'Problema com Acesso',
  protocolo: 'TCK-ABCDE',
  descricao: 'Não consigo logar no sistema X.',
  status: 'ABERTO',
  nivel: 'N1',
  prioridade: 'MEDIA',
  criadoPorId: MOCK_CRIADOR_ID,
  organizacaoId: MOCK_ORGANIZACAO_ID,
  servicoId: 'svc-1',
  setorId: null,
  responsavelId: null,
  criadoEm: new Date(),
  servico: { id: 'svc-1', nome: 'Acesso e Login' },
  criadoPor: { id: MOCK_CRIADOR_ID, nome: 'User Teste' },
};

// -----------------------------------------------------
// 3. SUITE DE TESTES
// ----------------------------------------------------

describe('TicketController - Criação (POST /tickets)', () => {

  afterEach(() => {
    jest.clearAllMocks();
    // Limpeza da função mockada
    if (mockCreateTicket) {
      mockCreateTicket.mockClear();
    }
  });

  // =======================================================
  // CENÁRIO 1: Criação com Sucesso (201)
  // =======================================================
  it('deve criar um novo chamado com dados mínimos e retornar 201', async () => {
    mockCreateTicket.mockResolvedValueOnce(mockCreatedTicket as any);

    const requestBody = {
      titulo: 'Ticket Mínimo',
      descricao: 'Descrição mínima.',
      organizacaoId: MOCK_ORGANIZACAO_ID,
      servicoId: 'svc-1',
    };

    const mockRequest: any = {
      body: requestBody,
      server: { prisma: mockPrismaClient }, 
      log: { error: jest.fn() },
      user: { sub: MOCK_CRIADOR_ID }, 
    };

    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    await TicketController.create(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith(mockCreatedTicket);
    
    expect(mockCreateTicket).toHaveBeenCalledWith(
      mockPrismaClient, 
      expect.objectContaining(requestBody),
      expect.objectContaining({ 
        feitoPorId: MOCK_CRIADOR_ID,
      })
    );
  });

  // =======================================================
  // CENÁRIO 2: Falha de Autenticação (401)
  // =======================================================
  it('deve retornar 401 se o usuário não estiver autenticado (falta req.user.sub)', async () => {
    const mockRequest: any = {
      body: { titulo: 'Falha', descricao: 'Falha' },
      server: { prisma: mockPrismaClient },
      log: { error: jest.fn() },
      user: undefined, 
    };

    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    await TicketController.create(mockRequest, mockReply);

    expect(mockCreateTicket).not.toHaveBeenCalled();
    expect(mockReply.code).toHaveBeenCalledWith(401); 
    expect(mockReply.send).toHaveBeenCalledWith({ error: "Não autenticado" });
  });

  // =======================================================
  // CENÁRIO 3: Falha Interna no Service (500)
  // =======================================================
  it('deve retornar 500 se o Service lançar uma exceção não tratada', async () => {
    const MOCK_ERROR = new Error("Database connection failed");
    mockCreateTicket.mockRejectedValueOnce(MOCK_ERROR);

    const mockRequest: any = {
      body: { titulo: 'Erro 500', descricao: 'Descrição do erro.', organizacaoId: MOCK_ORGANIZACAO_ID, servicoId: 'svc-1' },
      server: { prisma: mockPrismaClient },
      log: { error: jest.fn() }, 
      user: { sub: MOCK_CRIADOR_ID }, 
    };

    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    await TicketController.create(mockRequest, mockReply);

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({ error: MOCK_ERROR.message });
    expect(mockRequest.log.error).toHaveBeenCalled(); 
  });
});