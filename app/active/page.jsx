'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🔴', label: 'Active Sessions', path: '/active', active: true },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🖥️', label: 'PC Stations', path: '/pc' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other' },
  { icon: '🧾', label: 'Orders', path: '/orders' },
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

const TYPE_INFO = {
  ps: { label: 'PS Station', icon: '🎮', color: '#6366f1' },
  pc: { label: 'PC Station', icon: '🖥️', color: '#0ea5e9' },
  billiards: { label: 'Billiards', icon: '🎱', color: '#10b981' },
  other: { label: 'Other Game', icon: '🕹️', color: '#f59e0b' },
}

const SUBTYPE_LABEL = { table_tennis: 'Table Tennis', foosball: 'Foosball', chips: 'Chips Game' }
const ICONS = { drink: '🥤', food: '🍿', hookah: '💨', other: '📦' }

export default function ActiveSessionsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [itemsBySession, setItemsBySession] = useState({})
  const [settings, setSettings] = useState({
    currency: 'IQD', price_ps: 3000, price_pc: 2500,
    price_billiards_single: 4000, price_billiards_double: 6000,
    price_table_tennis: 3000, price_foosball: 3000, price_chips: 3000,
  })
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showOrderModal, setShowOrderModal] = useState(null) // session object

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData()
    const timer = setInterval(() => setTick(t => t + 1), 1000)
    const refresher = setInterval(loadData, 15000)
    return () => { clearInterval(timer); clearInterval(refresher) }
  }, [])

  const loadData = async () => {
    const { data: s } = await supabase
      .from('sessions')
      .select('*, stations(name, type, mode, subtype)')
      .eq('status', 'active')
      .order('started_at', { ascending: true })
    const { data: menu } = await supabase.from('menu_items').select('*').eq('is_available', true)
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    setSessions(s || [])
    setMenuItems(menu || [])
    if (cfg) setSettings(cfg)

    if (s && s.length) {
      const ids = s.map(x => x.id)
      const { data: items } = await supabase.from('session_items').select('*').in('session_id', ids)
      const map = {}
      ;(items || []).forEach(it => {
        if (!map[it.session_id]) map[it.session_id] = []
        map[it.session_id].push(it)
      })
      setItemsBySession(map)
    } else {
      setItemsBySession({})
    }
    setLoading(false)
  }

  const refreshSessionItems = async (sessionId) => {
    const { data: items } = await supabase.from('session_items').select('*').eq('session_id', sessionId)
    setItemsBySession(prev => ({ ...prev, [sessionId]: items || [] }))
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency
  const fmtTimer = (ms) => {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const fmtStart = (ts) => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const getPrice = (st) => {
    if (st.type === 'ps') return settings.price_ps
    if (st.type === 'pc') return settings.price_pc
    if (st.type === 'billiards') return st.mode === 'double' ? settings.price_billiards_double : settings.price_billiards_single
    if (st.type === 'other') return settings[`price_${st.subtype}`] || 3000
    return 0
  }

  const getCategoryLabel = (st) => {
    if (st.type === 'billiards') return st.mode === 'double' ? 'Billiards (Double 2P)' : 'Billiards (Single 1P)'
    if (st.type === 'other') return SUBTYPE_LABEL[st.subtype] || 'Other Game'
    return TYPE_INFO[st.type]?.label || st.type
  }

  const addOrderItem = async (sessionId, menuItem) => {
    const current = itemsBySession[sessionId] || []
    const existing = current.find(i => i.menu_item_id === menuItem.id)
    if (existing) {
      await supabase.from('session_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
    } else {
      await supabase.from('session_items').insert({ session_id: sessionId, menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 })
    }
    refreshSessionItems(sessionId)
  }

  const removeOrderItem = async (sessionId, item) => {
    if (item.quantity > 1) {
      await supabase.from('session_items').update({ quantity: item.quantity - 1 }).eq('id', item.id)
    } else {
      await supabase.from('session_items').delete().eq('id', item.id)
    }
    refreshSessionItems(sessionId)
  }

  const signOut = async () => {
    if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    localStorage.removeItem('user'); router.push('/login')
  }

  const getOrdersSubtotal = (sessionId) => (itemsBySession[sessionId] || []).reduce((a, i) => a + i.price * i.quantity, 0)

  // Totals
  const totalGamingCost = sessions.reduce((acc, s) => {
    const price = getPrice(s.stations)
    const elapsed = Date.now() - new Date(s.started_at).getTime()
    return acc + (elapsed / 3600000) * price
  }, 0)
  const totalOrdersCost = sessions.reduce((acc, s) => acc + getOrdersSubtotal(s.id), 0)
  const totalCost = totalGamingCost + totalOrdersCost

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>
      <nav style={{ width: '235px', background: '#1a1a2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '.75rem 0', position: 'fixed', height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '0.5rem 1.1rem 1rem', borderBottom: '1px solid #ffffff0f', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Yousif GC</div><div style={{ fontSize: '11px', color: '#8892a4' }}>Game Center</div></div>
        </div>
        {[['MAIN',0,7],['REPORTS',7,9],['SYSTEM',9,12]].map(([sec,from,to]) => (
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Active Sessions
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#065f46', background: '#d1fae5', borderRadius: '20px', padding: '3px 10px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                {sessions.length} Live
              </span>
            </h2>
            <button onClick={loadData} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
          </div>

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>⚡</span>
              <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Active</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{sessions.length}</div></div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>💰</span>
              <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Running Cost (incl. orders)</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{fmtIQD(totalCost)}</div></div>
            </div>
            {Object.entries(TYPE_INFO).map(([type, info]) => {
              const count = sessions.filter(s => s.stations?.type === type).length
              return (
                <div key={type} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '28px' }}>{info.icon}</span>
                  <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{info.label}</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b' }}>{count}</div></div>
                </div>
              )
            })}
          </div>

          {/* Active sessions grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>
          ) : sessions.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>💤</div>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>No active sessions right now</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Start a session from any station page to see it here live.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
              {sessions.map(s => {
                const st = s.stations
                const info = TYPE_INFO[st?.type] || { label: st?.type, icon: '❓', color: '#64748b' }
                const elapsed = Date.now() - new Date(s.started_at).getTime()
                const price = getPrice(st)
                const gamingCost = (elapsed / 3600000) * price
                const items = itemsBySession[s.id] || []
                const ordersSubtotal = getOrdersSubtotal(s.id)
                const total = gamingCost + ordersSubtotal
                return (
                  <div key={s.id} style={{ background: '#fff', border: `2px solid ${info.color}33`, borderLeft: `4px solid ${info.color}`, borderRadius: '12px', padding: '1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{info.icon} {st?.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{getCategoryLabel(st)}</div>
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#065f46', background: '#d1fae5', borderRadius: '20px', padding: '2px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span> Live
                      </div>
                    </div>

                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', marginBottom: '8px' }}>
                      {fmtTimer(elapsed)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', marginBottom: '10px' }}>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Customer</div>
                        <div style={{ color: '#1e293b', fontWeight: '600', marginTop: '2px' }}>{s.customer_name || 'Guest'}</div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Started</div>
                        <div style={{ color: '#1e293b', fontWeight: '600', marginTop: '2px' }}>{fmtStart(s.started_at)}</div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Rate</div>
                        <div style={{ color: '#1e293b', fontWeight: '600', marginTop: '2px' }}>{fmtIQD(price)}/hr</div>
                      </div>
                      <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' }}>Gaming Cost</div>
                        <div style={{ color: '#1e293b', fontWeight: '600', marginTop: '2px' }}>{fmtIQD(gamingCost)}</div>
                      </div>
                    </div>

                    {/* Attached orders */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>🧾 Orders {items.length > 0 && `(${items.length})`}</span>
                        <button onClick={() => setShowOrderModal(s)} style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', background: '#eef2ff', border: 'none', borderRadius: '20px', padding: '3px 10px', cursor: 'pointer' }}>+ Add Item</button>
                      </div>
                      {items.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {items.map(i => (
                            <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: '#f8fafc', borderRadius: '6px', padding: '4px 8px' }}>
                              <span style={{ flex: 1, color: '#1e293b', fontWeight: '600' }}>{i.name} ×{i.quantity}</span>
                              <span style={{ color: '#1e293b', fontWeight: '700' }}>{fmtIQD(i.price * i.quantity)}</span>
                              <button onClick={() => removeOrderItem(s.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '12px', padding: 0 }}>✕</button>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 8px', fontWeight: '700', color: '#6366f1' }}>
                            <span>Orders Subtotal</span><span>{fmtIQD(ordersSubtotal)}</span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '4px' }}>No items attached yet</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eef2ff', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
                      <span style={{ color: '#6366f1', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total So Far</span>
                      <span style={{ color: '#6366f1', fontWeight: '800', fontSize: '15px' }}>{fmtIQD(total)}</span>
                    </div>

                    <button onClick={() => router.push(
                      st?.type === 'ps' ? '/stations' :
                      st?.type === 'pc' ? '/pc' :
                      st?.type === 'billiards' ? '/billiards' : '/other'
                    )} style={{ width: '100%', padding: '7px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                      Manage / End Session →
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Order Modal */}
      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>🧾 Add Items — {showOrderModal.stations?.name}</span>
              <button onClick={() => setShowOrderModal(null)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
              {menuItems.map(m => (
                <div key={m.id} onClick={() => addOrderItem(showOrderModal.id, m)} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>{ICONS[m.category] || '📦'}</div>
                  <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: '600' }}>{m.name}</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#6366f1', marginTop: '2px' }}>{fmtIQD(m.price)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Current Items</div>
              {(itemsBySession[showOrderModal.id] || []).length === 0 ? (
                <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '8px' }}>No items yet — tap an item above to add</div>
              ) : (itemsBySession[showOrderModal.id] || []).map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: '#f8fafc', borderRadius: '8px', marginBottom: '5px' }}>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>{i.name} ×{i.quantity}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{fmtIQD(i.price * i.quantity)}</span>
                  <button onClick={() => removeOrderItem(showOrderModal.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '13px' }}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowOrderModal(null)} style={{ width: '100%', marginTop: '1rem', padding: '9px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}
