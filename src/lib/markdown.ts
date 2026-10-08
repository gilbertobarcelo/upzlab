/**
 * Escapa HTML de conteúdo vindo do usuário antes de renderizar com
 * `dangerouslySetInnerHTML` (previne XSS via markdown/manipulação manual).
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
