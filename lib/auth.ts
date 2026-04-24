// Simple phone OTP based auth using Supabase
// We store session in sessionStorage after phone verification

export interface Customer {
  id: string
  phone: string
  name: string
  email?: string
  address?: string
  city?: string
  pincode?: string
  order_count?: number
}

export function getSession(): Customer | null {
  if (typeof window === 'undefined') return null
  try {
    const s = sessionStorage.getItem('hps_customer')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function setSession(customer: Customer) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('hps_customer', JSON.stringify(customer))
}

export function clearSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('hps_customer')
}
