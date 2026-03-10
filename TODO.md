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
- [x] Fix: cart not clearing after checkout (ClearCart timing bug — now waits for isReady)

## Phase 3: Customer Accounts ✅
- [x] Register / Login via Supabase Auth
- [x] Google OAuth sign-in (auto-links existing email/password accounts)
- [x] Order history page
- [x] Email confirmation flow
- [x] Order status tracking (customer-facing, shows fulfillment status + tracking number)

## Phase 4: Storefront Polish ✅
- [x] Homepage with hero, collections, featured products
- [x] About page
- [x] Contact page (form → Resend → hello@rocketboogie.com, reply-to set to sender)
- [x] Nav with dropdowns (desktop + mobile)
- [x] Nav dropdown links vertically aligned with regular links
- [x] Footer
- [x] Logo image in nav
- [x] Favicon + Apple touch icon
- [x] Collection cards with real product images
- [x] Wholesale page (Faire embed)
- [x] Etsy Shop link corrected to RocketBoogieCo shop

## Phase 5: Transactional Emails ✅
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
- [x] Reviews dashboard (view, approve/reject customer reviews)
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

## Phase 9: Reviews ✅
- [x] Post-purchase review request email (sent automatically after order is fulfilled)
- [x] Customer review submission page with star rating + comment
- [x] Reviews stored in Supabase with approval workflow
- [x] Star ratings displayed on product detail pages
- [x] Admin review management (approve / reject)

## Phase 10: Accessibility ✅
- [x] Skip-to-content link (hidden until keyboard focused, fixed CSS to use transform instead of top: -100%)
- [x] Visible focus rings for keyboard users (`:focus-visible` only, suppressed for mouse)
- [x] Accessibility statement page at `/accessibility`
- [x] Nav dropdown: `aria-haspopup` + `aria-expanded` on trigger buttons
- [x] Nav dropdowns keyboard accessible (open/close on focus/blur)
 
## Pre-Launch Checklist ✅
- [x] Admin panel functional for order management
- [x] Transactional emails built (confirmation + shipping) — verified end-to-end in production
- [x] Sitemap generation
- [x] Privacy policy + Terms of Service pages
- [x] SEO: product URLs match Shopify (`/products/{handle}`) — no redirects needed
- [x] Mobile responsiveness audit (product grid 2-col on phones, touch targets, nav menu polish)
- [x] Test a real order end-to-end in production (place order → confirmation email → fulfill → shipping email)
- [x] Verify Stripe webhooks firing in production — webhook URL must use `https://www.rocketboogie.com/api/webhooks/stripe` (www is canonical)
- [x] Resend domain verified, emails sending from `orders@rocketboogie.com` and `hello@rocketboogie.com`

## Launch Notes
- Live Stripe keys active in Vercel
- `NEXT_PUBLIC_SITE_URL` set to `https://www.rocketboogie.com`
- Volume deal discounts use dynamically created Stripe coupons (negative line items rejected in live mode)
- Google OAuth configured for both `rocketboogie.com` and `www.rocketboogie.com`
- `rocketboogieco.com` redirects to `rocketboogie.com` via Vercel

## Temporary / Pending
- [ ] **Re-enable Next.js image optimization on ProductCard** — remove `unoptimized` prop once Vercel image transformation quota resets (check vercel.com/dashboard/usage). Search codebase for `TEMP:` to find it.

## Post-Launch Performance & Security
- [x] Submit sitemap in Google Search Console (`https://www.rocketboogie.com/sitemap.xml`)
- [ ] Add rocketboogie.com as a property in Google Search Console
- [x] Set up Google Analytics (GA4, G-DKDW7565RT) — tracking live in production
- [ ] Check all product images and videos load correctly (Supabase Storage)
- [ ] Add Supabase Storage CORS/referrer restrictions — allow only rocketboogie.com and Vercel preview domains to prevent hotlinking from other sites
- [ ] Cancel Shopify subscription once confirmed working
- [ ] Test fulfill an order in admin → confirm shipping email sends

## Phase 11: Faire Integration ✅ (in progress)
- [x] Create Faire draft from admin product page
- [x] Sync product name, description, images to Faire via API
- [x] Wholesale + retail price fields on variants, sent to Faire on draft creation
- [x] Bulk sync queue for unsynced images
- [x] Nightly cron job to auto-sync
- [ ] Sync Faire orders into orders dashboard


## Phase 12: Etsy Integration
- [ ] Connect Etsy API (OAuth 2.0 — Etsy v3 API)
- [ ] Create/update Etsy listings from admin product page (similar to Faire draft button)
- [ ] Sync title, description, price, images to Etsy listing
- [ ] Pull Etsy orders into orders dashboard
- [ ] Show Etsy sync status on product list (like Faire column)

## Phase 14: GA4 Admin Integration
- [ ] Set up Google Cloud service account + enable GA4 Data API
- [ ] Pull pageviews, sessions, top pages, traffic sources into admin analytics page
- [ ] Display alongside existing revenue/order stats
- **Note:** Wait until GA4 has accumulated real traffic data (give it 1–2 weeks) before building this

## Phase 13: Abandoned Cart Recovery (via Stripe) ✅
- [x] Add `after_expiration.recovery`, `consent_collection.promotions: 'auto'`, and `expires_at` (1hr) to Checkout Session
- [x] Handle `checkout.session.expired` webhook — check consent, look up cart items, send recovery email
- [x] Recovery email template — product thumbnails, item list, CTA button, optional discount code
- [x] Set `ABANDONED_CART_DISCOUNT_CODE` env var to include a promo code in recovery emails

## Phase 15: Seasonal Homepage Banners ✅
- [x] `seasonal_banners` DB table — date ranges, hero overrides, feature section fields, priority, active toggle
- [x] `getActiveBanner()` — checks today's date server-side on every homepage load, no cron needed
- [x] Dynamic hero — headline, subtext, CTA label + URL swap automatically when a banner is active
- [x] Seasonal feature section — full-width editorial split (text left, image right) between Collections and New Arrivals, only shows when banner has a headline set
- [x] 8 pre-seeded banners: Valentine's Day, Spring, Mother's Day, Summer, Halloween, Thanksgiving, Christmas, New Year
- [x] All banners pre-filled with relevant product images from the catalog
- [x] `/admin/homepage` — manage all banners, "Active now" badge on current one, inline create/edit form
- [x] Banner image picker uses product autocomplete (search → browse photos → click to select), same pattern as Collections admin
- [x] Upload from computer option on image picker (drag & drop or click to browse, uploads to `site/banners/` in Supabase Storage)
- [x] 8 matching seasonal collections created (valentines, mothers-day, spring, summer, halloween, thanksgiving, christmas, new-year) — hidden by default until populated
- [x] `hidden` field on collections — filters from storefront, nav, and shop page; toggle in admin
- [x] Banner editor shows "Manage collection →" and "Preview in store ↗" links when a collection URL is set
