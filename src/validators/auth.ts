// src/validators/auth.ts
import { z } from "zod";
import { zEmail, zStringTrim, zPapelOptional } from "../utils/zod-helpers";

/** Ajuste a regex do RA conforme seu padrão real (numérico, alfanumérico, etc.) */
const zRA = zStringTrim.min(3).max(32).regex(/^[A-Za-z0-9._-]+$/, "RA inválido");

export const LoginSchema = z
  .object({
    email: zEmail.optional(),      // funcionários/professores/admin
    ra: zRA.optional(),            // alunos
    password: zStringTrim.min(8),
  })
  .refine((d) => (!!d.email) !== (!!d.ra), {
    message: "Informe email (funcionário) OU RA (aluno).",
  });

export const RefreshSchema = z.object({ refreshToken: z.string().min(20) });

export const RegisterSchema = z.object({
  email: zEmail,
  password: zStringTrim.min(8),
  role: zPapelOptional,
  name: zStringTrim.min(2),
  educationalEmail: zEmail.optional(),
  ra: zStringTrim.max(32).optional(),
});

export const ForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido"),
  }),
});

export const ResetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, "Token inválido"),
    novaSenha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  }),
});
