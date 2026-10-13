const POSTIZ_API_URL = (process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1").replace(/\/+$/, "");

export type SchedulePostInput = {
  content: string;
  // ISO 8601 (UTC). Data futura obrigatória.
  scheduledAt: string;
  // IDs de integrações (canais) do Postiz; padrão: POSTIZ_INTEGRATION_IDS.
  integrationIds?: string[];
  images?: { id: string; path: string }[];
  // Configurações por provider, ex.: { x: { who_can_reply_post: "everyone" } }
  settings?: Record<string, Record<string, unknown>>;
};

export function getDefaultIntegrationIds(): string[] {
  return (process.env.POSTIZ_INTEGRATION_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function listIntegrations(): Promise<unknown> {
  const res = await postiz("/integrations", { method: "GET" });
  return res.json();
}

async function postiz(path: string, init: RequestInit) {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY não configurada");
  const res = await fetch(`${POSTIZ_API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: key, ...init.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Postiz ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  return res;
}

/** Cria um post AGENDADO (type=schedule) em cada canal informado. */
export async function schedulePost(input: SchedulePostInput): Promise<unknown> {
  const ids = input.integrationIds?.length ? input.integrationIds : getDefaultIntegrationIds();
  if (!ids.length) throw new Error("Nenhum canal Postiz configurado");

  const body = {
    type: "schedule",
    date: new Date(input.scheduledAt).toISOString(),
    shortLink: false,
    tags: [],
    posts: ids.map((id) => ({
      integration: { id },
      value: [{ content: input.content, image: input.images ?? [] }],
      settings: input.settings?.[id] ?? { __type: "x" },
    })),
  };
  const res = await postiz("/posts", { method: "POST", body: JSON.stringify(body) });
  return res.json();
}
