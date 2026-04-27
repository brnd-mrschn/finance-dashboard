/**
 * Configuração centralizada de autenticação.
 *
 * E-mails autorizados podem ser configurados de 2 formas:
 * 1. Variável de ambiente NEXT_PUBLIC_ALLOWED_EMAILS (separados por vírgula)
 *    Use "*" para permitir qualquer email
 * 2. Array hardcoded ALLOWED_EMAILS_DEFAULT abaixo
 *
 * A variável de ambiente tem precedência.
 */

// E-mails padrão autorizados (fallback caso não haja env var)
// Use ["*"] para permitir qualquer email
const ALLOWED_EMAILS_DEFAULT = ["*"];

/**
 * Retorna a lista de e-mails autorizados.
 * Prioriza a variável de ambiente NEXT_PUBLIC_ALLOWED_EMAILS.
 * Se contém "*", permite qualquer email.
 */
export function getAllowedEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS?.trim();
  if (envEmails && envEmails.length > 0) {
    return envEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return ALLOWED_EMAILS_DEFAULT.map((email) => email.toLowerCase());
}

/**
 * Verifica se um email está autorizado.
 * Se a lista contém "*", qualquer email é permitido.
 */
export function isEmailAllowed(email: string): boolean {
  const allowed = getAllowedEmails();
  if (allowed.includes("*")) {
    return true;
  }
  return allowed.includes(email.toLowerCase());
}
