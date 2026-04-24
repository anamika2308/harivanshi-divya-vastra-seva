'use client'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import OrderModal from './components/OrderModal'
import LoginModal from './components/LoginModal'
import { Product, Review } from '@/types'
import { Customer, getSession, clearSession } from '@/lib/auth'
import { Star, ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

const DEFAULT_PRODUCTS: Product[] = [
  { id:'1', name:'Radha Ji Lehenga Set', description:'Beautiful handmade lehenga for Radha Ji', category:'radha', price:850, original_price:1100, sizes:['6 inch','8 inch','10 inch','12 inch','18 inch'], colors:[], emoji:'🥻', bg_gradient:'c1', badge:'Bestseller', is_active:true, stock_count:100, images:[], created_at:'' },
  { id:'2', name:'Krishna Ji Pitambar Set', description:'Divine pitambar and dhoti for Krishna Ji', category:'krishna', price:750, original_price:950, sizes:['6 inch','8 inch','10 inch','12 inch','18 inch'], colors:[], emoji:'👑', bg_gradient:'c2', badge:'New', is_active:true, stock_count:100, images:[], created_at:'' },
  { id:'3', name:'Radha Krishna Jodi Set', description:'Complete matching set for both', category:'jodi', price:1400, original_price:1800, sizes:['6 inch','8 inch','10 inch','12 inch','18 inch'], colors:[], emoji:'💑', bg_gradient:'c3', badge:'Most Loved', is_active:true, stock_count:100, images:[], created_at:'' },
  { id:'4', name:'Janmashtami Special Set', description:'Special festival collection', category:'festival', price:1200, original_price:1600, sizes:['6 inch','8 inch','10 inch','12 inch','18 inch'], colors:[], emoji:'🌸', bg_gradient:'c4', badge:undefined, is_active:true, stock_count:100, images:[], created_at:'' },
  { id:'5', name:'Shringar Complete Set', description:'Complete shringar set', category:'shringar', price:650, original_price:850, sizes:['All Sizes'], colors:[], emoji:'💎', bg_gradient:'c5', badge:'New', is_active:true, stock_count:100, images:[], created_at:'' },
  { id:'6', name:'Custom Order', description:'Your design, we create it', category:'custom', price:800, sizes:['Custom Size'], colors:[], emoji:'✂️', bg_gradient:'c6', is_active:true, stock_count:100, images:[], created_at:'' },
]

const DEFAULT_REVIEWS: Review[] = [
  { id:'1', customer_name:'Sunita Sharma', customer_city:'Indore, MP', rating:5, review_text:'Beautiful outfit! Quality was excellent and packaging was very safe. Radha Ji looked so divine!', product:'Radha Ji Lehenga Set', is_approved:true, created_at:'' },
  { id:'2', customer_name:'Priya Gupta', customer_city:'Bhopal, MP', rating:5, review_text:'Ordered for Janmashtami — arrived on time and the dress was absolutely stunning. Will order again!', product:'Janmashtami Special Set', is_approved:true, created_at:'' },
  { id:'3', customer_name:'Meena Joshi', customer_city:'Jaipur, Rajasthan', rating:5, review_text:'Custom order made exactly as I wanted. Very happy! Fast WhatsApp replies too.', product:'Custom Order', is_approved:true, created_at:'' },
]

const bgMap: Record<string,string> = { c1:'bg-c1', c2:'bg-c2', c3:'bg-c3', c4:'bg-c4', c5:'bg-c5', c6:'bg-c6' }
const bgGradients: Record<string,string> = { c1:'linear-gradient(135deg,#FDE8D0,#F9C08A)', c2:'linear-gradient(135deg,#E8D5F5,#C9A8E8)', c3:'linear-gradient(135deg,#D0F0E8,#8ACFC0)', c4:'linear-gradient(135deg,#F5D0D0,#E8A0A0)', c5:'linear-gradient(135deg,#D0E8F5,#8AB8D8)', c6:'linear-gradient(135deg,#F5EBD0,#E8C87A)' }

// Product Image Carousel Component
function ProductImageCarousel({ product, onOrder }: { product: Product; onOrder: () => void }) {
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const hasImages = product.images && product.images.length > 0
  const images = hasImages ? product.images : []

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => i === 0 ? images.length - 1 : i - 1) }
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setActiveImg(i => i === images.length - 1 ? 0 : i + 1) }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-xl" style={{ border: '1px solid var(--border)' }}>
        {/* Image / Emoji area */}
        <div className="relative overflow-hidden" style={{ height: 200 }}>
          {hasImages ? (
            <>
              {/* Main image */}
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {/* Carousel arrows - show only if multiple images */}
              {images.length > 1 && (
                <>
                  <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <ChevronLeft size={16} style={{ color: 'var(--deep)' }} />
                  </button>
                  <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.9)' }}>
                    <ChevronRight size={16} style={{ color: 'var(--deep)' }} />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_,i) => (
                      <button key={i} onClick={e => { e.stopPropagation(); setActiveImg(i) }}
                        className="rounded-full transition-all"
                        style={{ width: i === activeImg ? 16 : 6, height: 6, background: i === activeImg ? 'var(--saffron)' : 'rgba(255,255,255,0.7)' }} />
                    ))}
                  </div>
                </>
              )}
              {/* Zoom button */}
              <button onClick={e => { e.stopPropagation(); setLightbox(true) }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'rgba(255,255,255,0.9)' }}>
                <ZoomIn size={14} style={{ color: 'var(--deep)' }} />
              </button>
              {/* Image count badge */}
              {images.length > 1 && (
                <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}>
                  {activeImg + 1}/{images.length}
                </div>
              )}
            </>
          ) : (
            // Fallback emoji
            <div className={`h-full flex items-center justify-center text-7xl ${bgMap[product.bg_gradient] || 'bg-c1'}`}>
              {product.emoji}
            </div>
          )}
          {/* Badge */}
          {product.badge && (
            <span className="absolute top-2 right-2 text-white text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: product.badge === 'Most Loved' ? '#E24B4A' : 'var(--saffron)' }}>
              {product.badge}
            </span>
          )}
        </div>

        {/* Thumbnail strip - if more than 1 image */}
        {hasImages && images.length > 1 && (
          <div className="flex gap-1.5 px-3 pt-2 overflow-x-auto">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                style={{ width: 44, height: 44, border: `2px solid ${i === activeImg ? 'var(--saffron)' : 'transparent'}` }}>
                <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--deep)' }}>{product.name}</h3>
          {product.description && <p className="text-xs mb-2 line-clamp-1" style={{ color: '#9CA3AF' }}>{product.description}</p>}
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{product.sizes.slice(0,4).join(', ')}</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--saffron)', fontFamily: 'var(--font-display)' }}>₹{product.price}</span>
              {product.original_price && <span className="text-xs ml-1.5 line-through" style={{ color: 'var(--muted)' }}>₹{product.original_price}</span>}
            </div>
            <button onClick={onOrder} className="text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:text-white hover:-translate-y-0.5" style={{ background: 'var(--deep)', color: 'var(--border)' }}>
              Order
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && hasImages && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.92)' }} onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white w-10 h-10 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => setLightbox(false)}>
            <X size={20} />
          </button>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={images[activeImg]} alt={product.name} className="w-full rounded-2xl object-contain max-h-[80vh]" />
            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <ChevronRight size={20} className="text-white" />
                </button>
                <div className="flex justify-center gap-2 mt-4">
                  {images.map((_,i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="rounded-full transition-all"
                      style={{ width: i === activeImg ? 20 : 8, height: 8, background: i === activeImg ? 'var(--saffron)' : 'rgba(255,255,255,0.4)' }} />
                  ))}
                </div>
                {/* Thumbnails in lightbox */}
                <div className="flex gap-2 mt-3 justify-center flex-wrap">
                  {images.map((img,i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className="rounded-lg overflow-hidden transition-all"
                      style={{ width: 56, height: 56, border: `2px solid ${i === activeImg ? 'var(--saffron)' : 'rgba(255,255,255,0.2)'}` }}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
            <p className="text-center text-white font-bold mt-3">{product.name}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  const [orderOpen, setOrderOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>()
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS)
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS)
  const [activeCategory, setActiveCategory] = useState('all')
  const [mounted, setMounted] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [reviewForm, setReviewForm] = useState({ name:'', city:'', rating:5, text:'', product:'' })
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const session = getSession()
    if (session) setCustomer(session)
    fetch('/api/products').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length > 0) setProducts(d) }).catch(() => {})
    fetch('/api/reviews').then(r => r.json()).then(d => { if (Array.isArray(d) && d.length > 0) setReviews(d) }).catch(() => {})
  }, [])

  const openOrder = (product?: string) => { setSelectedProduct(product); setOrderOpen(true) }
  const handleLogout = () => { clearSession(); setCustomer(null) }

  const submitReview = async () => {
    if (!reviewForm.name || !reviewForm.city || !reviewForm.text) { alert('Please fill all fields'); return }
    await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name:reviewForm.name, city:reviewForm.city, rating:reviewForm.rating, text:reviewForm.text, product:reviewForm.product }) }).catch(()=>{})
    setReviewSubmitted(true)
  }

  const categories = [
    { id:'all', label:'All', emoji:'🌟' },
    { id:'radha', label:'Radha Ji', emoji:'🥻' },
    { id:'krishna', label:'Krishna Ji', emoji:'👑' },
    { id:'jodi', label:'Jodi Set', emoji:'💑' },
    { id:'festival', label:'Festival', emoji:'🌸' },
    { id:'shringar', label:'Shringar', emoji:'💎' },
    { id:'custom', label:'Custom', emoji:'✂️' },
  ]
  const filteredProducts = activeCategory === 'all' ? products : products.filter(p => p.category === activeCategory)

  if (!mounted) return null

  return (
    <>
      <Navbar onOrderClick={() => openOrder()} onLoginClick={() => setLoginOpen(true)} customer={customer} onLogout={handleLogout} />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background:'linear-gradient(135deg, var(--deep) 0%, #6B2E1A 50%, #8B3A1F 100%)', padding:'5rem 1.5rem' }}>
        <div className="hero-pattern absolute inset-0" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block text-xs tracking-widest mb-6 px-5 py-2 rounded-full" style={{ background:'rgba(240,208,128,0.15)', border:'1px solid rgba(240,208,128,0.3)', color:'var(--border)' }}>
            ✨ Handmade with Devotion — Bhopal
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4" style={{ fontFamily:'var(--font-display)', color:'#FDF8F0' }}>
            Divine <span style={{ color:'var(--border)' }}>Outfits</span> for<br />Radha Krishna Ji
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto" style={{ color:'#D4B896', lineHeight:1.8 }}>
            Every outfit crafted with love & devotion — delivered across India from Bhopal 🙏
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => openOrder()} className="text-white font-bold px-8 py-3.5 rounded-full hover:-translate-y-1 transition-all shadow-lg" style={{ background:'var(--saffron)' }}>🛍️ Order Now</button>
            <button onClick={() => document.getElementById('products')?.scrollIntoView({behavior:'smooth'})} className="font-bold px-8 py-3.5 rounded-full transition-all" style={{ color:'var(--border)', border:'1.5px solid rgba(240,208,128,0.4)' }}>View Collection →</button>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[{num:'500+',label:'Orders Delivered'},{num:'100%',label:'Handmade'},{num:'All India',label:'Delivery'},{num:'5★',label:'Rating'}].map(s => (
              <div key={s.num} className="text-center">
                <div className="text-2xl md:text-3xl font-bold" style={{ fontFamily:'var(--font-display)', color:'var(--border)' }}>{s.num}</div>
                <div className="text-xs mt-1" style={{ color:'#D4B896' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ background:'var(--gold)', padding:'10px 0', overflow:'hidden' }}>
        <div className="marquee-track">
          {['Radha Ji Poshak ✦','Krishna Ji Shringar ✦','Janmashtami Special ✦','Handmade with Love ✦','All India Delivery ✦','Custom Orders ✦','Radha Ji Poshak ✦','Krishna Ji Shringar ✦','Janmashtami Special ✦','Handmade with Love ✦','All India Delivery ✦','Custom Orders ✦'].map((t,i) => (
            <span key={i} className="text-sm font-bold" style={{ color:'var(--deep)', whiteSpace:'nowrap', marginRight:'2rem' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section className="py-12 px-4" style={{ background:'var(--cream)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs tracking-widest font-bold mb-2" style={{ color:'var(--saffron)' }}>BROWSE BY CATEGORY</p>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily:'var(--font-display)', color:'var(--deep)' }}>What Are You Looking For?</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => { setActiveCategory(cat.id); document.getElementById('products')?.scrollIntoView({behavior:'smooth'}) }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: activeCategory===cat.id?'var(--deep)':'white', color: activeCategory===cat.id?'var(--border)':'var(--deep)', border:`1.5px solid ${activeCategory===cat.id?'var(--deep)':'var(--border)'}` }}>
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" style={{ background:'#FFF9EE', padding:'2rem 1rem 4rem' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs tracking-widest font-bold mb-2" style={{ color:'var(--saffron)' }}>OUR PRODUCTS</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily:'var(--font-display)', color:'var(--deep)' }}>Featured Collection</h2>
            <div className="w-16 h-1 mx-auto mt-3 rounded" style={{ background:'linear-gradient(90deg,var(--saffron),var(--gold))' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductImageCarousel key={product.id} product={product} onOrder={() => openOrder(product.name)} />
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section id="about" className="py-14 px-4" style={{ background:'var(--cream)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-widest font-bold mb-2" style={{ color:'var(--saffron)' }}>WHY CHOOSE US</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily:'var(--font-display)', color:'var(--deep)' }}>What Makes Us Special?</h2>
            <div className="w-16 h-1 mx-auto mt-3 rounded" style={{ background:'linear-gradient(90deg,var(--saffron),var(--gold))' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon:'🪡', title:'100% Handmade', text:'Every stitch done by hand — crafted with love, not machines', bg:'#FDE8D0' },
              { icon:'💛', title:'Pure Devotion', text:'Harivanshi family — every outfit made from the heart', bg:'#FEF3CC' },
              { icon:'🚚', title:'All India Delivery', text:'Safe packaging, delivered across India from Bhopal', bg:'#D0F0E8' },
              { icon:'🎨', title:'Custom Designs', text:'Your color, design and size — we create it for you', bg:'#EDE8FD' },
            ].map(item => (
              <div key={item.title} className="rounded-2xl p-5 text-center" style={{ background:'white', border:'1px solid var(--border)' }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl" style={{ background:item.bg }}>{item.icon}</div>
                <h3 className="font-bold text-sm mb-2" style={{ color:'var(--deep)' }}>{item.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color:'var(--muted)' }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" style={{ background:'var(--deep)', padding:'4rem 1rem' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs tracking-widest font-bold mb-2" style={{ color:'var(--border)' }}>CUSTOMER REVIEWS</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily:'var(--font-display)', color:'#FDF8F0' }}>What Our Customers Say</h2>
            <div className="w-16 h-1 mx-auto mt-3 rounded" style={{ background:'linear-gradient(90deg,var(--saffron),var(--gold))' }} />
          </div>
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            {reviews.map(r => (
              <div key={r.id} className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(240,208,128,0.2)' }}>
                <div className="flex mb-3">{[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s<=r.rating?'#F0D080':'none'} stroke={s<=r.rating?'#F0D080':'#6B5030'} />)}</div>
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color:'#D4B896' }}>"{r.review_text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background:'var(--saffron)' }}>{r.customer_name[0]}</div>
                  <div>
                    <div className="text-sm font-bold" style={{ color:'var(--border)' }}>{r.customer_name}</div>
                    <div className="text-xs" style={{ color:'#A08060' }}>{r.customer_city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Review Form */}
          <div className="rounded-2xl p-6 max-w-xl mx-auto" style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(240,208,128,0.2)' }}>
            <h3 className="text-xl font-bold text-center mb-4" style={{ fontFamily:'var(--font-display)', color:'#FDF8F0' }}>Share Your Experience 🌟</h3>
            {reviewSubmitted ? (
              <div className="text-center py-4"><div className="text-4xl mb-2">🙏</div><p className="font-bold" style={{ color:'var(--border)' }}>Thank you! Review received.</p><p className="text-sm mt-1" style={{ color:'#A08060' }}>We'll publish it after approval.</p></div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Your Name" value={reviewForm.name} onChange={e => setReviewForm({...reviewForm,name:e.target.value})} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(240,208,128,0.3)', color:'#FDF8F0' }} />
                  <input placeholder="City" value={reviewForm.city} onChange={e => setReviewForm({...reviewForm,city:e.target.value})} className="px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(240,208,128,0.3)', color:'#FDF8F0' }} />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm" style={{ color:'#D4B896' }}>Rating:</span>
                  {[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewForm({...reviewForm,rating:s})}><Star size={20} fill={s<=reviewForm.rating?'#F0D080':'none'} stroke={s<=reviewForm.rating?'#F0D080':'#6B5030'} /></button>)}
                </div>
                <textarea placeholder="Share your experience..." value={reviewForm.text} onChange={e => setReviewForm({...reviewForm,text:e.target.value})} rows={3} className="px-4 py-2.5 rounded-xl text-sm outline-none resize-none" style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(240,208,128,0.3)', color:'#FDF8F0' }} />
                <button onClick={submitReview} className="text-white font-bold py-3 rounded-xl" style={{ background:'var(--saffron)' }}>Submit Review →</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background:'linear-gradient(135deg,var(--saffron),var(--gold))', padding:'4rem 1.5rem', textAlign:'center' }}>
        <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily:'var(--font-display)' }}>Order Today 🪷</h2>
        <p className="mb-8" style={{ color:'rgba(255,255,255,0.85)' }}>WhatsApp us or place an order directly — delivery in 2-7 days</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button onClick={() => openOrder()} className="font-bold px-8 py-3.5 rounded-full bg-white hover:-translate-y-1 transition-all" style={{ color:'var(--saffron)' }}>Place Order</button>
          <a href="https://wa.me/917879412639" target="_blank" className="font-bold px-8 py-3.5 rounded-full text-white flex items-center gap-2 hover:-translate-y-1 transition-all" style={{ background:'#25D366' }}>💬 WhatsApp Us</a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:'#1A0A04', padding:'3rem 1.5rem 1.5rem' }}>
        <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-3" style={{ fontFamily:'var(--font-display)', color:'var(--border)' }}>🪷 Harivanshi Poshak Seva</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color:'#A08060' }}>Handmade divine outfits for Radha Krishna Ji — crafted with devotion in Bhopal.</p>
            <a href="https://wa.me/917879412639" target="_blank" className="w-9 h-9 rounded-lg flex items-center justify-center text-white inline-flex" style={{ background:'#25D366' }}>💬</a>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" style={{ color:'var(--border)' }}>Quick Links</h4>
            {[['Collection','#products'],['Reviews','#reviews'],['Track Order','/orders']].map(([l,h]) => <a key={l} href={h} className="block text-sm mb-2 hover:text-amber-300" style={{ color:'#A08060' }}>{l}</a>)}
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" style={{ color:'var(--border)' }}>Products</h4>
            {products.slice(0,5).map(p => <button key={p.id} onClick={() => openOrder(p.name)} className="block text-sm mb-2 text-left hover:text-amber-300" style={{ color:'#A08060' }}>{p.name}</button>)}
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" style={{ color:'var(--border)' }}>Contact</h4>
            {['📍 Bhopal, Madhya Pradesh','📞 +91 7879412639','🕐 Mon–Sat: 9am – 7pm','✉️ Delivery: 2–7 working days'].map(t => <p key={t} className="text-sm mb-2" style={{ color:'#A08060' }}>{t}</p>)}
          </div>
        </div>
        <div className="max-w-5xl mx-auto pt-4 text-center text-xs" style={{ borderTop:'1px solid rgba(240,208,128,0.1)', color:'#5A3C20' }}>
          © 2025 Harivanshi Poshak Seva · Bhopal · Jai Radhe Krishna 🙏
        </div>
      </footer>

      <OrderModal isOpen={orderOpen} onClose={() => setOrderOpen(false)} selectedProduct={selectedProduct} products={products} customer={customer} onLoginRequired={() => setLoginOpen(true)} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={c => setCustomer(c)} />
    </>
  )
}
