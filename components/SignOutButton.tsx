'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '100px',
        padding: '0.5rem 1.1rem',
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
        transition: 'opacity 0.15s',
      }}
      className="hover:opacity-60"
    >
      Sign out
    </button>
  )
}
