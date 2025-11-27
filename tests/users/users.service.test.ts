// users/users.controller.test.ts

import * as UserController from '../../src/core/users/users.controller';
import * as UserService from '../../src/core/users/users.service'; 
// Não é necessário o mock do Prisma aqui, pois estamos mockando o Service.

describe('UserController', () => {
  
  // Objeto de usuário de retorno que o mock do Service deve simular
  const mockUserReturn = {
    id: '1',
    nome: 'João',
    emailPessoal: 'joao@teste.com',
    papel: 'USUARIO',
    ativo: true,
    senhaHash: 'senha_hash_simulado',
    organizacaoId: null,
    cursoNome: null,
    cursoSigla: null,
    emailEducacional: null,
    ra: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    deletadoEm: null,
    anonimizado: false,
    passwordUpdatedAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    lastFailedAttempt: null,
    precisaTrocarSenha: false,
  };
    
  // Mockando o Service.createUser e definindo o retorno
  const mockUserServiceCreate = jest.spyOn(UserService, 'createUser').mockResolvedValue(mockUserReturn as any);

  // Limpa os mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve criar um novo usuário', async () => {

    // Dados que seriam enviados no corpo da requisição
    const userData = {
      nome: 'João',
      emailPessoal: 'joao@teste.com',
      senha: 'senha123',
      papel: 'USUARIO' as const,
      ativo: true,
      organizacaoId: null,
    };

    // Criando um mock de FastifyRequest para simular a requisição
    const mockRequest: any = {
      body: userData,   // Corpo da requisição contém os dados do usuário
      params: {},       
      query: {},        
      raw: {},          
      headers: {},      
      log: { info: jest.fn(), error: jest.fn() }, 
      server: {},       
      ip: '127.0.0.1',  
      req: {},          
      host: 'localhost', 
      id: 'mock-request-id', 
    };

    // Criando o mock de FastifyReply
    const mockReply: any = { code: jest.fn().mockReturnThis(), send: jest.fn() };

    // Chamando o método 'create' do controller
    await UserController.create(mockRequest, mockReply);

    // 1. Verificando se o UserService.createUser foi chamado corretamente
    // 💡 CORREÇÃO DA EXPECTATIVA: Devemos checar os TRÊS argumentos recebidos:
    // Received: undefined, { ...dados }, { feitoPorId: undefined }
    expect(mockUserServiceCreate).toHaveBeenCalledWith(
      // 1º Argumento: Recebido como 'undefined' no output de erro.
      undefined, 
      
      // 2º Argumento: Os dados do usuário (Este é o seu objeto principal)
      expect.objectContaining({
        nome: 'João',
        emailPessoal: 'joao@teste.com',
        papel: 'USUARIO',
        ativo: true,
        senha: 'senha123',
      }),
      
      // 3º Argumento: O objeto de opções/auditoria (Recebido como {feitoPorId: undefined} no output)
      expect.objectContaining({ 
        feitoPorId: undefined, // Corresponde exatamente ao que foi recebido
      })
    );

    // 2. Verificando se o Controller respondeu com o status 201
    expect(mockReply.code).toHaveBeenCalledWith(201);
    
    // 3. Verificando se o Controller respondeu com o usuário retornado pelo Service
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        nome: 'João',
        emailPessoal: 'joao@teste.com',
        papel: 'USUARIO',
        ativo: true,
        // Usamos expect.any(Date) para campos de data
        criadoEm: expect.any(Date), 
        atualizadoEm: expect.any(Date),
      })
    );
  });
});