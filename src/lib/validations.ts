import { z } from "zod";
import { NextResponse } from "next/server";

// ── Enums ──────────────────────────────────────────────────────────────────────

const transactionType = z.enum(["INCOME", "EXPENSE"]);

// ── Transactions ───────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres"),
  date: z.string().min(1, "Data é obrigatória"), // ISO string ou YYYY-MM-DD
  amount: z.number({ error: "Valor é obrigatório" }).positive("Valor deve ser maior que zero"),
  type: transactionType,
  categoryId: z.string().uuid("ID de categoria inválido").nullable().optional(),
  originId: z.string().uuid("ID de origem inválido").nullable().optional(),
  userId: z.string().optional(), // Será sobrescrito pelo auth
});

export const updateTransactionSchema = z.object({
  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição deve ter no máximo 500 caracteres")
    .optional(),
  date: z.string().min(1, "Data é obrigatória").optional(),
  amount: z.number().positive("Valor deve ser maior que zero").optional(),
  type: transactionType.optional(),
  categoryId: z.string().uuid("ID de categoria inválido").nullable().optional(),
  originId: z.string().uuid("ID de origem inválido").nullable().optional(),
  // Campos que serão removidos antes do update, mas precisam ser aceitos no body
  user: z.unknown().optional(),
  category: z.unknown().optional(),
  origin: z.unknown().optional(),
  createdAt: z.unknown().optional(),
});

export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1, "ID inválido"))
    .min(1, "Pelo menos um ID é obrigatório")
    .max(1000, "Máximo de 1000 itens por requisição"),
});

export const importTransactionItemSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória").max(500),
  amount: z.number().positive("Valor deve ser maior que zero"),
  type: transactionType,
});

export const importTransactionsSchema = z.object({
  transactions: z
    .array(importTransactionItemSchema)
    .min(1, "Pelo menos uma transação é obrigatória")
    .max(5000, "Máximo de 5000 transações por importação"),
  originId: z.string().uuid("ID de origem inválido").nullable().optional(),
});

// ── Categories ─────────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  group: z.string().min(1, "Grupo é obrigatório").max(100),
  subgroup: z.string().min(1, "Subgrupo é obrigatório").max(100),
  type: transactionType,
  expected: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null || val === "" || val === undefined) return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) || num < 0 ? null : num;
    })
    .nullable()
    .optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$|^hsl\(\d+,\s*\d+%,\s*\d+%\)$/, "Cor inválida").optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100).optional(),
  group: z.string().min(1, "Grupo é obrigatório").max(100).optional(),
  subgroup: z.string().min(1, "Subgrupo é obrigatório").max(100).optional(),
  type: transactionType.optional(),
  expected: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => {
      if (val === null || val === "" || val === undefined) return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) || num < 0 ? null : num;
    })
    .nullable()
    .optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$|^hsl\(\d+,\s*\d+%,\s*\d+%\)$/, "Cor inválida").optional(),
  // Campos que serão removidos antes do update
  transactions: z.unknown().optional(),
  createdAt: z.unknown().optional(),
});

// ── Origins ────────────────────────────────────────────────────────────────────

export const createOriginSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
});

// ── Helper ─────────────────────────────────────────────────────────────────────

import type { ZodSchema } from "zod";

/**
 * Faz o parse e validação de um body usando um schema Zod.
 * Retorna o body validado ou uma resposta 400 com os erros.
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return {
    success: false,
    response: NextResponse.json(
      { error: "Dados inválidos", details: errors },
      { status: 400 }
    ),
  };
}
