import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllTags, getAllTypes } from '../../actions'
import ProductForm from '../ProductForm'
import FaireSyncButton from '../FaireSyncButton'
import DeleteProductButton from '../DeleteProductButton'

export const metadata = { title: 'Edit Product | Admin' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createAdminClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const { data: variants } = await supabase
    .from('product_variants')
    .select('*, image_id')
    .eq('product_id', id)
    .order('created_at', { ascending: true })

  const { data: images } = await supabase
    .from('product_images')
    .select('id, url, position, alt_text, synced_to_faire, faire_image_id')
    .eq('product_id', id)
    .order('position', { ascending: true })

  const [allTags, allTypes] = await Promise.all([getAllTags(), getAllTypes()])

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <Link
          href="/admin/products"
          style={{ fontSize: '0.875rem', opacity: 0.5, textDecoration: 'none', color: 'inherit' }}
          className="hover:opacity-100"
        >
          ← Products
        </Link>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: 0,
            flex: 1,
          }}
        >
          {product.title}
        </h1>
        <Link
          href={`/products/${product.handle}`}
          target="_blank"
          style={{ fontSize: '0.8rem', opacity: 0.45, textDecoration: 'none', color: 'inherit', whiteSpace: 'nowrap' }}
          className="hover:opacity-100"
        >
          View on shop ↗
        </Link>
        <FaireSyncButton productId={product.id} linked={!!product.faire_product_id} imageCount={images?.length ?? 0} />
      </div>

      <ProductForm
        product={product}
        variants={variants ?? []}
        images={images ?? []}
        allTags={allTags}
        allTypes={allTypes}
      />

      <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
        <DeleteProductButton productId={product.id} />
      </div>
    </div>
  )
}
