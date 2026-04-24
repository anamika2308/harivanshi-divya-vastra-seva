'use client'
import { useState, useEffect } from 'react'
import { Menu, X, ShoppingBag, User, LogOut, Package } from 'lucide-react'
import { getSession, clearSession, Customer } from '@/lib/auth'

interface NavbarProps {
  onOrderClick: () => void
  onLoginClick: () => void
  customer: Customer | null
  onLogout: () => void
}

export default function Navbar({ onOrderClick, onLoginClick, customer, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 shadow-lg" style={{ background: 'var(--deep)' }}>
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Brand */}
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--gold)' }}>🪷</div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: '#FDF8F0', fontFamily: 'var(--font-display)' }}>Harivanshi Poshak Seva</div>
            <div className="text-xs tracking-widest hidden sm:block" style={{ color: 'var(--border)' }}>Divine Handmade Outfits</div>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {[['products','Collection'],['reviews','Reviews'],['about','About']].map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)} className="text-sm font-medium hover:text-white transition-colors" style={{ color: 'var(--border)' }}>{label}</button>
          ))}
          <a href="/orders" className="text-sm font-medium hover:text-white transition-colors" style={{ color: 'var(--border)' }}>Track Order</a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {customer ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(240,208,128,0.15)', color: 'var(--border)' }}>
                <User size={16} />
                <span className="hidden sm:block">{customer.name.split(' ')[0]}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl p-2 w-48 z-50" style={{ border: '1px solid var(--border)' }}>
                  <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                    <p className="text-sm font-bold" style={{ color: 'var(--deep)' }}>{customer.name}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{customer.phone}</p>
                  </div>
                  <a href="/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-amber-50 w-full" style={{ color: 'var(--deep)' }}>
                    <Package size={14} /> My Orders
                  </a>
                  <button onClick={() => { onLogout(); setUserMenuOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-red-50 w-full text-red-500">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onLoginClick}
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'rgba(240,208,128,0.15)', color: 'var(--border)' }}>
              <User size={15} /> Login
            </button>
          )}
          <button onClick={onOrderClick}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2 rounded-full hover:-translate-y-0.5 transition-all"
            style={{ background: 'var(--saffron)' }}>
            <ShoppingBag size={15} />
            <span className="hidden sm:block">Order Now</span>
          </button>
          <button className="md:hidden text-white p-1" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-4 flex flex-col gap-3" style={{ background: 'var(--deep)', borderColor: 'rgba(240,208,128,0.2)' }}>
          {[['products','Collection'],['reviews','Reviews'],['about','About']].map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)} className="text-left text-sm font-medium" style={{ color: 'var(--border)' }}>{label}</button>
          ))}
          <a href="/orders" className="text-sm font-medium" style={{ color: 'var(--border)' }}>Track Order</a>
          {customer ? (
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--border)' }}>👤 {customer.name}</p>
              <button onClick={() => { onLogout(); setMenuOpen(false) }} className="text-xs text-red-400 mt-1">Logout</button>
            </div>
          ) : (
            <button onClick={() => { onLoginClick(); setMenuOpen(false) }} className="text-sm font-semibold" style={{ color: 'var(--border)' }}>
              Login / Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  )
}
