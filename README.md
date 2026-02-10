# ContractAI

AI-powered contract analysis app built with Next.js.  
Upload a PDF contract and get a plain-English summary, obligations, risks, and deadlines.

## Features

- Email/password auth (signup, login, logout, session cookie)
- Protected contract analysis endpoint
- PDF parsing + AI analysis
- Deadline extraction + calendar export (`.ics`)
- Free vs Pro gating
- Stripe checkout + webhook-based subscription updates

## Tech Stack

- Next.js (App Router, TypeScript)
- OpenAI API
- Vercel Postgres (`@vercel/postgres`)
- Stripe Checkout + Webhooks
- Tailwind CSS

## Plans

- Free: limited daily analyses
- Pro: active/trialing subscription unlocks higher usage

## Local Setup

1. Clone and install dependencies
2. Create `.env.local`
3. Run the app

```bash
npm install
npm run dev
