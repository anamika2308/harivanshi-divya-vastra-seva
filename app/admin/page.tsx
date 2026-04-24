'use client'
import { useState, useEffect, useRef } from 'react'
import { Package, Star, TrendingUp, Clock, RefreshCw, Eye, EyeOff, CheckCircle, Shield, AlertTriangle, Plus, Pencil, Trash2, X, Save, ShoppingBag } from 'lucide-react'

type AdminTab = 'dashboard' | 'orders' | 'products' | 'reviews'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending:    { bg: '#FEF3CC', color: '#92400E' },
  confirmed:  { bg: '#D1FAE5', color: '#065F46' },
  processing: { bg: '#DBEAFE', color: '#1E40AF' },
  shipped:    { bg: '#EDE9FE', color: '#5B21B6' },
  delivered:  { bg: '#D1FAE5', color: '#065F46' },
  cancelled:  { bg: '#FEE2E2', color: '#991B1B' },
}

const BG_OPTIONS = [
  { value: 'c1', label: 'Orange', preview: 'linear-gradient(135deg,#FDE8D0,#F9C08A)' },
  { value: 'c2', label: 'Purple', preview: 'linear-gradient(135deg,#E8D5F5,#C9A8E8)' },
  { value: 'c3', label: 'Teal', preview: 'linear-gradient(135deg,#D0F0E8,#8ACFC0)' },
  { value: 'c4', label: 'Pink', preview: 'linear-gradient(135deg,#F5D0D0,#E8A0A0)' },
  { value: 'c5', label: 'Blue', preview: 'linear-gradient(135deg,#D0E8F5,#8AB8D8)' },
  { value: 'c6', label: 'Gold', preview: 'linear-gradient(135deg,#F5EBD0,#E8C87A)' },
]

const EMPTY_ORDER = {
  customer_name: '', customer_phone: '', customer_email: '',
  product: '', size: '8 inch', quantity: 1, price: 0, total_amount: 0,
  delivery_address: '', city: '', pincode: '', special_note: '',
  status: 'pending', payment_status: 'pending', tracking_number: '',
}

const EMPTY_PRODUCT = {
  name: '', description: '', category: 'radha', price: 0, original_price: 0,
  sizes: '6 inch,8 inch,10 inch,12 inch,18 inch',
  emoji: '🥻', bg_gradient: 'c1', badge: '', is_active: true,
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export default function AdminSecurePage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [savedPwd, setSavedPwd] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const timerRef = useRef<any>(null)

  // Order modal
  const [orderModal, setOrderModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<any>(null)
  const [orderForm, setOrderForm] = useState<any>(EMPTY_ORDER)
  const [orderSaving, setOrderSaving] = useState(false)

  // Product modal
  const [productModal, setProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState<any>(EMPTY_PRODUCT)
  const [productSaving, setProductSaving] = useState(false)

  // Search/filter
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_locked_until')
    const storedAttempts = sessionStorage.getItem('admin_attempts')
    if (stored) setLockedUntil(parseInt(stored))
    if (storedAttempts) setAttempts(parseInt(storedAttempts))
  }, [])

  useEffect(() => {
    if (lockedUntil) {
      timerRef.current = setInterval(() => {
        const left = Math.ceil((lockedUntil - Date.now()) / 1000)
        if (left <= 0) {
          setLockedUntil(null); setAttempts(0)
          sessionStorage.removeItem('admin_locked_until')
          sessionStorage.removeItem('admin_attempts')
          clearInterval(timerRef.current)
        } else setTimeLeft(left)
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [lockedUntil])

  const isLocked = lockedUntil && Date.now() < lockedUntil

  const login = async () => {
    if (isLocked || !password.trim()) return
    setLoading(true); setLoginError('')
    try {
      const res = await fetch(`/api/orders?admin=${encodeURIComponent(password)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setAttempts(0); setLockedUntil(null)
        sessionStorage.removeItem('admin_locked_until')
        sessionStorage.removeItem('admin_attempts')
        setOrders(data); setSavedPwd(password); setAuthed(true)
        const [rRes, pRes] = await Promise.all([
          fetch(`/api/reviews?admin=${encodeURIComponent(password)}`),
          fetch('/api/products'),
        ])
        const [rData, pData] = await Promise.all([rRes.json(), pRes.json()])
        if (Array.isArray(rData)) setReviews(rData)
        if (Array.isArray(pData)) setProducts(pData)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        sessionStorage.setItem('admin_attempts', newAttempts.toString())
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockTime = Date.now() + LOCKOUT_MINUTES * 60 * 1000
          setLockedUntil(lockTime)
          sessionStorage.setItem('admin_locked_until', lockTime.toString())
          setLoginError(`Too many attempts! Locked for ${LOCKOUT_MINUTES} minutes.`)
        } else {
          setLoginError(`Wrong password! ${MAX_ATTEMPTS - newAttempts} attempts remaining.`)
        }
        setPassword('')
      }
    } catch { setLoginError('Connection error.') }
    setLoading(false)
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const [oRes, rRes, pRes] = await Promise.all([
        fetch(`/api/orders?admin=${encodeURIComponent(savedPwd)}`),
        fetch(`/api/reviews?admin=${encodeURIComponent(savedPwd)}`),
        fetch('/api/products'),
      ])
      const [oData, rData, pData] = await Promise.all([oRes.json(), rRes.json(), pRes.json()])
      if (Array.isArray(oData)) setOrders(oData)
      if (Array.isArray(rData)) setReviews(rData)
      if (Array.isArray(pData)) setProducts(pData)
    } catch {}
    setLoading(false)
  }

  // ---- ORDER CRUD ----
  const openAddOrder = () => { setEditingOrder(null); setOrderForm(EMPTY_ORDER); setOrderModal(true) }
  const openEditOrder = (o: any) => {
    setEditingOrder(o)
    setOrderForm({
      customer_name: o.customer_name || '', customer_phone: o.customer_phone || '',
      customer_email: o.customer_email || '', product: o.product || '',
      size: o.size || '8 inch', quantity: o.quantity || 1,
      price: o.price || 0, total_amount: o.total_amount || 0,
      delivery_address: o.delivery_address || '', city: o.city || '',
      pincode: o.pincode || '', special_note: o.special_note || '',
      status: o.status || 'pending', payment_status: o.payment_status || 'pending',
      tracking_number: o.tracking_number || '',
    })
    setOrderModal(true)
  }

  const saveOrder = async () => {
    if (!orderForm.customer_name || !orderForm.customer_phone || !orderForm.product) {
      alert('Name, Phone and Product are required!'); return
    }
    setOrderSaving(true)
    try {
      if (editingOrder) {
        await fetch(`/api/orders/${editingOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminPassword: savedPwd, ...orderForm }),
        })
      } else {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: orderForm.customer_name, phone: orderForm.customer_phone,
            email: orderForm.customer_email, product: orderForm.product,
            size: orderForm.size, quantity: orderForm.quantity,
            price: orderForm.price, totalAmount: orderForm.total_amount,
            address: orderForm.delivery_address, city: orderForm.city,
            pincode: orderForm.pincode, note: orderForm.special_note,
            paymentStatus: orderForm.payment_status,
          }),
        })
      }
      setOrderModal(false)
      await refresh()
    } catch { alert('Error saving order') }
    setOrderSaving(false)
  }

  const deleteOrder = async (id: string, orderNum: string) => {
    if (!confirm(`Delete order ${orderNum}? This cannot be undone.`)) return
    await fetch(`/api/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd }),
    })
    setOrders(orders.filter(o => o.id !== id))
  }

  const updateOrderStatus = async (id: string, updates: any) => {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd, ...updates }),
    })
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o))
  }

  // ---- PRODUCT CRUD ----
  const openAddProduct = () => { setEditingProduct(null); setProductForm(EMPTY_PRODUCT); setProductModal(true) }
  const openEditProduct = (p: any) => {
    setEditingProduct(p)
    setProductForm({
      name: p.name || '', description: p.description || '',
      category: p.category || 'radha', price: p.price || 0,
      original_price: p.original_price || 0,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(',') : p.sizes || '',
      emoji: p.emoji || '🥻', bg_gradient: p.bg_gradient || 'c1',
      badge: p.badge || '', is_active: p.is_active !== false,
    })
    setProductModal(true)
  }

  const saveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      alert('Name and Price are required!'); return
    }
    setProductSaving(true)
    try {
      const payload = {
        adminPassword: savedPwd,
        name: productForm.name,
        description: productForm.description,
        category: productForm.category,
        price: parseFloat(productForm.price),
        original_price: parseFloat(productForm.original_price) || null,
        sizes: productForm.sizes.split(',').map((s: string) => s.trim()).filter(Boolean),
        emoji: productForm.emoji,
        bg_gradient: productForm.bg_gradient,
        badge: productForm.badge || null,
        is_active: productForm.is_active,
      }
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setProductModal(false)
      await refresh()
    } catch { alert('Error saving product') }
    setProductSaving(false)
  }

  const deleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd }),
    })
    setProducts(products.filter(p => p.id !== id))
  }

  const toggleProductActive = async (id: string, current: boolean) => {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd, is_active: !current }),
    })
    setProducts(products.map(p => p.id === id ? { ...p, is_active: !current } : p))
  }

  // ---- REVIEWS ----
  const updateReview = async (id: string, approved: boolean) => {
    await fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd, is_approved: approved }),
    })
    setReviews(reviews.map(r => r.id === id ? { ...r, is_approved: approved } : r))
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return
    await fetch(`/api/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: savedPwd }),
    })
    setReviews(reviews.filter(r => r.id !== id))
  }

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || o.customer_name?.toLowerCase().includes(q) || o.customer_phone?.includes(q) || o.order_number?.includes(q) || o.product?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const paidRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total_amount), 0)
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0)
  const pendingReviews = reviews.filter(r => !r.is_approved).length

  // ===================== LOGIN =====================
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg,var(--deep) 0%,#2D0F05 100%)' }}>
        <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--cream)' }}>
              <Shield size={32} style={{ color: 'var(--saffron)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>Admin Access</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Harivanshi Poshak Seva</p>
          </div>
          {isLocked ? (
            <div className="text-center p-4 rounded-xl" style={{ background: '#FEE2E2' }}>
              <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
              <p className="font-bold text-red-700 text-sm">Temporarily Locked</p>
              <p className="text-red-700 font-bold text-3xl mt-3">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</p>
              <p className="text-red-600 text-xs mt-1">minutes remaining</p>
            </div>
          ) : (
            <>
              {attempts > 0 && (
                <div className="mb-3 p-3 rounded-xl flex items-center gap-2" style={{ background: '#FEF3CC' }}>
                  <AlertTriangle size={14} className="text-amber-600" />
                  <p className="text-xs text-amber-700">{MAX_ATTEMPTS - attempts} attempts left</p>
                </div>
              )}
              <div className="relative mb-3">
                <input type={showPwd ? 'text' : 'password'} placeholder="Enter Admin Password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && login()}
                  className="w-full px-4 py-3 rounded-xl border-2 outline-none pr-10 text-sm"
                  style={{ borderColor: loginError ? '#EF4444' : 'var(--border)', background: 'var(--cream)' }}
                  autoFocus autoComplete="off" />
                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-3.5" style={{ color: 'var(--muted)' }}>
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginError && <p className="text-xs text-red-500 mb-3 text-center font-semibold">{loginError}</p>}
              <button onClick={login} disabled={loading} className="w-full text-white font-bold py-3 rounded-xl" style={{ background: loading ? 'var(--muted)' : 'var(--saffron)' }}>
                {loading ? 'Verifying...' : '🔐 Login'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // ===================== MAIN DASHBOARD =====================
  return (
    <div className="min-h-screen" style={{ background: '#F5F0E8' }}>
      <div style={{ background: 'var(--deep)', padding: '1rem 1.5rem' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🪷</span>
            <div>
              <h1 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Admin Dashboard</h1>
              <p className="text-xs" style={{ color: 'var(--border)' }}>Harivanshi Poshak Seva</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="text-white flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
            </button>
            <a href="/" className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: 'rgba(255,255,255,0.15)' }}>Website →</a>
            <button onClick={() => { setAuthed(false); setSavedPwd('') }} className="text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: '#EF4444' }}>Logout</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'orders', label: '📦 Orders', count: pendingOrders },
            { id: 'products', label: '🛍️ Products', count: 0 },
            { id: 'reviews', label: '⭐ Reviews', count: pendingReviews },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as AdminTab)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap"
              style={{ borderColor: tab === t.id ? 'var(--saffron)' : 'transparent', color: tab === t.id ? 'var(--saffron)' : '#6B7280' }}>
              {t.label}
              {t.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white" style={{ background: '#EF4444' }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">

        {/* DASHBOARD */}
        {tab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Orders', value: totalOrders, icon: Package, color: 'var(--saffron)', bg: '#FFF3E8' },
                { label: 'Pending', value: pendingOrders, icon: Clock, color: '#F59E0B', bg: '#FEF3CC' },
                { label: 'Delivered', value: deliveredOrders, icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
                { label: 'Online Revenue', value: `₹${paidRevenue.toLocaleString()}`, icon: TrendingUp, color: '#8B5CF6', bg: '#EDE9FE' },
              ].map(stat => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                      <Icon size={20} style={{ color: stat.color }} />
                    </div>
                    <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                    <div className="text-xs font-medium" style={{ color: '#6B7280' }}>{stat.label}</div>
                  </div>
                )
              })}
            </div>
            <div className="bg-white rounded-2xl p-5 mb-6 flex items-center justify-between" style={{ border: '1px solid #E5E7EB' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#6B7280' }}>Total Order Value (incl. COD)</p>
                <p className="text-3xl font-bold mt-1" style={{ color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div className="text-5xl">💰</div>
            </div>
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E7EB' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Recent Orders</h3>
                <button onClick={() => setTab('orders')} className="text-sm font-semibold" style={{ color: 'var(--saffron)' }}>View All →</button>
              </div>
              {orders.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#6B7280' }}>No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {['Order #','Customer','Product','Amount','Status'].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {orders.slice(0, 8).map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                          <td className="py-2.5 px-3 font-mono text-xs font-bold" style={{ color: 'var(--saffron)' }}>{o.order_number}</td>
                          <td className="py-2.5 px-3"><div className="text-xs font-medium">{o.customer_name}</div><a href={`https://wa.me/${o.customer_phone}`} target="_blank" className="text-xs text-green-600">{o.customer_phone}</a></td>
                          <td className="py-2.5 px-3 text-xs" style={{ color: '#6B7280' }}>{o.product}</td>
                          <td className="py-2.5 px-3 font-bold text-xs">₹{o.total_amount}</td>
                          <td className="py-2.5 px-3"><span className="text-xs px-2 py-1 rounded-full font-bold" style={{ ...STATUS_COLORS[o.status] }}>{o.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS */}
        {tab === 'orders' && (
          <div>
            <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
              <div className="flex gap-3 flex-1 flex-wrap">
                <input type="text" placeholder="🔍 Search name, phone, order#..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="px-4 py-2 rounded-xl text-sm border-2 outline-none flex-1 min-w-48"
                  style={{ borderColor: 'var(--border)', background: 'white' }} />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm border-2 outline-none" style={{ borderColor: 'var(--border)', background: 'white' }}>
                  <option value="all">All Status</option>
                  {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={openAddOrder} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm whitespace-nowrap" style={{ background: 'var(--saffron)' }}>
                <Plus size={16} /> Add Order
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#F3F4F6' }}>
                <h3 className="font-bold">Orders ({filteredOrders.length})</h3>
                <span className="text-sm" style={{ color: '#6B7280' }}>{pendingOrders} pending · ₹{totalRevenue.toLocaleString()} total</span>
              </div>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16" style={{ color: '#6B7280' }}><Package size={48} className="mx-auto mb-3 opacity-30" /><p>No orders found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: '#F9FAFB' }}>
                      <tr>{['Order #','Customer','Product','Size','Qty','Amount','Payment','Status','Update','Tracking','Date','Actions'].map(h => <th key={h} className="text-left py-3 px-3 text-xs font-semibold whitespace-nowrap" style={{ color: '#6B7280' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50" style={{ borderTop: '1px solid #F3F4F6' }}>
                          <td className="py-3 px-3 font-mono text-xs font-bold whitespace-nowrap" style={{ color: 'var(--saffron)' }}>{o.order_number}</td>
                          <td className="py-3 px-3"><div className="font-medium text-xs whitespace-nowrap">{o.customer_name}</div><a href={`https://wa.me/${o.customer_phone}`} target="_blank" className="text-xs text-green-600">📞 {o.customer_phone}</a>{o.city && <div className="text-xs" style={{ color: '#9CA3AF' }}>📍 {o.city}</div>}</td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap" style={{ color: '#6B7280' }}>{o.product}</td>
                          <td className="py-3 px-3 text-xs">{o.size}</td>
                          <td className="py-3 px-3 text-xs text-center">{o.quantity}</td>
                          <td className="py-3 px-3 font-bold text-xs whitespace-nowrap">₹{o.total_amount}</td>
                          <td className="py-3 px-3"><span className="text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap" style={{ color: o.payment_status === 'paid' ? '#10B981' : '#F59E0B', background: o.payment_status === 'paid' ? '#D1FAE5' : '#FEF3CC' }}>{o.payment_status === 'paid' ? '✓ Paid' : 'COD'}</span></td>
                          <td className="py-3 px-3"><span className="text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap" style={{ ...STATUS_COLORS[o.status] }}>{o.status}</span></td>
                          <td className="py-3 px-3"><select value={o.status} onChange={e => updateOrderStatus(o.id, { status: e.target.value })} className="text-xs border rounded-lg px-2 py-1.5 outline-none cursor-pointer" style={{ borderColor: '#E5E7EB' }}>{['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
                          <td className="py-3 px-3"><input type="text" placeholder="Tracking #" defaultValue={o.tracking_number || ''} onBlur={e => { if (e.target.value !== (o.tracking_number || '')) updateOrderStatus(o.id, { tracking_number: e.target.value }) }} className="text-xs border rounded-lg px-2 py-1.5 outline-none w-28" style={{ borderColor: '#E5E7EB' }} /></td>
                          <td className="py-3 px-3 text-xs whitespace-nowrap" style={{ color: '#9CA3AF' }}>{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                          <td className="py-3 px-3"><div className="flex gap-1.5"><button onClick={() => openEditOrder(o)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }} title="Edit"><Pencil size={13} style={{ color: '#3B82F6' }} /></button><button onClick={() => deleteOrder(o.id, o.order_number)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#FEE2E2' }} title="Delete"><Trash2 size={13} style={{ color: '#EF4444' }} /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Products ({products.length})</h3>
              <button onClick={openAddProduct} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-sm" style={{ background: 'var(--saffron)' }}>
                <Plus size={16} /> Add Product
              </button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => {
                const bgMap: Record<string,string> = { c1:'linear-gradient(135deg,#FDE8D0,#F9C08A)', c2:'linear-gradient(135deg,#E8D5F5,#C9A8E8)', c3:'linear-gradient(135deg,#D0F0E8,#8ACFC0)', c4:'linear-gradient(135deg,#F5D0D0,#E8A0A0)', c5:'linear-gradient(135deg,#D0E8F5,#8AB8D8)', c6:'linear-gradient(135deg,#F5EBD0,#E8C87A)' }
                return (
                  <div key={p.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: `2px solid ${p.is_active ? 'var(--border)' : '#E5E7EB'}`, opacity: p.is_active ? 1 : 0.6 }}>
                    {/* Product Preview */}
                    <div className="h-32 flex items-center justify-center text-5xl relative" style={{ background: bgMap[p.bg_gradient] || bgMap.c1 }}>
                      {p.emoji}
                      {p.badge && <span className="absolute top-2 right-2 text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--saffron)' }}>{p.badge}</span>}
                      {!p.is_active && <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#FEE2E2', color: '#EF4444' }}>Hidden</span>}
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--deep)' }}>{p.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F3F4F6', color: '#6B7280' }}>{p.category}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold" style={{ color: 'var(--saffron)' }}>₹{p.price}</span>
                        {p.original_price && <span className="text-xs line-through" style={{ color: 'var(--muted)' }}>₹{p.original_price}</span>}
                      </div>
                      <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
                        Sizes: {Array.isArray(p.sizes) ? p.sizes.join(', ') : p.sizes}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => toggleProductActive(p.id, p.is_active)}
                          className="flex-1 text-xs font-bold py-2 rounded-xl"
                          style={{ background: p.is_active ? '#FEF3CC' : '#D1FAE5', color: p.is_active ? '#F59E0B' : '#10B981' }}>
                          {p.is_active ? 'Hide from Site' : '✓ Show on Site'}
                        </button>
                        <button onClick={() => openEditProduct(p)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                          <Pencil size={14} style={{ color: '#3B82F6' }} />
                        </button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
                          <Trash2 size={14} style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === 'reviews' && (
          <div>
            <h3 className="font-bold mb-4">All Reviews ({reviews.length}) · {pendingReviews} pending</h3>
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl" style={{ border: '1px solid #E5E7EB', color: '#6B7280' }}><Star size={48} className="mx-auto mb-3 opacity-30" /><p>No reviews yet</p></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl p-5" style={{ border: `2px solid ${r.is_approved ? '#D1FAE5' : '#FEF3CC'}` }}>
                    <div className="flex justify-between items-start mb-3">
                      <div><span className="font-bold text-sm">{r.customer_name}</span><span className="text-xs ml-2" style={{ color: '#6B7280' }}>— {r.customer_city}</span></div>
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: r.is_approved ? '#D1FAE5' : '#FEF3CC', color: r.is_approved ? '#10B981' : '#F59E0B' }}>{r.is_approved ? '✓ Live' : '⏳ Pending'}</span>
                    </div>
                    <div className="flex mb-2 text-amber-400">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    <p className="text-sm mb-3 italic" style={{ color: '#6B7280' }}>"{r.review_text}"</p>
                    {r.product && <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>📦 {r.product}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => updateReview(r.id, !r.is_approved)} className="flex-1 text-xs font-bold py-2 rounded-xl" style={{ background: r.is_approved ? '#FEF3CC' : '#D1FAE5', color: r.is_approved ? '#F59E0B' : '#10B981' }}>{r.is_approved ? 'Hide' : '✓ Approve & Publish'}</button>
                      <button onClick={() => deleteReview(r.id)} className="text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1" style={{ background: '#FEE2E2', color: '#EF4444' }}><Trash2 size={12} /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== ORDER MODAL ===== */}
      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => e.target === e.currentTarget && setOrderModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>{editingOrder ? '✏️ Edit Order' : '➕ Add New Order'}</h3>
              <button onClick={() => setOrderModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Customer Info</p></div>
              {[['customer_name','Customer Name *','text','Full name'],['customer_phone','Phone *','tel','10 digit'],['customer_email','Email','email','Optional']].map(([k,l,t,p]) => (
                <div key={k}><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>{l}</label><input type={t} value={orderForm[k]} onChange={e => setOrderForm({...orderForm,[k]:e.target.value})} placeholder={p} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              ))}
              <div className="col-span-2 mt-2"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Product Info</p></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Product *</label>
                <select value={orderForm.product} onChange={e => setOrderForm({...orderForm,product:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }}>
                  <option value="">Select...</option>
                  {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Size</label>
                <select value={orderForm.size} onChange={e => setOrderForm({...orderForm,size:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }}>
                  {['6 inch','8 inch','10 inch','12 inch','18 inch','Custom Size'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Qty</label><input type="number" min={1} value={orderForm.quantity} onChange={e => setOrderForm({...orderForm,quantity:parseInt(e.target.value)||1})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Price ₹</label><input type="number" value={orderForm.price} onChange={e => setOrderForm({...orderForm,price:parseFloat(e.target.value)||0,total_amount:(parseFloat(e.target.value)||0)*orderForm.quantity})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Total ₹</label><input type="number" value={orderForm.total_amount} onChange={e => setOrderForm({...orderForm,total_amount:parseFloat(e.target.value)||0})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div className="col-span-2 mt-2"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Delivery</p></div>
              <div className="col-span-2"><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Address</label><textarea value={orderForm.delivery_address} onChange={e => setOrderForm({...orderForm,delivery_address:e.target.value})} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none resize-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>City</label><input type="text" value={orderForm.city} onChange={e => setOrderForm({...orderForm,city:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Pincode</label><input type="text" value={orderForm.pincode} onChange={e => setOrderForm({...orderForm,pincode:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Special Note</label><input type="text" value={orderForm.special_note} onChange={e => setOrderForm({...orderForm,special_note:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Tracking #</label><input type="text" value={orderForm.tracking_number} onChange={e => setOrderForm({...orderForm,tracking_number:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} /></div>
              <div className="col-span-2 mt-2"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Status</p></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Order Status</label>
                <select value={orderForm.status} onChange={e => setOrderForm({...orderForm,status:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }}>
                  {['pending','confirmed','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Payment Status</label>
                <select value={orderForm.payment_status} onChange={e => setOrderForm({...orderForm,payment_status:e.target.value})} className="w-full px-3 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }}>
                  {['pending','paid','failed','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2 mt-2">
                <button onClick={saveOrder} disabled={orderSaving} className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: orderSaving ? 'var(--muted)' : 'var(--saffron)' }}>
                  {orderSaving ? 'Saving...' : <><Save size={16} /> {editingOrder ? 'Save Changes' : 'Add Order'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT MODAL ===== */}
      {productModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={e => e.target === e.currentTarget && setProductModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--deep)' }}>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
              <button onClick={() => setProductModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Product Name *</label>
                <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm,name:e.target.value})} placeholder="e.g. Radha Ji Lehenga Set" className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none focus:border-amber-400" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Description</label>
                <textarea value={productForm.description} onChange={e => setProductForm({...productForm,description:e.target.value})} rows={2} placeholder="Short description..." className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none resize-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Category</label>
                  <select value={productForm.category} onChange={e => setProductForm({...productForm,category:e.target.value})} className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }}>
                    {['radha','krishna','jodi','festival','shringar','custom'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Emoji / Icon</label>
                  <input type="text" value={productForm.emoji} onChange={e => setProductForm({...productForm,emoji:e.target.value})} placeholder="🥻" className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Price ₹ *</label>
                  <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm,price:e.target.value})} className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Original Price ₹ (crossed)</label>
                  <input type="number" value={productForm.original_price} onChange={e => setProductForm({...productForm,original_price:e.target.value})} placeholder="Optional" className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Sizes (comma separated)</label>
                <input type="text" value={productForm.sizes} onChange={e => setProductForm({...productForm,sizes:e.target.value})} placeholder="6 inch,8 inch,10 inch,12 inch,18 inch" className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: 'var(--deep)' }}>Badge (optional)</label>
                <input type="text" value={productForm.badge} onChange={e => setProductForm({...productForm,badge:e.target.value})} placeholder="e.g. Bestseller, New, Most Loved" className="w-full px-4 py-2.5 rounded-xl text-sm border-2 outline-none" style={{ borderColor:'var(--border)', background:'var(--cream)' }} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-2" style={{ color: 'var(--deep)' }}>Card Background Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {BG_OPTIONS.map(bg => (
                    <button key={bg.value} onClick={() => setProductForm({...productForm,bg_gradient:bg.value})}
                      className="h-10 rounded-xl border-2 transition-all"
                      style={{ background: bg.preview, borderColor: productForm.bg_gradient === bg.value ? 'var(--saffron)' : 'transparent', transform: productForm.bg_gradient === bg.value ? 'scale(1.1)' : 'scale(1)' }}
                      title={bg.label} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
                <input type="checkbox" id="is_active" checked={productForm.is_active} onChange={e => setProductForm({...productForm,is_active:e.target.checked})} className="w-4 h-4 accent-amber-500" />
                <label htmlFor="is_active" className="text-sm font-semibold cursor-pointer" style={{ color: 'var(--deep)' }}>Show this product on website</label>
              </div>
              <button onClick={saveProduct} disabled={productSaving} className="w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2" style={{ background: productSaving ? 'var(--muted)' : 'var(--saffron)' }}>
                {productSaving ? 'Saving...' : <><Save size={16} /> {editingProduct ? 'Save Changes' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}