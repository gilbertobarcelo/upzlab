/**
 * Lê o token JWT dos cookies de sessão da comunidade.
 * O backend salva como "upzlab_dev_jwt" — mas também aceita os nomes legados.
 */
export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  for (const name of ["upzlab_dev_jwt", "auth_token"]) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

/** Headers de autenticação prontos para `fetch` (vazio quando não logado). */
export function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
