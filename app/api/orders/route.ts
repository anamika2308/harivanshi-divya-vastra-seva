import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function generateOrderNumber() {
  const prefix = 'HPS'
  const date = new Date().toISOString().slice(2,10).replace(/-/g,'')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `${prefix}${date}${rand}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const admin = searchParams.get('admin')

  if (admin === process.env.ADMIN_PASSWORD) {
    const { data, error } = await supabaseAdmin
      .from('orders').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('order_number, customer_name, product, size, quantity, total_amount, status, payment_status, tracking_number, created_at, city, pincode')
      .ilike('customer_phone', `%${cleanPhone}`)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, product, size, quantity = 1, address, city, pincode, note, totalAmount, price, paymentId, razorpayOrderId, paymentStatus = 'pending' } = body

    if (!name || !phone || !product || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const orderNumber = generateOrderNumber()
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        product, size,
        quantity: parseInt(quantity),
        price: parseFloat(price) || 0,
        total_amount: parseFloat(totalAmount) || 0,
        delivery_address: address,
        city: city || null,
        pincode: pincode || null,
        special_note: note || null,
        status: 'pending',
        payment_status: paymentStatus,
        payment_id: paymentId || null,
        razorpay_order_id: razorpayOrderId || null,
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}