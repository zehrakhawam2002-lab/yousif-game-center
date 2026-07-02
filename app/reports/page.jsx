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
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports', active: true },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState({ currency: 'IQD' })
  const [stats, setStats] = useState({ totalIncome: 0, gamingIncome: 0, ordersIncome: 0, totalHours: 0, totalSessions: 0, totalOrders: 0 })
  const [byDevice, setByDevice] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData('today')
  }, [])

  const getDateFilter = (p) => {
    const now = new Date()
    if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    if (p === 'week') return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    return new Date(0).toISOString()
  }

  const loadData = async (p) => {
    setLoading(true); setPeriod(p)
    const from = getDateFilter(p)
    const { data: sessions } = await supabase.from('sessions').select('*, stations(name, type)').eq('status', 'ended').gte('ended_at', from)
    const { data: orders } = await supabase.from('orders').select('total').gte('created_at', from)
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (cfg) setSettings(cfg)
    const gamingIncome = (sessions || []).reduce((a, s) => a + (s.total || 0), 0)
    const ordersIncome = (orders || []).reduce((a, o) => a + (o.total || 0), 0)
    const totalHours = (sessions || []).reduce((a, s) => a + (s.duration_minutes || 0) / 60, 0)
    setStats({ totalIncome: gamingIncome + ordersIncome, gamingIncome, ordersIncome, totalHours, totalSessions: (sessions || []).length, totalOrders: (orders || []).length })
    const deviceMap = {}
    ;(sessions || []).forEach(s => {
      const key = s.stations?.name || 'Unknown'
      if (!deviceMap[key]) deviceMap[key] = { name: key, type: s.stations?.type, hours: 0, income: 0, sessions: 0 }
      deviceMap[key].hours += (s.duration_minutes || 0) / 60
      deviceMap[key].income += s.total || 0
      deviceMap[key].sessions++
    })
    setByDevice(Object.values(deviceMap).sort((a, b) => b.income - a.income))
    const catMap = { ps: 0, pc: 0, billiards: 0, other: 0, orders: ordersIncome }
    ;(sessions || []).forEach(s => { if (s.stations?.type) catMap[s.stations.type] = (catMap[s.stations.type] || 0) + (s.total || 0) })
    const grand = Object.values(catMap).reduce((a, v) => a + v, 0) || 1
    setByCategory([
      { label: '🎮 PS Stations', income: catMap.ps, pct: Math.round(catMap.ps / grand * 100) },
      { label: '🖥️ PC Stations', income: catMap.pc, pct: Math.round(catMap.pc / grand * 100) },
      { label: '🎱 Billiards', income: catMap.billiards, pct: Math.round(catMap.billiards / grand * 100) },
      { label: '🕹️ Other Games', income: catMap.other, pct: Math.round(catMap.other / grand * 100) },
      { label: '🧾 Orders', income: catMap.orders, pct: Math.round(catMap.orders / grand * 100) },
    ])
    setLoading(false)
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Income Report 📈</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['today','Today'],['week','This Week'],['month','This Month'],['all','All Time']].map(([p,l]) => (
                <button key={p} onClick={() => loadData(p)} style={{ padding: '6px 12px', borderRadius: '8px', border: period===p ? '1px solid #6366f1' : '1px solid #e2e8f0', background: period===p ? '#6366f1' : '#fff', color: period===p ? '#fff' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{l}</button>
              ))}
            </div>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div> : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '1.5rem' }}>
                {[{icon:'💰',label:'Total Income',value:fmtIQD(stats.totalIncome)},{icon:'🎮',label:'Gaming Income',value:fmtIQD(stats.gamingIncome)},{icon:'🧾',label:'Orders Income',value:fmtIQD(stats.ordersIncome)},{icon:'⏱️',label:'Total Hours',value:stats.totalHours.toFixed(1)+'h'},{icon:'🎯',label:'Sessions',value:stats.totalSessions},{icon:'📦',label:'Orders',value:stats.totalOrders}].map(s => (
                  <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '28px' }}>{s.icon}</span>
                    <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{s.label}</div><div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>{s.value}</div></div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>By Device</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr><th style={thStyle}>Device</th><th style={thStyle}>Hours</th><th style={thStyle}>Sessions</th><th style={thStyle}>Income</th></tr></thead>
                    <tbody>{byDevice.length ? byDevice.map(d => (<tr key={d.name}><td style={tdStyle}><strong>{d.name}</strong><br/><span style={{ fontSize: '10px', background: '#eef2ff', color: '#6366f1', padding: '1px 7px', borderRadius: '10px', fontWeight: '700' }}>{d.type?.toUpperCase()}</span></td><td style={tdStyle}>{d.hours.toFixed(1)}h</td><td style={tdStyle}>{d.sessions}</td><td style={{ ...tdStyle, fontWeight: '700', color: '#6366f1' }}>{fmtIQD(d.income)}</td></tr>)) : <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No data yet</td></tr>}</tbody>
                  </table>
                </div>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>By Category</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead><tr><th style={thStyle}>Category</th><th style={thStyle}>Income</th><th style={thStyle}>%</th></tr></thead>
                    <tbody>{byCategory.map(c => (<tr key={c.label}><td style={tdStyle}>{c.label}</td><td style={{ ...tdStyle, fontWeight: '700' }}>{fmtIQD(c.income)}</td><td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ flex: 1, height: '6px', background: '#f0f2f5', borderRadius: '3px' }}><div style={{ width: `${c.pct}%`, height: '100%', background: '#6366f1', borderRadius: '3px' }}></div></div><span style={{ fontSize: '12px', fontWeight: '600', minWidth: '30px' }}>{c.pct}%</span></div></td></tr>))}</tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
