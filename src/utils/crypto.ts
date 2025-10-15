import bcrypt from "bcrypt";

// Função para hash de um valor genérico
export const hashValue = async (value: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10); // Gera um "salt" com 10 rounds
  return bcrypt.hash(value, salt); // Retorna o hash do valor
};

// Função para verificar se um valor coincide com seu hash
export const verifyHash = async (value: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(value, hash); // Compara o valor com o hash armazenado
};

// Função para hash de senha
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10); // Gera o salt para a senha
  return bcrypt.hash(password, salt); // Retorna o hash da senha
};

// Função para comparar uma senha com o seu hash
export const comparePasswords = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash); // Compara a senha com o hash armazenado
};
