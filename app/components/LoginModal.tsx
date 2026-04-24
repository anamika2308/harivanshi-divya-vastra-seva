'use client'
import { useState } from 'react'
import { X, Phone, User, MapPin, Loader2, CheckCircle } from 'lucide-react'
import { setSession, Customer } from '@/lib/auth'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: Customer) => void
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [step, setStep] = useState<'phone' | 'details'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', address: '', city: '', pincode: '' })
  const [error, setError] = useState('')

  const handlePhoneSubmit = async () => {
    if (phone.replace(/\D/g,'').length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'lookup' })
      })
      const data = await res.json()
      if (data.found) {
        // Existing customer - auto login
        const customer = data.customer as Customer
        setSession(customer)
        onSuccess(customer)
        handleClose()
      } else {
        // New customer - collect details
        setIsNew(true)
        setStep('details')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const handleDetailsSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ...form, action: 'save' })
      })
      const data = await res.json()
      if (data.success) {
        setSession(data.customer)
        onSuccess(data.customer)
        handleClose()
      }
    } catch {
      setError('Something went wrong.')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setStep('phone')
    setPhone('')
    setForm({ name: '', email: '', address: '', city: '', pincode: '' })
    setError('')
    setIsNew(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>
              {step === 'phone' ? '🪷 Login / Sign Up' : isNew ? '✨ Create Account' : '👋 Welcome Back!'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {step === 'phone' ? 'Enter your WhatsApp number to continue' : 'Fill in your details once — saved forever!'}
            </p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
            <X size={18} style={{ color: 'var(--muted)' }} />
          </button>
        </div>

        <div className="p-5">
          {step === 'phone' ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm font-semibold" style={{ color: 'var(--deep)' }}>No password needed!</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Just enter your WhatsApp number. Your details will be saved for faster ordering next time.</p>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: 'var(--deep)' }}>WhatsApp Number</label>
                <div className="flex gap-2 items-center border-2 rounded-xl px-4 py-2.5 focus-within:border-amber-400" style={{ borderColor: 'var(--border)', background: 'var(--cream)' }}>
                  <Phone size={16} style={{ color: 'var(--muted)' }} />
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                    className="flex-1 outline-none bg-transparent text-sm"
                    style={{ color: 'var(--deep)' }}
                    autoFocus
                  />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handlePhoneSubmit} disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                style={{ background: loading ? 'var(--muted)' : 'var(--saffron)' }}>
                {loading ? <><Loader2 size={18} className="spinner" /> Checking...</> : 'Continue →'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {isNew && (
                <div className="p-3 rounded-xl text-sm" style={{ background: '#D1FAE5', color: '#065F46' }}>
                  ✨ New here! Fill in your details once — we'll save them for next time.
                </div>
              )}
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Full Name *</label>
                <input type="text" placeholder="Your name" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} autoFocus />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Email (Optional)</label>
                <input type="email" placeholder="email@gmail.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Delivery Address (Optional)</label>
                <textarea placeholder="House no, street, area, landmark" value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})} rows={2}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400 resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>City</label>
                  <input type="text" placeholder="Bhopal" value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                    style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Pincode</label>
                  <input type="text" placeholder="462001" value={form.pincode} maxLength={6}
                    onChange={e => setForm({...form, pincode: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400"
                    style={{ borderColor: 'var(--border)', background: 'var(--cream)' }} />
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleDetailsSubmit} disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
                style={{ background: loading ? 'var(--muted)' : 'var(--saffron)' }}>
                {loading ? <><Loader2 size={18} className="spinner" /> Saving...</> : 'Save & Continue →'}
              </button>
              <button onClick={() => { setStep('phone'); setIsNew(false) }} className="text-xs text-center" style={{ color: 'var(--muted)' }}>
                ← Change number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
