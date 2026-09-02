// src/utils/zod-helpers.ts
import { z, ZodTypeAny } from "zod";

const normalizeBooleanish = (value: boolean | string | undefined): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (!value) return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return undefined;
};

/** Strings comuns */
export const zStringTrim = z.string().trim();
export const zEmail = zStringTrim.email("E-mail inválido");
export const zPassword = zStringTrim.min(8, "Senha deve ter no mínimo 8 caracteres");

// Se você usa cuid2 no Prisma, pode usar o validator nativo:
export const zCuid = zStringTrim.regex(/^c[^\s]{24}$/, "ID inválido (cuid)");
// ou: export const zCuid = z.string().cuid2();
export const zOptionalCuid = zCuid.optional();

export const zUserAgent = zStringTrim.max(512).optional();
export const zIP = zStringTrim.max(64).optional();

/** Boolean que aceita "true"/"false" (querystring) */
export const zBooleanish = z
  .union([z.boolean(), zStringTrim])
  .transform((value) => normalizeBooleanish(value))
  .optional();

/** Datas ISO (string) -> Date */
export const zDateISO = zStringTrim
  .refine((v) => !Number.isNaN(Date.parse(v)), "Data inválida")
  .transform((v) => new Date(v));

/** Paginação básica */
export const zPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/* ===================================================================
   PAPEL: use literais estáveis (compatível com Prisma) + z.enum
   (evita depender do enum @prisma/client na etapa de typecheck)
=================================================================== */
export const PAPEL_VALUES = ["USUARIO", "BACKOFFICE", "TECNICO", "ADMINISTRADOR"] as const;
export type PapelValue = (typeof PAPEL_VALUES)[number];

export const zPapelStrict = z.enum(PAPEL_VALUES); // aceita só exatamente os valores

/** Entrada flexível: "usuario", "técnico", "tecnico", etc -> normaliza p/ enum */
export const zPapel = z
  .string()
  .trim()
  .transform((v) => v.toUpperCase().replace(/\s+/g, "_"))
  .refine((v) => (PAPEL_VALUES as readonly string[]).includes(v), "Papel inválido")
  .transform((v) => v as PapelValue);

/** Papel opcional com default USUARIO */
export const zPapelOptional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v.toUpperCase().replace(/\s+/g, "_") : "USUARIO"))
  .transform((v) => (PAPEL_VALUES as readonly string[]).includes(v) ? (v as PapelValue) : "USUARIO");

/** Helper pra montar schema de rota (body/query/params) com parse + tipagem */
export function buildRouteValidator<
  B extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined,
  P extends ZodTypeAny | undefined
>(opts: { body?: B; query?: Q; params?: P }) {
  type BodyOut = B extends ZodTypeAny ? z.infer<B> : undefined;
  type QueryOut = Q extends ZodTypeAny ? z.infer<Q> : undefined;
  type ParamsOut = P extends ZodTypeAny ? z.infer<P> : undefined;

  const bodySchema = opts.body;
  const querySchema = opts.query;
  const paramsSchema = opts.params;

  return {
    parse(req: any) {
      const out: { body?: BodyOut; query?: QueryOut; params?: ParamsOut } = {};
      if (bodySchema) {
        const r = bodySchema.safeParse(req.body);
        if (!r.success) return { error: formatZodError(r.error) };
        out.body = r.data as BodyOut;
      }
      if (querySchema) {
        const r = querySchema.safeParse(req.query);
        if (!r.success) return { error: formatZodError(r.error) };
        out.query = r.data as QueryOut;
      }
      if (paramsSchema) {
        const r = paramsSchema.safeParse(req.params);
        if (!r.success) return { error: formatZodError(r.error) };
        out.params = r.data as ParamsOut;
      }
      return { data: out };
    },
  };
}

/** Formata erro do Zod em algo amigável pra API */
export function formatZodError(err: z.ZodError) {
  return {
    message: "Validação falhou",
    issues: err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
      code: i.code,
    })),
  };
}
