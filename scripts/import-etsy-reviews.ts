/**
 * Import Etsy reviews into Supabase as shop-level (no product association).
 *
 * Usage:
 *   npx tsx scripts/import-etsy-reviews.ts [path/to/reviews.json]
 *
 * Defaults to ~/Downloads/reviews.json if no path given.
 * Skips reviews with empty messages.
 * Deduplicates by reviewer + order_id + message.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as os from 'os'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

interface EtsyReview {
  reviewer: string
  date_reviewed: string // MM/DD/YYYY
  star_rating: number
  message: string
  order_id: number
}

function parseDate(dateStr: string): string {
  const [month, day, year] = dateStr.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

async function main() {
  const filePath = process.argv[2] ?? path.join(os.homedir(), 'Downloads', 'reviews.json')
  const raw: EtsyReview[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  // Deduplicate: same reviewer + order_id + message
  const seen = new Set<string>()
  const unique = raw.filter(r => {
    const key = `${r.reviewer}|${r.order_id}|${r.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Drop reviews with no message
  const withMessages = unique.filter(r => r.message.trim().length > 0)

  console.log(`Total rows in file : ${raw.length}`)
  console.log(`After dedup        : ${unique.length}`)
  console.log(`With messages      : ${withMessages.length}`)

  const rows = withMessages.map(r => ({
    product_id: null,
    customer_name: r.reviewer,
    customer_email: '',
    rating: r.star_rating,
    body: r.message,
    status: 'approved',
    review_token: crypto.randomUUID(),
    token_used: false,
    created_at: parseDate(r.date_reviewed),
  }))

  const { error } = await supabase.from('reviews').insert(rows)

  if (error) {
    console.error('Insert failed:', error.message)
    process.exit(1)
  }

  console.log(`Inserted ${rows.length} reviews ✓`)
}

main()
