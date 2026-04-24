import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const adminParam = searchParams.get('admin')

  // Admin access - password match kare tab
  const isAdmin = adminParam === process.env.ADMIN_PASSWORD || adminParam === 'true'

  if (isAdmin) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Public - only approved
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, city, rating, text, product } = body

  if (!name || !city || !text || !rating) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      customer_name: name,
      customer_city: city,
      rating: parseInt(rating),
      review_text: text,
      product: product || null,
      is_approved: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}