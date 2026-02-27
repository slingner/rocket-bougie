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
- [x] Migrate product images from Shopify CDN to Supabase Storage

## Phase 2: Core Store ✅
- [x] Product listing page with collection/category filtering
- [x] Product detail page with variant selector (size, color, etc.)
- [x] Cart (React Context + localStorage)
- [x] Stripe Checkout integration
- [x] Order confirmation page

## Phase 3: Customer Accounts
- [x] Register / Login via Supabase Auth
- [x] Google OAuth sign-in (auto-links existing email/password accounts)
- [x] Order history page
- [x] Email confirmation flow
- [ ] Order status tracking (customer-facing, shows fulfillment status + tracking number)
- [ ] Address book

## Phase 4: Storefront Polish ✅
- [x] Homepage with hero, collections, featured products
- [x] About page
- [x] Nav with dropdowns (desktop + mobile)
- [x] Footer
- [x] Logo image in nav
- [x] Favicon + Apple touch icon
- [x] Collection cards with real product images
- [x] Wholesale page (Faire embed)

## Phase 5: Transactional Emails
- [ ] Order confirmation email (triggered by Stripe webhook on successful payment)
- [ ] Shipping notification email (triggered when admin adds tracking number)

## Phase 6: Admin Panel ✅ (mostly — see notes)
- [x] Protected admin routes (ADMIN_EMAIL env var + middleware)
- [x] Order dashboard — view all orders, update status, add tracking numbers
- [x] Product list — view all products, toggle published/unpublished
- [x] Product editor — edit title, description, tags, SEO, variants
- [x] Add new product
- [x] Inventory management (bulk-edit stock quantities per variant)
- [ ] Image upload to Supabase Storage (currently URL-based only)
- [x] Discount code management (Stripe Promotion Codes, first-time customer support)
- [ ] Basic analytics (revenue, orders over time, top products)
- [ ] Customer list
- **Note:** Set `ADMIN_EMAIL` in `.env.local` to your email to unlock the admin panel

## Pre-Launch Checklist
- [ ] Transactional emails working end-to-end
- [ ] Admin panel functional for order management
- [ ] Mobile responsiveness audit
- [ ] SEO: match Shopify URLs or set up redirects
- [ ] Sitemap generation
- [x] Privacy policy + Terms of Service pages
- [ ] Cancel Shopify (after confirmed working)

## Phase 7: Integrations
- [ ] Faire Retailer Partner API — replace Shopify integration, sync orders
- [ ] Printify — lightweight webhook for existing order fulfillment (low priority)
