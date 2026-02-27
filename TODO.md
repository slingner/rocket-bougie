# Rocket Boogie — Project TODO

## Phase 0: Setup ✅
- [x] Initialize Next.js 14 project (App Router, TypeScript, Tailwind)
- [x] Connect Supabase project
- [x] Connect Stripe account
- [x] Set up Vercel deployment
- [x] Configure environment variables

## Phase 1: Data Migration ✅
- [x] Design Supabase DB schema (products, variants, orders, customers, etc.)
- [x] Write seed script to import Shopify data into Supabase
- [x] 128 products imported (stickers, prints, cards, mini prints — Printify skipped)
- [ ] Upload product images to Supabase Storage (currently serving from Shopify CDN — fine for now)

## Phase 2: Core Store
- [x] Product listing page with collection/category filtering
- [x] Product detail page with variant selector (size, color, etc.)
- [x] Cart (React Context + localStorage)
- [x] Stripe Checkout integration
- [x] Order confirmation page
- [ ] Transactional emails via Resend (order confirmation, shipping)

## Phase 3: Customer Accounts
- [ ] Register / Login via Supabase Auth
- [ ] Order history page
- [ ] Order status tracking (tied to Stripe webhooks + admin updates)
- [ ] Address book

## Phase 4: Admin Panel
- [ ] Protected admin routes
- [ ] Product CRUD (add, edit, delete)
- [ ] Variant matrix editor (size × color × etc.)
- [ ] Image upload and management
- [ ] Order dashboard (view, update status, add tracking numbers)
- [ ] Customer list
- [ ] Inventory management
- [ ] Basic sales analytics

## Phase 5: Integrations
- [ ] Faire API — product sync and wholesale order management
- [ ] Printify — lightweight webhook integration for existing order fulfillment (low priority)

## Ongoing
- [ ] SEO: match Shopify URLs or set up redirects
- [ ] Sitemap generation
- [ ] Mobile responsiveness audit
- [ ] Performance optimization
