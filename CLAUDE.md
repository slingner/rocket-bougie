# MOST IMPORTANT RULE
**Never make assumptions.** Only state things you know to be true. If you are not certain, say "I don't know" or suggest looking it up. Never guess and present it as fact.

# AI Assistant Guidelines

## Project Overview
**Project:** Rocket Boogie — Shopify to Next.js migration
**Site:** rocketboogie.com
**Goal:** Full-featured e-commerce site replacing Shopify, eliminating the monthly fee

## Stack
| Layer | Tech | Notes |
|---|---|---|
| Frontend + API | Next.js 14 (App Router) | SSR, API routes, one codebase |
| Database | Supabase (Postgres) | Auth + DB + file storage |
| Auth | Supabase Auth | Built-in sessions |
| Payments | Stripe | Webhooks, no monthly fee |
| Images | Supabase Storage | Replaces Shopify CDN |
| Email | Resend | Order confirmations, receipts |
| Deployment | Vercel | Native Next.js hosting |

## Key Features to Build
- Product catalog with collections, variants (size × color × etc.)
- Cart + Stripe Checkout
- Customer accounts with order history and status tracking
- Admin panel: product CRUD, order management, inventory, analytics
- Faire API integration (wholesale orders)
- Printify integration (phase out eventually — low priority)

## Workflow
1. **Explain First:** Describe what we're building before writing code
2. **Execute:** Write clean, well-documented code
3. **Commit Regularly:** Clear commit messages, push after each feature
4. **Keep It Simple:** Follow requirements, don't over-engineer

## Git Practices
- Commit after every logical change
- Write clear, natural language commit messages
- Push immediately after committing
- Keep commits focused and atomic

### Commit Message Style
- Use natural, readable language
- Avoid jargon: "orchestrating", "leveraging", "implementing robust"
- Use plain English: "Add transform logic", "Create display page"
- Example: "Add product variant selector to detail page"
- **No Claude attribution** — do not add Co-Authored-By or any AI attribution to commits

## Communication Style
- Plain English, not jargon
- Explain TypeScript concepts clearly when they come up
- Ask clarifying questions when requirements are ambiguous

## Critical Rules
1. **Keep it simple** — no over-engineering, extract components when appropriate
2. **Update TODO.md** after completing tasks
3. **No backwards-compat hacks** — if something is unused, delete it
4. **Validate at boundaries only** — user input, external APIs; trust internal code

## Project Structure
```
rocket-bougie/
├── app/                    # Next.js App Router pages
│   ├── (store)/            # Public storefront
│   ├── (account)/          # Customer account pages
│   └── admin/              # Admin panel (protected)
├── components/             # Shared UI components
├── lib/                    # Utilities, Supabase client, Stripe helpers
├── scripts/                # Migration scripts (Shopify export, etc.)
└── supabase/               # DB migrations and schema
```
*(Fill in as the project grows)*

## Migration Notes
- Shopify export: products, variants, images, customers, orders via Admin API
- Image migration: bulk-download from Shopify CDN URLs, re-upload to Supabase Storage
- Faire: has a Retailer Partner API — worth connecting once core store is built
- Printify: has API, but phasing out — skip unless needed for existing order fulfillment
- SEO: match Shopify URL structure or set up redirects to preserve rankings
