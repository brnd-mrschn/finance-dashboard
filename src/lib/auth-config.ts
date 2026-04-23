/**
 * Configuração centralizada de autenticação.
 *
 * E-mails autorizados podem ser configurados de 2 formas:
 * 1. Variável de ambiente NEXT_PUBLIC_ALLOWED_EMAILS (separados por vírgula)
 * 2. Array hardcoded ALLOWED_EMAILS_DEFAULT abaixo
 *
 * A variável de ambiente tem precedência.
 */

// E-mails padrão autorizados (fallback caso não haja env var)
const ALLOWED_EMAILS_DEFAULT = [
  "monef4xgames@gmail.com",
];

/**
 * Retorna a lista de e-mails autorizados.
 * Prioriza a variável de ambiente NEXT_PUBLIC_ALLOWED_EMAILS.
 */
export function getAllowedEmails(): string[] {
  const envEmails = process.env.NEXT_PUBLIC_ALLOWED_EMAILS;
  if (envEmails && envEmails.trim().length > 0) {
    return envEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }
  return ALLOWED_EMAILS_DEFAULT.map((email) => email.toLowerCase());
}

/**
 * Verifica se um e-mail está autorizado.
 */
export function isEmailAllowed(email: string): boolean {
  return getAllowedEmails().includes(email.toLowerCase());
}
