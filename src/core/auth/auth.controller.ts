import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";  
import { PrismaClient } from "@prisma/client";  
import { loginService, refreshService, logoutService, meService } from "./auth.service";  
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt"; 

const prisma = new PrismaClient();

// Definir as interfaces para os corpos das requisições
interface LoginRequestBody {
  email: string;
  password: string;
}

interface RefreshRequestBody {
  refreshToken: string;
}

interface RegisterRequestBody {
  email: string;
  password: string;
  role?: string;
  name: string;
  educationalEmail?: string;
  ra?: string;
}

interface MeRequest {
  user: {
    sub: string;
    email: string;
    role: string;
  };
}

// Função para login
export const login = async (req: FastifyRequest<{ Body: LoginRequestBody }>, res: FastifyReply) => {
  const { email, password } = req.body;
  try {
    const { accessToken, refreshToken, user } = await loginService(email, password);
    return res.send({ user, accessToken, refreshToken });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ error: error.message || "Erro interno" });
    }
    return res.status(500).send({ error: "Erro desconhecido" });
  }
};

export const refresh = async (req: FastifyRequest<{ Body: RefreshRequestBody }>, res: FastifyReply) => {
  const { refreshToken } = req.body;
  try {
    const { accessToken } = await refreshService(refreshToken);
    return res.send({ accessToken });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ error: error.message || "Erro interno" });
    }
    return res.status(500).send({ error: "Erro desconhecido" });
  }
};

// Função para logout
export const logout = async (req: FastifyRequest<{ Body: RefreshRequestBody }>, res: FastifyReply) => {
  const { refreshToken } = req.body;
  try {
    await logoutService(refreshToken);
    return res.send({ message: "Logout realizado com sucesso" });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ error: error.message || "Erro interno" });
    }
    return res.status(500).send({ error: "Erro desconhecido" });
  }
};

// Função para obter os dados do usuário
export const me = async (req: FastifyRequest, res: FastifyReply) => {
  const user = req.user;  // `user` já foi adicionado pelo middleware
  try {
    const userData = await meService(user?.sub);  // Usando o ID do usuário para buscar dados
    return res.send(userData);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ error: error.message || "Erro interno" });
    }
    return res.status(500).send({ error: "Erro desconhecido" });
  }
};

// Função para cadastrar um novo usuário
export const register = async (req: FastifyRequest<{ Body: RegisterRequestBody }>, res: FastifyReply) => {
  const { email, password, role, name, educationalEmail, ra } = req.body;

  // Verificar se o email já está registrado
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).send({ error: "Email já está em uso" });
  }

  // Criptografar a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Criar o novo usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: role || "USER",  // Se não for passado, o role será "USER"
        name,
        educationalEmail,  
        ra,  
      },
    });

    console.log("Usuário criado com sucesso:", user);

    // Gerar os tokens de acesso e refresh
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ sub: user.id });

    return res.send({ user, accessToken, refreshToken });
  } catch (error) {
    console.error("Erro ao criar o usuário:", error);
    return res.status(500).send({ error: "Erro ao criar o usuário", details: error.message });
  }
};

export const getUser = async (req: FastifyRequest<{ Querystring: { ra?: string, email?: string, id?: string, name?: string, educationalEmail?: string } }>, res: FastifyReply) => {
  const { ra, email, id, name, educationalEmail } = req.query;

  // Preparar o filtro para a consulta
  const filter: any = {};

  if (ra) filter.ra = ra;
  if (email) filter.email = email;
  if (id) filter.id = id;
  if (name) filter.name = { contains: name };  // Busca pelo nome 
  if (educationalEmail) filter.educationalEmail = educationalEmail;

  try {
    // Consultar o usuário com base no filtro fornecido
    const user = await prisma.user.findMany({
      where: filter,
    });

    if (user.length === 0) {
      return res.status(404).send({ error: "Usuário não encontrado" });
    }

    return res.send(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ error: error.message || "Erro interno" });
    }
    return res.status(500).send({ error: "Erro desconhecido" });
  }
};
