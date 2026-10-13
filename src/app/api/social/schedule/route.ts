import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { schedulePost } from "@/lib/postiz";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.SEO_ENGINE_WEBHOOK_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("x-webhook-secret") || "");
  const want = Buffer.from(secret);
  return got.length === want.length && timingSafeEqual(got, want);
}

// O SEO engine chama este endpoint com o post pronto; ele fica agendado no Postiz.
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const content = typeof b.content === "string" ? b.content.trim() : "";
  const scheduledAt = typeof b.scheduled_at === "string" ? b.scheduled_at : "";
  const when = new Date(scheduledAt);
  if (!content || isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "content e scheduled_at (ISO, futuro) são obrigatórios" },
      { status: 400 },
    );
  }

  try {
    const result = await schedulePost({
      content,
      scheduledAt,
      integrationIds: Array.isArray(b.integration_ids)
        ? b.integration_ids.filter((x): x is string => typeof x === "string")
        : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("Falha ao agendar no Postiz:", e);
    return NextResponse.json({ error: "falha ao agendar no Postiz" }, { status: 502 });
  }
}
