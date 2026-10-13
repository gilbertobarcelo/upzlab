import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ appKey: string; platform: string }> },
) {
  const { appKey, platform } = await params;
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return Response.json({ detail: "Autenticação UpzLab obrigatória." }, { status: 401 });
  }
  if (platform !== "android" && platform !== "typescript") {
    return Response.json({ detail: "Plataforma de SDK inválida." }, { status: 400 });
  }

  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
  const apiBase = apiOrigin.endsWith("/api/upzlab") ? apiOrigin : `${apiOrigin}/api/upzlab`;
  let configuration: Response;
  try {
    configuration = await fetch(
      `${apiBase}/sdk/apps/${encodeURIComponent(appKey)}/configuration`,
      { headers: { Authorization: authorization }, cache: "no-store" },
    );
  } catch (error) {
    console.error("Não foi possível validar a configuração do SDK no backend.", error);
    return Response.json({ detail: "Não foi possível validar o app no momento." }, { status: 502 });
  }
  if (!configuration.ok) {
    const body = await configuration.text();
    return new Response(body, {
      status: configuration.status,
      headers: { "Content-Type": configuration.headers.get("Content-Type") || "application/json" },
    });
  }

  const sourcePath = platform === "android"
    ? "src/lib/upzlab-sdk.android.kt"
    : "src/lib/upzlab-sdk.ts";

  try {
    const source = await readFile(resolve(process.cwd(), sourcePath), "utf8");
    const filename = platform === "android" ? "UpzLabSdk.kt" : "upzlab-sdk.ts";
    return new Response(source, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Não foi possível preparar o SDK autorizado para o app.", error);
    return Response.json({ error: "O arquivo do SDK está indisponível neste momento." }, { status: 500 });
  }
}
