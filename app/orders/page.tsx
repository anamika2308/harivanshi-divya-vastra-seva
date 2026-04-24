'use client'
import { useState, useEffect } from 'react'
import { Search, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getSession } from '@/lib/auth'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Order Received', color: '#F59E0B', bg: '#FEF3CC' },
  confirmed: { label: 'Confirmed', color: '#10B981', bg: '#D1FAE5' },
  processing: { label: 'Being Prepared', color: '#3B82F6', bg: '#DBEAFE' },
  shipped: { label: 'Shipped', color: '#8B5CF6', bg: '#EDE9FE' },
  delivered: { label: 'Delivered ✓', color: '#10B981', bg: '#D1FAE5' },
  cancelled: { label: 'Cancelled', color: '#EF4444', bg: '#FEE2E2' },
}
const steps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const stepLabels = ['Received', 'Confirmed', 'Preparing', 'Shipped', 'Delivered']

export default function OrdersPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)

  useEffect(() => {
    // Auto-fill from logged in session and fetch orders
    const session = getSession()
    if (session?.phone) {
      setPhone(session.phone)
      fetchOrders(session.phone)
      setAutoLoaded(true)
    }
  }, [])

  const fetchOrders = async (ph: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?phone=${ph}`)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch { setOrders([]) }
    setSearched(true)
    setLoading(false)
  }

  const searchOrders = () => {
    if (phone.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit phone number')
      return
    }
    fetchOrders(phone)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div style={{ background: 'var(--deep)', padding: '1.5rem' }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-white hover:text-amber-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>📦 Track Your Order</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--border)' }}>Enter your WhatsApp number to see orders</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pt-8">
        {/* Search Box */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1.5px solid var(--border)', boxShadow: '0 4px 20px rgba(200,146,10,0.08)' }}>
          {autoLoaded && (
            <div className="mb-3 text-xs font-semibold text-green-600 flex items-center gap-1.5">
              <CheckCircle size={13} /> Auto-filled from your account
            </div>
          )}
          <label className="text-sm font-bold block mb-2" style={{ color: 'var(--deep)' }}>WhatsApp Number</label>
          <div className="flex gap-3">
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              onKeyDown={e => e.key === 'Enter' && searchOrders()}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{ border: '2px solid var(--border)', background: 'var(--cream)' }}
            />
            <button onClick={searchOrders} disabled={loading}
              className="px-5 py-3 rounded-xl font-bold text-white flex items-center gap-2 hover:-translate-y-0.5 transition-all"
              style={{ background: 'var(--saffron)' }}>
              {loading ? <Loader2 size={16} className="spinner" /> : <><Search size={16} /> Search</>}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 size={32} className="spinner mx-auto mb-3" style={{ color: 'var(--saffron)' }} />
            <p style={{ color: 'var(--muted)' }}>Loading your orders...</p>
          </div>
        )}

        {/* Results */}
        {searched && !loading && (
          orders.length === 0 ? (
            <div className="text-center py-12 rounded-2xl" style={{ background: 'white', border: '1.5px solid var(--border)' }}>
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--deep)' }}>No Orders Found</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>No orders found for this number.<br />Try a different number or WhatsApp us.</p>
              <a href="https://wa.me/917879412639" target="_blank"
                className="inline-block font-bold px-6 py-2.5 rounded-full text-white text-sm" style={{ background: '#25D366' }}>
                💬 WhatsApp Us
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>{orders.length} order{orders.length > 1 ? 's' : ''} found</p>
              {orders.map((order: any, idx: number) => {
                const s = statusConfig[order.status] || statusConfig.pending
                const currentStep = steps.indexOf(order.status)
                return (
                  <div key={idx} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1.5px solid var(--border)', boxShadow: '0 4px 20px rgba(200,146,10,0.08)' }}>
                    <div className="p-4 flex items-center justify-between" style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Order # </span>
                        <span className="font-bold" style={{ color: 'var(--deep)' }}>{order.order_number}</span>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-bold" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold" style={{ color: 'var(--deep)' }}>{order.product}</h3>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Size: {order.size} · Qty: {order.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg" style={{ color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>₹{order.total_amount}</div>
                          <div className="text-xs" style={{ color: order.payment_status === 'paid' ? '#10B981' : 'var(--muted)' }}>
                            {order.payment_status === 'paid' ? '✓ Paid Online' : 'Cash on Delivery'}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      {order.status !== 'cancelled' && (
                        <div className="mb-4 px-1">
                          <div className="flex items-start justify-between relative">
                            <div className="absolute top-3 left-0 right-0 h-0.5 z-0" style={{ background: 'var(--border)' }}>
                              <div className="h-full transition-all" style={{ background: 'var(--saffron)', width: `${Math.max(0, currentStep / (steps.length - 1) * 100)}%` }} />
                            </div>
                            {steps.map((step, i) => {
                              const done = i <= currentStep
                              return (
                                <div key={step} className="flex flex-col items-center z-10">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                    style={{ background: done ? 'var(--saffron)' : 'white', color: done ? 'white' : 'var(--muted)', border: `2px solid ${done ? 'var(--saffron)' : 'var(--border)'}` }}>
                                    {done ? '✓' : i + 1}
                                  </div>
                                  <span className="mt-1 text-center" style={{ color: done ? 'var(--deep)' : 'var(--muted)', fontSize: '9px', maxWidth: 48 }}>{stepLabels[i]}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {order.tracking_number && (
                        <div className="p-3 rounded-xl text-sm mb-3" style={{ background: '#EDE9FE', color: '#5B21B6' }}>
                          🚚 Tracking: <strong>{order.tracking_number}</strong>
                        </div>
                      )}

                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Ordered on: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
