# LedgerLens Web

The Vercel-ready LedgerLens dashboard. It is a Next.js App Router application with a browser upload flow and a server-side reconciliation endpoint.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current workflow

1. Open **New reconciliation**.
2. Upload a bank CSV and ledger CSV, or run the demo without files.
3. The `/api/reconciliation` Route Handler parses both files.
4. LedgerLens matches transaction IDs, detects amount mismatches and missing records, and returns a prioritized issue queue.
5. Click any issue to open the investigation drawer.

Expected CSV fields include `transaction_id` (or `id`/`txn_id`), `amount`, `transaction_date`, and `currency`.

## Vercel deployment

Import the GitHub repository into Vercel and set **Root Directory** to `web`. The project has no required environment variables for the demo mode. The next production slice will replace the in-memory response with a hosted Exasol connection and add the required server-only variables in Vercel.

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
