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
- [x] Order status tracking (customer-facing, shows fulfillment status + tracking number)

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
- [x] Order confirmation email (triggered by Stripe webhook on successful payment)
- [x] Shipping notification email (triggered when admin marks order as fulfilled)

## Phase 6: Admin Panel ✅ (mostly — see notes)
- [x] Protected admin routes (ADMIN_EMAIL env var + middleware)
- [x] Order dashboard — view all orders, update status, add tracking numbers
- [x] Product list — view all products, toggle published/unpublished
- [x] Product editor — edit title, description, tags, SEO, variants
- [x] Add new product
- [x] Inventory management (bulk-edit stock quantities per variant)
- [x] Image upload to Supabase Storage (currently URL-based only)
- [x] Discount code management (Stripe Promotion Codes, first-time customer support)
- [x] Basic analytics (revenue, orders over time, top products)
- [x] Customer list
- **Note:** Set `ADMIN_EMAIL` in `.env.local` to your email to unlock the admin panel

## Phase 7: SEO ✅
- [x] JSON-LD Product schema (price, availability, brand — enables rich snippets in Google)
- [x] Open Graph + Twitter card tags on product pages (images in social/Pinterest previews)
- [x] Sitemap at `/sitemap.xml` (all 128 published products + shop + home)
- [x] `metadataBase` set in root layout for correct canonical URL resolution

## Phase 8: Storefront Polish ✅
- [x] Sticker product videos migrated from Shopify CDN — downloaded, compressed (~70% smaller), uploaded to Supabase Storage
- [x] Product gallery supports video as first media item (autoplay, muted, loop) with thumbnail strip
- [x] Mini Prints & Postcards separated from Prints across nav, shop filters, and homepage section
- [x] Homepage collection cards fixed (tag case mismatch — California, Food, Pets were broken)
- [x] Admin order rows fully clickable (padding moved onto Link elements, all 6 cells covered)
- [x] Admin order detail loading skeleton (instant feedback instead of blank wait)

## Pre-Launch Checklist
- [x] Admin panel functional for order management
- [x] Transactional emails built (confirmation + shipping) — verify end-to-end in production
- [x] Sitemap generation
- [x] Privacy policy + Terms of Service pages
- [x] SEO: product URLs match Shopify (`/products/{handle}`) — no redirects needed
- [x] Mobile responsiveness audit (product grid 2-col on phones, touch targets, nav menu polish)
- [ ] Test a real order end-to-end in production (place order → confirmation email → fulfill → shipping email)
- [ ] Verify Stripe webhooks firing in production (Stripe dashboard → Webhooks)

## Post-Launch Checklist
- [ ] Submit sitemap in Google Search Console (`https://rocketboogie.com/sitemap.xml`)
- [ ] Add rocketboogie.com as a property in Google Search Console
- [ ] Set up Google Analytics or Plausible for traffic tracking
- [ ] Check all product images and videos load correctly (Supabase Storage)
- [ ] Cancel Shopify subscription once confirmed working

## Phase 9: Integrations
- [ ] Faire Retailer Partner API — replace Shopify integration, sync orders
- [ ] Printify — lightweight webhook for existing order fulfillment (low priority)
