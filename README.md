This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3003](http://localhost:3003) with your browser to see the result.

> **Porta:** este frontend roda na **3003** (a 3000 pertence a outro projeto —
> egolpe_web). Para subir frontend + backend juntos use `./start_all.sh`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Agendamento de posts (SEO engine → Postiz)

O SEO engine envia `POST /api/social/schedule` com o header `x-webhook-secret` e o corpo
`{ "content": "...", "scheduled_at": "2026-11-01T14:00:00Z", "integration_ids": ["opcional"] }`.
O post é criado como **agendado** no [Postiz](https://postiz.com) (Public API).

Variáveis de ambiente: `POSTIZ_API_KEY`, `POSTIZ_API_URL` (padrão `https://api.postiz.com/public/v1`; use `https://SEU_HOST/api/public/v1` se self-hosted),
`POSTIZ_INTEGRATION_IDS` (canais padrão, separados por vírgula) e `SEO_ENGINE_WEBHOOK_SECRET`.
