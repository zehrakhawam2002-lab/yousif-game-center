'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other' },
  { icon: '🧾', label: 'Orders', path: '/orders', active: true },
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

const ICONS = { drink: '🥤', food: '🍿', hookah: '💨', other: '📦' }

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [settings, setSettings] = useState({ currency: 'IQD', center_name: 'Yousif Game Center' })
  const [orderItems, setOrderItems] = useState([])
  const [discount, setDiscount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData()
  }, [])

  const loadData = async () => {
    const { data: menu } = await supabase.from('menu_items').select('*').eq('is_available', true)
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    setMenuItems(menu || [])
    if (cfg) setSettings(cfg)
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency

  const addItem = item => setOrderItems(prev => {
    const ex = prev.find(i => i.id === item.id)
    if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { ...item, qty: 1 }]
  })

  const removeItem = id => {
    const item = orderItems.find(i => i.id === id)
    if (item?.qty > 1) setOrderItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i))
    else setOrderItems(prev => prev.filter(i => i.id !== id))
  }

  const subtotal = orderItems.reduce((a, i) => a + i.price * i.qty, 0)
  const discAmt = subtotal * (discount / 100)
  const total = subtotal - discAmt

  const placeOrder = async () => {
    if (!orderItems.length) return
    const { data: order } = await supabase.from('orders').insert({
      subtotal, discount_percent: discount, discount_amount: discAmt, total, staff_id: user?.id
    }).select().single()

    if (order) {
      await supabase.from('order_items').insert(
        orderItems.map(i => ({ order_id: order.id, menu_item_id: i.id, name: i.name, price: i.price, quantity: i.qty }))
      )
    }
    setOrderItems([])
    setDiscount(0)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const signOut = async () => {
    if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    localStorage.removeItem('user'); router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>
      <nav style={{ width: '235px', background: '#1a1a2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '.75rem 0', position: 'fixed', height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '0.5rem 1.1rem 1rem', borderBottom: '1px solid #ffffff0f', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Yousif GC</div><div style={{ fontSize: '11px', color: '#8892a4' }}>Game Center</div></div>
        </div>
        {[['MAIN',0,5],['REPORTS',5,7],['SYSTEM',7,10]].map(([sec,from,to]) => (
          <div key={sec}>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '.12em', color: '#4a5568', padding: '.75rem 1.1rem .3rem', textTransform: 'uppercase' }}>{sec}</div>
            {NAV.slice(from,to).map(item => (
              <div key={item.path} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 1.1rem', fontSize: '13px', color: item.active ? '#fff' : '#8892a4', cursor: 'pointer', borderLeft: item.active ? '3px solid #6366f1' : '3px solid transparent', background: item.active ? '#ffffff0f' : 'transparent' }}>
                <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '.75rem 1.1rem', borderTop: '1px solid #ffffff0f', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{user?.name}</div><div style={{ fontSize: '11px', color: '#8892a4' }}>{user?.role}</div></div>
        </div>
      </nav>

      <div style={{ marginLeft: '235px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1.25rem', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 90 }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>🎮 Yousif Game Center</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '4px 12px' }}>Main Hall</div>
            <button onClick={signOut} style={{ fontSize: '12px', color: '#991b1b', cursor: 'pointer', padding: '5px 10px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fee2e2', fontWeight: '600' }}>✕ Sign out</button>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Orders 🧾</h2>
          </div>

          {saved && (
            <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem', color: '#065f46', fontWeight: '600', fontSize: '14px' }}>
              ✅ Order saved successfully!
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '14px', maxWidth: '960px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Select Items</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {menuItems.map(m => (
                  <div key={m.id} onClick={() => addItem(m)} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', background: '#fff', transition: 'all .15s' }}>
                    <div style={{ fontSize: '24px', marginBottom: '6px' }}>{ICONS[m.category] || '📦'}</div>
                    <div style={{ fontSize: '12px', color: '#1e293b', fontWeight: '600' }}>{m.name}</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#6366f1', marginTop: '3px' }}>{fmtIQD(m.price)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem' }}>
              <div style={{ textAlign: 'center', paddingBottom: '.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '.75rem' }}>
                <div style={{ fontSize: '28px' }}>🎮</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>{settings.center_name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{new Date().toLocaleDateString('en-GB')}</div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Items</div>

              {orderItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem', fontSize: '13px' }}>No items selected</div>
              ) : orderItems.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '5px' }}>
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{i.name} ×{i.qty}</span>
                  <button onClick={() => removeItem(i.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px' }}>✕</button>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', minWidth: '70px', textAlign: 'right' }}>{fmtIQD(i.price * i.qty)}</span>
                </div>
              ))}

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span style={{ fontWeight: '600' }}>{fmtIQD(subtotal)}</span>
                </div>
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 11px', margin: '8px 0' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>Discount %</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min="0" max="100" style={{ width: '65px', padding: '5px 8px', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px' }} />
                  <span style={{ fontSize: '12px', color: '#92400e' }}>%</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#92400e', fontWeight: '700' }}>-{fmtIQD(discAmt)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>Final Total</span>
                <span style={{ fontSize: '19px', fontWeight: '800', color: '#6366f1' }}>{fmtIQD(total)}</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setOrderItems([]); setDiscount(0) }} style={{ flex: 1, padding: '8px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Clear</button>
                <button onClick={placeOrder} style={{ flex: 2, padding: '8px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🧾 Place Order</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
