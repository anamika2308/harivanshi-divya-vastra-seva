import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET all reviews for admin
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const isAdmin = searchParams.get('admin')
  
  if (isAdmin === 'true') {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }
  
  // Public: only approved
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
