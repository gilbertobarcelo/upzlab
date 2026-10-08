import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// URL base do backend Python (porta real: 8001 — a antiga 8082 nunca existiu,
// o que deixava o gate de rotas permanentemente desligado/fail-open).
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';

// Next.js 16: a convenção `middleware` foi renomeada para `proxy` (mesma
// funcionalidade, runtime nodejs). Ver node_modules/next/dist/docs/.../proxy.md
export async function proxy(request: NextRequest) {
  // Ler o token do cookie da comunidade
  const token = request.cookies.get('upzlab_dev_jwt')?.value;

  // Permite acesso irrestrito às rotas internas da API Next, assets estáticos (imagens, CSS, etc.)
  if (
    request.nextUrl.pathname.startsWith('/api') || 
    request.nextUrl.pathname.startsWith('/_next') || 
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --------------------------------------------------------------------------
  // 🔥 MÁGICA DO SERVER-DRIVEN UI (ARQUITETURA DE MICROSERVIÇOS) 🔥
  // --------------------------------------------------------------------------
  // Em vez de hardcodar "se a tela é login ou cadastro" no React, nós delegamos 
  // essa responsabilidade para o chefão (o Python).
  // O React só pergunta: "Ei Python, o cara com esse token pode abrir essa URL?"
  
  try {
    const res = await fetch(`${API_BASE}/api/dev/auth/verify-route`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : ""
      },
      body: JSON.stringify({ path: request.nextUrl.pathname })
    });

    if (res.ok) {
      const data = await res.json();
      
      // Se o Python mandar um redirecionamento na lata, nós obedecemos cegamente.
      // A lógica de negócio (ex: forçar a preencher o perfil) fica 100% lá.
      if (data.redirect_to) {
        return NextResponse.redirect(new URL(data.redirect_to, request.url));
      }
    }
  } catch (error) {
    console.error("Falha ao comunicar com o Backend Python no Proxy:", error);
    // Fail-closed em produção: backend indisponível NÃO libera acesso.
    // Em dev, libera para não travar o fluxo durante hot-reload.
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 503 });
    }
  }

  // Se o Python disse {"allow": True} ou se passou reto, apenas carrega a página.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
