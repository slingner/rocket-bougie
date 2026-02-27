import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Supabase redirects here after a user clicks the email confirmation link.
// We exchange the code for a session, create the customer profile, then
// redirect to the account page.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { id, email } = data.user

      // Ensure there's a row in the customers table for this user
      await supabase.from('customers').upsert(
        { id, email: email! },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      // Link any orders placed with this email (as a guest) to this account
      await supabase
        .from('orders')
        .update({ customer_id: id })
        .eq('email', email!)
        .is('customer_id', null)

      return NextResponse.redirect(`${origin}/account`)
    }
  }

  return NextResponse.redirect(`${origin}/account/login?error=confirmation_failed`)
}
