"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useComunidade } from "../../../ComunidadeContext";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useComunidade();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=github_token_missing");
      return;
    }
    login(token);
    router.replace(searchParams.get("action") === "complete_profile" ? "/completar-perfil" : "/comunidade");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] items-center justify-center text-sm text-white/60">
      Entrando com GitHub...
    </main>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
