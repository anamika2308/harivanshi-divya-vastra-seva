import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET - phone se customer details fetch karo
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')

  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const cleanPhone = phone.replace(/\D/g, '').slice(-10)

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('name, email, address, city, pincode, order_count')
    .ilike('phone', `%${cleanPhone}`)
    .single()

  if (error || !data) return NextResponse.json({ found: false })

  return NextResponse.json({ found: true, ...data })
}

// POST - customer details save/update karo
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { phone, name, email, address, city, pincode } = body

  if (!phone || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const cleanPhone = phone.replace(/\D/g, '').slice(-10)

  const { data, error } = await supabaseAdmin
    .from('customers')
    .upsert({
      phone: cleanPhone,
      name,
      email: email || null,
      address: address || null,
      city: city || null,
      pincode: pincode || null,
      last_ordered_at: new Date().toISOString(),
    }, { onConflict: 'phone' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}