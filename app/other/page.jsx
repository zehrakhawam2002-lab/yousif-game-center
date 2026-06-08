'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other', active: true },
  { icon: '🧾', label: 'Orders', path: '/orders' },
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

const SUBTYPES = [
  { value: 'pool', label: 'Billiard Table', priceKey: 'price_pool' },
  { value: 'foosball', label: 'Foosball', priceKey: 'price_foosball' },
  { value: 'chips', label: 'Chips Game', priceKey: 'price_chips' },
]

export default function OtherPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stations, setStations] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [settings, setSettings] = useState({ price_pool: 5000, price_foosball: 3000, price_chips: 3000, currency: 'IQD' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(null)
  const [showEndModal, setShowEndModal] = useState(null)
  const [newName, setNewName] = useState('')
  const [newSubtype, setNewSubtype] = useState('pool')
  const [customer, setCustomer] = useState('')
  const [discount, setDiscount] = useState(0)
  const [sessionItems, setSessionItems] = useState([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData()
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    const { data: st } = await supabase.from('stations').select('*, sessions(id, started_at, customer_name, status)').eq('type', 'other').eq('is_active', true).order('created_at')
    const { data: menu } = await supabase.from('menu_items').select('*').eq('is_available', true)
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    setStations(st || [])
    setMenuItems(menu || [])
    if (cfg) setSettings(cfg)
  }

  const getActiveSession = st => st.sessions?.find(s => s.status === 'active')
  const getElapsed = session => session ? Date.now() - new Date(session.started_at).getTime() : 0
  const fmtTimer = ms => { const h = Math.floor(ms/3600000), m = Math.floor((ms%3600000)/60000), s = Math.floor((ms%60000)/1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` }
  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency
  const getPrice = st => settings[SUBTYPES.find(s => s.value === st.subtype)?.priceKey] || 3000
  const getSubtypeLabel = st => SUBTYPES.find(s => s.value === st.subtype)?.label || 'Game'

  const startSession = async () => {
    if (!showSessionModal) return
    await supabase.from('sessions').insert({ station_id: showSessionModal.id, customer_name: customer || 'Guest', started_at: new Date().toISOString(), status: 'active', staff_id: user?.id })
    setShowSessionModal(null); setCustomer(''); loadData()
  }

  const addItem = item => setSessionItems(prev => {
    const ex = prev.find(i => i.id === item.id)
    if (ex) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { ...item, qty: 1 }]
  })

  const endSession = async () => {
    if (!showEndModal) return
    const session = getActiveSession(showEndModal)
    if (!session) return
    const elapsed = getElapsed(session), price = getPrice(showEndModal)
    const gc = (elapsed / 3600000) * price, it = sessionItems.reduce((a, i) => a + i.price * i.qty, 0)
    const da = gc * (discount / 100), total = gc - da + it
    await supabase.from('sessions').update({ ended_at: new Date().toISOString(), duration_minutes: elapsed/60000, gaming_cost: gc, orders_total: it, discount_percent: discount, discount_amount: da, total, status: 'ended' }).eq('id', session.id)
    if (sessionItems.length) await supabase.from('session_items').insert(sessionItems.map(i => ({ session_id: session.id, menu_item_id: i.id, name: i.name, price: i.price, quantity: i.qty })))
    await supabase.from('stations').update({ total_hours: (showEndModal.total_hours||0) + elapsed/3600000, total_income: (showEndModal.total_income||0) + total }).eq('id', showEndModal.id)
    setShowEndModal(null); setSessionItems([]); setDiscount(0); loadData()
  }

  const addStation = async () => {
    if (!newName) return
    await supabase.from('stations').insert({ name: newName, type: 'other', subtype: newSubtype })
    setNewName(''); setShowAddModal(false); loadData()
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Other Games 🕹️</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={loadData} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
              <button onClick={() => setShowAddModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>+ Add Game</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {stations.map(st => {
              const session = getActiveSession(st), elapsed = getElapsed(session), price = getPrice(st), cost = session ? (elapsed/3600000)*price : 0
              return (
                <div key={st.id} style={{ background: '#fff', border: session ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{st.name}</div>
                      <div style={{ fontSize: '10px', color: '#64748b', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2px 8px', display: 'inline-block', marginTop: '2px' }}>{getSubtypeLabel(st)}</div>
                    </div>
                    {session ? <div style={{ fontSize: '10px', fontWeight: '700', color: '#065f46', background: '#d1fae5', borderRadius: '20px', padding: '2px 8px' }}>● Live</div>
                      : <div style={{ fontSize: '10px', color: '#94a3b8', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '2px 8px' }}>Idle</div>}
                  </div>
                  <div style={{ fontSize: session ? '28px' : '16px', fontWeight: session ? '800' : '400', color: session ? '#1e293b' : '#94a3b8', margin: '6px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{session ? fmtTimer(elapsed) : 'Idle'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>{fmtIQD(price)}/hr {session ? `• ${fmtIQD(cost)}` : ''}</div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {!session
                      ? <button onClick={() => { setShowSessionModal(st); setCustomer('') }} style={{ flex: 1, background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>▶ Start</button>
                      : <button onClick={() => { setShowEndModal(st); setSessionItems([]); setDiscount(0) }} style={{ flex: 1, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>■ End Session</button>}
                    <button onClick={async () => { if(confirm('Delete?')) { await supabase.from('stations').update({is_active:false}).eq('id',st.id); loadData() }}} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', fontSize: '12px', cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Add Game</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Pool Table #2" style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Game Type</label>
              <select value={newSubtype} onChange={e => setNewSubtype(e.target.value)} style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px' }}>
                {SUBTYPES.map(s => <option key={s.value} value={s.value}>{s.label} — {fmtIQD(settings[s.priceKey])}/hr</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={addStation} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ Add</button>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Start — {showSessionModal.name}</span>
              <button onClick={() => setShowSessionModal(null)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>💰</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Rate</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>{fmtIQD(getPrice(showSessionModal))}<span style={{ fontSize: '12px', fontWeight: '400', color: '#64748b' }}>/hr</span></div>
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Customer Name (optional)</label>
              <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="e.g. Ahmed" style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSessionModal(null)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={startSession} style={{ padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>▶ Start</button>
            </div>
          </div>
        </div>
      )}

      {showEndModal && (() => {
        const session = getActiveSession(showEndModal), elapsed = getElapsed(session), price = getPrice(showEndModal)
        const gc = (elapsed/3600000)*price, it = sessionItems.reduce((a,i)=>a+i.price*i.qty,0), da = gc*(discount/100), total = gc-da+it
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>End Session — {showEndModal.name}</span>
                <button onClick={() => setShowEndModal(null)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Duration</div>
                <div style={{ fontSize: '26px', fontWeight: '800', color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{fmtTimer(elapsed)}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Gaming cost: <strong>{fmtIQD(gc)}</strong></div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Add Orders</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
                {menuItems.map(m => (
                  <div key={m.id} onClick={() => addItem(m)} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{{ drink:'🥤',food:'🍿',hookah:'💨',other:'📦' }[m.category]}</div>
                    <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: '600' }}>{m.name}</div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', marginTop: '2px' }}>{fmtIQD(m.price)}</div>
                  </div>
                ))}
              </div>
              {sessionItems.length > 0 && sessionItems.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '5px' }}>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{i.name} ×{i.qty}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{fmtIQD(i.price*i.qty)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Gaming</span><span style={{ fontWeight: '600' }}>{fmtIQD(gc)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Orders</span><span style={{ fontWeight: '600' }}>{fmtIQD(it)}</span></div>
              </div>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 11px', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>Discount on gaming</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min="0" max="100" style={{ width: '65px', padding: '5px 8px', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px' }} />
                  <span style={{ fontSize: '12px', color: '#92400e' }}>%</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#92400e', fontWeight: '700' }}>-{fmtIQD(da)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>Final Total</span>
                <span style={{ fontSize: '19px', fontWeight: '800', color: '#6366f1' }}>{fmtIQD(total)}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowEndModal(null)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button onClick={endSession} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ End Session</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
