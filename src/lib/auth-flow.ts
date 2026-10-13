const DEFAULT_AUTH_DESTINATION = "/comunidade";

export function safeAuthDestination(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  return value;
}

export function requestedAuthDestination(search: string): string {
  return safeAuthDestination(new URLSearchParams(search).get("next"));
}
