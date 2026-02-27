# Rocket Boogie — Project TODO

## Phase 0: Setup
- [ ] Initialize Next.js 14 project (App Router, TypeScript, Tailwind)
- [ ] Connect Supabase project
- [ ] Connect Stripe account
- [ ] Set up Vercel deployment
- [ ] Configure environment variables

## Phase 1: Data Migration
- [ ] Create Shopify private app with read access (products, orders, customers, inventory)
- [ ] Write Shopify API export script (products, variants, collections, images)
- [ ] Write image bulk-download script
- [ ] Design Supabase DB schema (products, variants, orders, customers, etc.)
- [ ] Write seed script to import Shopify data into Supabase
- [ ] Upload product images to Supabase Storage

## Phase 2: Core Store
- [ ] Product listing page with collection/category filtering
- [ ] Product detail page with variant selector (size, color, etc.)
- [ ] Cart (Zustand or React Context)
- [ ] Stripe Checkout integration
- [ ] Order confirmation page
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
