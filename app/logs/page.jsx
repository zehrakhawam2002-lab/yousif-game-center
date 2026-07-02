'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🔴', label: 'Active Sessions', path: '/active' },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🖥️', label: 'PC Stations', path: '/pc' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other' },
  { icon: '🧾', label: 'Orders', path: '/orders' },
  { icon: '📋', label: 'Logs', path: '/logs', active: true },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

export default function LogsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [orders, setOrders] = useState([])
  const [settings, setSettings] = useState({ currency: 'IQD' })
  const [tab, setTab] = useState('sessions')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data: s } = await supabase.from('sessions').select('*, stations(name, type)').eq('status', 'ended').order('ended_at', { ascending: false }).limit(100)
    const { data: o } = await supabase.from('orders').select('*, order_items(name, price, quantity)').order('created_at', { ascending: false }).limit(100)
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    setSessions(s || []); setOrders(o || [])
    if (cfg) setSettings(cfg)
    setLoading(false)
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency
  const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-GB') : '—'
  const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'
  const fmtDur = mins => mins ? `${Math.floor(mins/60)}h ${Math.round(mins%60)}m` : '—'
  const signOut = async () => { if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id); localStorage.removeItem('user'); router.push('/login') }
  const tdStyle = { padding: '11px 16px', borderBottom: '1px solid #e2e8f0', color: '#1e293b', verticalAlign: 'middle' }
  const thStyle = { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textTransform: 'uppercase', letterSpacing: '.06em' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>
      <nav style={{ width: '235px', background: '#1a1a2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '.75rem 0', position: 'fixed', height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '0.5rem 1.1rem 1rem', borderBottom: '1px solid #ffffff0f', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Novixiq GC</div><div style={{ fontSize: '11px', color: '#8892a4' }}>Game Center</div></div>
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
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>🎮 Novixiq Game Center System</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: '#64748b', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '4px 12px' }}>Main Hall</div>
            <button onClick={signOut} style={{ fontSize: '12px', color: '#991b1b', cursor: 'pointer', padding: '5px 10px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fee2e2', fontWeight: '600' }}>✕ Sign out</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Logs 📋</h2>
            <button onClick={loadData} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
            {[['sessions','🎮 Sessions'],['orders','🧾 Orders']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: '8px', border: tab===t ? '1px solid #6366f1' : '1px solid #e2e8f0', background: tab===t ? '#6366f1' : '#fff', color: tab===t ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div> : tab === 'sessions' ? (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr><th style={thStyle}>Date / Time</th><th style={thStyle}>Device</th><th style={thStyle}>Customer</th><th style={thStyle}>Duration</th><th style={thStyle}>Gaming</th><th style={thStyle}>Orders</th><th style={thStyle}>Discount</th><th style={thStyle}>Total</th></tr></thead>
                <tbody>
                  {sessions.length ? sessions.map(s => (
                    <tr key={s.id}><td style={tdStyle}><div style={{ fontSize: '12px', fontWeight: '600' }}>{fmtTime(s.ended_at)}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(s.ended_at)}</div></td><td style={tdStyle}><strong>{s.stations?.name}</strong><br/><span style={{ fontSize: '10px', background: '#eef2ff', color: '#6366f1', padding: '1px 7px', borderRadius: '10px', fontWeight: '700' }}>{s.stations?.type?.toUpperCase()}</span></td><td style={tdStyle}>{s.customer_name}</td><td style={tdStyle}>{fmtDur(s.duration_minutes)}</td><td style={tdStyle}>{fmtIQD(s.gaming_cost || 0)}</td><td style={tdStyle}>{fmtIQD(s.orders_total || 0)}</td><td style={tdStyle}>{s.discount_percent ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{s.discount_percent}%</span> : '—'}</td><td style={{ ...tdStyle, fontWeight: '700', color: '#6366f1' }}>{fmtIQD(s.total || 0)}</td></tr>
                  )) : <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No sessions yet</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr><th style={thStyle}>Date / Time</th><th style={thStyle}>Items</th><th style={thStyle}>Subtotal</th><th style={thStyle}>Discount</th><th style={thStyle}>Total</th></tr></thead>
                <tbody>
                  {orders.length ? orders.map(o => (
                    <tr key={o.id}><td style={tdStyle}><div style={{ fontSize: '12px', fontWeight: '600' }}>{fmtTime(o.created_at)}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(o.created_at)}</div></td><td style={tdStyle}>{(o.order_items || []).map(i => `${i.name} ×${i.quantity}`).join(', ') || '—'}</td><td style={tdStyle}>{fmtIQD(o.subtotal || 0)}</td><td style={tdStyle}>{o.discount_percent ? <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{o.discount_percent}%</span> : '—'}</td><td style={{ ...tdStyle, fontWeight: '700', color: '#6366f1' }}>{fmtIQD(o.total || 0)}</td></tr>
                  )) : <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
