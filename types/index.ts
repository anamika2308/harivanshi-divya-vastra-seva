export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  product: string
  size: string
  quantity: number
  price: number
  total_amount: number
  delivery_address: string
  city?: string
  pincode?: string
  special_note?: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  payment_id?: string
  razorpay_order_id?: string
  tracking_number?: string
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  customer_name: string
  customer_city: string
  rating: number
  review_text: string
  product?: string
  order_id?: string
  is_approved: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  category: string
  price: number
  original_price?: number
  sizes: string[]
  colors: string[]
  emoji: string
  bg_gradient: string
  badge?: string
  is_active: boolean
  stock_count: number
  // Images array - first image is main/cover, rest are gallery
  images: string[]
  created_at: string
}
