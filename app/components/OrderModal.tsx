'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { Product } from '@/types'
import { Customer } from '@/lib/auth'

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProduct?: string
  products: Product[]
  customer: Customer | null
  onLoginRequired: () => void
}

declare global { interface Window { Razorpay: any } }

export default function OrderModal({ isOpen, onClose, selectedProduct, products, customer, onLoginRequired }: OrderModalProps) {
  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    product: selectedProduct || '',
    size: '8 inch', quantity: 1,
    address: '', city: '', pincode: '', note: '',
  })
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod'>('cod')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-fill from logged in customer — but phone stays editable for recipient
  useEffect(() => {
    if (customer && isOpen) {
      setForm(f => ({
        ...f,
        name: customer.name || f.name,
        // Phone NOT auto-filled — customer may order for someone else
        email: customer.email || f.email,
        address: customer.address || f.address,
        city: customer.city || f.city,
        pincode: customer.pincode || f.pincode,
      }))
    }
  }, [customer, isOpen])

  useEffect(() => {
    if (selectedProduct) setForm(f => ({ ...f, product: selectedProduct }))
  }, [selectedProduct])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Load Razorpay script
      if (!document.querySelector('script[src*="razorpay"]')) {
        const s = document.createElement('script')
        s.src = 'https://checkout.razorpay.com/v1/checkout.js'
        document.head.appendChild(s)
      }
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const selectedProductData = products.find(p => p.name === form.product)
  const totalAmount = selectedProductData ? selectedProductData.price * form.quantity : 0

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Valid 10-digit phone required'
    if (!form.product) errs.product = 'Please select a product'
    if (!form.address.trim()) errs.address = 'Delivery address is required'
    if (!form.city.trim()) errs.city = 'City is required'
    if (!form.pincode.trim() || form.pincode.length < 6) errs.pincode = 'Valid 6-digit pincode required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveOrder = async (paymentStatus: string, paymentId?: string, razorpayOrderId?: string) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        totalAmount,
        price: selectedProductData?.price,
        paymentStatus,
        paymentId: paymentId || null,
        razorpayOrderId: razorpayOrderId || null,
      }),
    })
    return res.json()
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    try {
      // Save/update customer details using the FORM phone (recipient's phone)
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: form.phone,
          name: form.name,
          email: form.email,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          action: 'save'
        })
      })

      if (paymentMethod === 'upi') {
        // Create Razorpay order
        const res = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount }),
        })
        const rzpOrder = await res.json()

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: 'INR',
          name: 'Harivanshi Poshak Seva',
          description: form.product,
          order_id: rzpOrder.id,
          prefill: {
            name: form.name,
            contact: form.phone,
            email: form.email || '',
          },
          theme: { color: '#E8650A' },
          // This enables ALL payment methods - UPI, PhonePe, GPay, Paytm, Cards, Net Banking
          config: {
            display: {
              blocks: {
                utib: { name: 'Pay via UPI', instruments: [{ method: 'upi' }] },
                other: { name: 'Other Methods', instruments: [{ method: 'card' }, { method: 'netbanking' }, { method: 'wallet' }] }
              },
              sequence: ['block.utib', 'block.other'],
              preferences: { show_default_blocks: true }
            }
          },
          handler: async (response: any) => {
            const data = await saveOrder('paid', response.razorpay_payment_id, rzpOrder.id)
            setOrderNumber(data.order_number || 'HPS' + Date.now())
            setStep('success')
            setLoading(false)
          },
          modal: { ondismiss: () => setLoading(false) }
        }
        new window.Razorpay(options).open()
      } else {
        // COD
        const data = await saveOrder('pending')
        setOrderNumber(data.order_number || 'HPS' + Date.now())
        setStep('success')
        setLoading(false)
      }
    } catch (err) {
      alert('Something went wrong. Please WhatsApp us.')
      setLoading(false)
    }
  }

  const sendWhatsApp = () => {
    const msg = `🙏 Jai Radhe Krishna!\n\n*Order #${orderNumber}*\n*Product:* ${form.product}\n*Size:* ${form.size} | *Qty:* ${form.quantity}\n*Name:* ${form.name}\n*Phone:* ${form.phone}\n*Address:* ${form.address}, ${form.city} - ${form.pincode}\n*Note:* ${form.note || 'None'}\n*Total:* ₹${totalAmount}\n*Payment:* ${paymentMethod === 'upi' ? '✅ Paid Online' : 'Cash on Delivery'}`
    window.open(`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '917879412639'}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const handleClose = () => {
    setStep('form')
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>🪷 Place Order</h3>
            {customer
              ? <p className="text-xs mt-0.5 font-semibold text-green-600">✓ Logged in as {customer.name} — address auto-filled!</p>
              : <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Fill in your details below</p>
            }
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
            <X size={20} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        {step === 'success' ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-3">🪷</div>
            <CheckCircle className="mx-auto mb-3 text-green-500" size={48} />
            <h4 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>Jai Radhe Krishna!</h4>
            <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Order <strong style={{ color: 'var(--saffron)' }}>#{orderNumber}</strong> placed successfully!</p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>We'll confirm on WhatsApp within 2-4 hours.</p>
            <div className="flex flex-col gap-3">
              <button onClick={sendWhatsApp} className="w-full text-white font-bold py-3 rounded-xl" style={{ background: '#25D366' }}>
                💬 Confirm on WhatsApp
              </button>
              <a href="/orders" className="w-full text-center font-bold py-3 rounded-xl block" style={{ background: 'var(--cream)', color: 'var(--deep)', border: '1.5px solid var(--border)' }}>
                📦 Track My Order
              </a>
              <button onClick={handleClose} className="text-sm" style={{ color: 'var(--muted)' }}>Close</button>
            </div>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">

            {/* Login prompt if not logged in */}
            {!customer && (
              <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: '#FFF3E8', border: '1.5px solid var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--deep)' }}>💡 Login to auto-fill your address!</p>
                <button onClick={() => { handleClose(); onLoginRequired() }}
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ background: 'var(--saffron)' }}>Login</button>
              </div>
            )}

            {/* Recipient Info */}
            <div className="p-3 rounded-xl" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--deep)' }}>📦 Delivery Details</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Enter the phone number where we should contact for this delivery</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Recipient Name *</label>
                <input type="text" placeholder="Name" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: errors.name ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>
                  Delivery Phone * <span className="font-normal text-xs" style={{ color: 'var(--muted)' }}>(for this order)</span>
                </label>
                <input type="tel" placeholder="10 digit number" value={form.phone} maxLength={10}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: errors.phone ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Product */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Product *</label>
                <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: errors.product ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }}>
                  <option value="">Select...</option>
                  {products.map(p => <option key={p.id} value={p.name}>{p.name} — ₹{p.price}</option>)}
                </select>
                {errors.product && <p className="text-xs text-red-500 mt-1">{errors.product}</p>}
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Size</label>
                <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                  {(selectedProductData?.sizes || ['6 inch', '8 inch', '10 inch', '12 inch', '18 inch']).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Quantity</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm({ ...form, quantity: Math.max(1, form.quantity - 1) })}
                  className="w-9 h-9 rounded-full font-bold text-lg border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--border)', color: 'var(--deep)' }}>−</button>
                <span className="font-bold text-xl w-8 text-center" style={{ color: 'var(--deep)' }}>{form.quantity}</span>
                <button onClick={() => setForm({ ...form, quantity: form.quantity + 1 })}
                  className="w-9 h-9 rounded-full font-bold text-lg text-white flex items-center justify-center"
                  style={{ background: 'var(--saffron)' }}>+</button>
                {totalAmount > 0 && <span className="ml-2 font-bold text-base" style={{ color: 'var(--saffron)' }}>= ₹{totalAmount}</span>}
              </div>
            </div>

            {/* Address - pre-filled from login */}
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Delivery Address *</label>
              <textarea placeholder="House no, street, area, landmark" value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400 resize-none"
                style={{ borderColor: errors.address ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }} />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>City *</label>
                <input type="text" placeholder="Bhopal" value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: errors.city ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }} />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Pincode *</label>
                <input type="text" placeholder="462001" value={form.pincode} maxLength={6}
                  onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: errors.pincode ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }} />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Special Request (Optional)</label>
              <input type="text" placeholder="Color, design preference, special note..." value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-bold block mb-2" style={{ color: 'var(--deep)' }}>Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('upi')}
                  className="flex flex-col items-center p-3 rounded-xl border-2 transition-all"
                  style={{ borderColor: paymentMethod === 'upi' ? 'var(--saffron)' : 'var(--border)', background: paymentMethod === 'upi' ? '#FFF3E8' : 'var(--cream)' }}>
                  <div className="flex gap-1 text-xl mb-1">💳</div>
                  <span className="text-xs font-bold" style={{ color: 'var(--deep)' }}>Pay Online</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>UPI · GPay · PhonePe · Card</span>
                </button>
                <button onClick={() => setPaymentMethod('cod')}
                  className="flex flex-col items-center p-3 rounded-xl border-2 transition-all"
                  style={{ borderColor: paymentMethod === 'cod' ? 'var(--saffron)' : 'var(--border)', background: paymentMethod === 'cod' ? '#FFF3E8' : 'var(--cream)' }}>
                  <div className="text-xl mb-1">💵</div>
                  <span className="text-xs font-bold" style={{ color: 'var(--deep)' }}>Cash on Delivery</span>
                  <span className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Pay when delivered</span>
                </button>
              </div>
            </div>

            {/* Total */}
            {totalAmount > 0 && (
              <div className="p-4 rounded-xl flex justify-between items-center" style={{ background: '#FFF3E8', border: '1.5px solid var(--border)' }}>
                <div>
                  <span className="text-sm font-semibold block" style={{ color: 'var(--muted)' }}>Total Amount</span>
                  {paymentMethod === 'cod' && <span className="text-xs" style={{ color: 'var(--muted)' }}>Pay on delivery</span>}
                  {paymentMethod === 'upi' && <span className="text-xs text-green-600">Secure online payment</span>}
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>₹{totalAmount}</span>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-70 text-base"
              style={{ background: loading ? 'var(--muted)' : 'var(--saffron)' }}>
              {loading
                ? <><Loader2 size={18} className="spinner" /> Processing...</>
                : paymentMethod === 'upi'
                  ? '💳 Pay ₹' + totalAmount + ' & Place Order'
                  : '🛍️ Place Order (COD)'
              }
            </button>
            <p className="text-center text-xs" style={{ color: 'var(--muted)' }}>🔒 Safe & Secure · Delivery in 2–7 days</p>
          </div>
        )}
      </div>
    </div>
  )
}
