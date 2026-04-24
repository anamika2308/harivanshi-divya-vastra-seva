import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/auth - Login or Register with phone
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { phone, name, email, address, city, pincode, action } = body

  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  const cleanPhone = phone.replace(/\D/g, '').slice(-10)

  if (action === 'lookup') {
    // Check if customer exists
    const { data } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone', cleanPhone)
      .single()

    if (data) return NextResponse.json({ found: true, customer: data })
    return NextResponse.json({ found: false })
  }

  if (action === 'save') {
    // Upsert customer
    const { data, error } = await supabaseAdmin
      .from('customers')
      .upsert({
        phone: cleanPhone,
        name: name || '',
        email: email || null,
        address: address || null,
        city: city || null,
        pincode: pincode || null,
        last_ordered_at: new Date().toISOString(),
      }, { onConflict: 'phone' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, customer: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
