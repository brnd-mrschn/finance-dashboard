/**
 * Configuração centralizada de autenticação.
 *
 * E-mails autorizados são configurados via variável de ambiente:
 *   NEXT_PUBLIC_ALLOWED_EMAILS=email1@gmail.com,email2@gmail.com
 *
 * Use "*" para permitir qualquer email (não recomendado em produção).
 */

// Fallback hardcoded — substitua pelos e-mails reais ou use a env var
const ALLOWED_EMAILS_DEFAULT: string[] = [];

/**
 * Retorna a lista de e-mails autorizados.
 * Prioriza a variável de ambiente NEXT_PUBLIC_ALLOWED_EMAILS.
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
