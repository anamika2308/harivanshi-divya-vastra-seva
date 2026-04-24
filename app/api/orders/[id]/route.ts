import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// PATCH - Update order
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()
  const { adminPassword, ...updates } = body

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('orders').update(updates).eq('id', params.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE - Delete order
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json()

  if (body.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabaseAdmin.from('orders').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}