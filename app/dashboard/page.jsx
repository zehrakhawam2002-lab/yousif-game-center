'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard', active: true },
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

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({ active: 0, income: 0, psIncome: 0, ordersIncome: 0 })
  const [sessions, setSessions] = useState([])
  const [logs, setLogs] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: activeSessions } = await supabase.from('sessions').select('*, stations(name, type)').eq('status', 'active')
    setSessions(activeSessions || [])
    const today = new Date().toISOString().split('T')[0]
    const { data: endedToday } = await supabase.from('sessions').select('total, stations(type)').eq('status', 'ended').gte('ended_at', today)
    const { data: ordersToday } = await supabase.from('orders').select('total').gte('created_at', today)
    const totalIncome = (endedToday||[]).reduce((a,s)=>a+s.total,0) + (ordersToday||[]).reduce((a,o)=>a+o.total,0)
    const psIncome = (endedToday||[]).filter(s=>s.stations?.type==='ps').reduce((a,s)=>a+s.total,0)
    const ordersIncome = (ordersToday||[]).reduce((a,o)=>a+o.total,0)
    setStats({ active: (activeSessions||[]).length, income: totalIncome, psIncome, ordersIncome })
    const { data: recentLogs } = await supabase.from('sessions').select('*, stations(name)').eq('status','ended').order('ended_at',{ascending:false}).limit(5)
    setLogs(recentLogs||[])
  }

  const signOut = async () => {
    if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    localStorage.removeItem('user'); router.push('/login')
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' IQD'
  const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}) : '—'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <nav style={{ width: sidebarOpen?'235px':'0', background: '#1a1a2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: sidebarOpen?'.75rem 0':'0', overflow: 'hidden', transition: 'width .2s', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '0.5rem 1.1rem 1rem', borderBottom: '1px solid #ffffff0f', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap' }}>Yousif GC</div><div style={{ fontSize: '11px', color: '#8892a4', whiteSpace: 'nowrap' }}>Game Center</div></div>
        </div>
        {[['MAIN',0,5],['REPORTS',5,7],['SYSTEM',7,10]].map(([sec,from,to]) => (
          <div key={sec}>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '.12em', color: '#4a5568', padding: '.75rem 1.1rem .3rem', textTransform: 'uppercase' }}>{sec}</div>
            {NAV.slice(from,to).map(item => (
              <div key={item.path} onClick={() => router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 1.1rem', fontSize: '13px', color: item.active?'#fff':'#8892a4', cursor: 'pointer', borderLeft: item.active?'3px solid #6366f1':'3px solid transparent', background: item.active?'#ffffff0f':'transparent', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '16px', width: '22px', textAlign: 'center' }}>{item.icon}</span><span>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '.75rem 1.1rem', borderTop: '1px solid #ffffff0f', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase()}</div>
          <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap' }}>{user?.name}</div><div style={{ fontSize: '11px', color: '#8892a4', whiteSpace: 'nowrap' }}>{user?.role}</div></div>
        </div>
      </nav>
      <div style={{ marginLeft: sidebarOpen?'235px':'0', flex: 1, transition: 'margin .2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem 1.25rem', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 90 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>☰</button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>🎮 Yousif Game Center</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#64748b', background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '4px 12px', fontWeight: '500' }}>Main Hall</div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase()}</div>
            <button onClick={signOut} style={{ fontSize: '12px', color: '#991b1b', cursor: 'pointer', padding: '5px 10px', border: '1px solid #fee2e2', borderRadius: '8px', background: '#fee2e2', fontWeight: '600' }}>✕ Sign out</button>
          </div>
        </div>
        <div style={{ padding: '1.5rem', background: '#f0f2f5', minHeight: 'calc(100vh - 53px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Dashboard 👋</h2>
            <button onClick={loadStats} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '1.5rem' }}>
            {[{icon:'⚡',label:'Active Sessions',value:stats.active,sub:'devices running'},{icon:'💰',label:"Today's Income",value:fmtIQD(stats.income),sub:'IQD'},{icon:'🎮',label:'PS Income',value:fmtIQD(stats.psIncome),sub:'IQD'},{icon:'🧾',label:'Orders Income',value:fmtIQD(stats.ordersIncome),sub:'IQD'}].map(s=>(
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '28px' }}>{s.icon}</span>
                <div><div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{s.label}</div><div style={{ fontSize: '22px', fontWeight: '700', color: '#1e293b', margin: '2px 0' }}>{s.value}</div><div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.sub}</div></div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Active Sessions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr>{['Device','Type','Customer'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',fontSize:'11px',fontWeight:'700',color:'#64748b',borderBottom:'1px solid #e2e8f0',background:'#f8fafc',textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>{sessions.length?sessions.map(s=><tr key={s.id}><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0',color:'#1e293b'}}><strong>{s.stations?.name}</strong></td><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0'}}><span style={{background:'#d1fae5',color:'#065f46',fontSize:'10px',padding:'3px 9px',borderRadius:'20px',fontWeight:'700'}}>{s.stations?.type?.toUpperCase()}</span></td><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0',color:'#64748b'}}>{s.customer_name}</td></tr>):<tr><td colSpan={3} style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>No active sessions</td></tr>}</tbody>
              </table>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Recent Sessions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr>{['Device','Total','Time'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',fontSize:'11px',fontWeight:'700',color:'#64748b',borderBottom:'1px solid #e2e8f0',background:'#f8fafc',textTransform:'uppercase' }}>{h}</th>)}</tr></thead>
                <tbody>{logs.length?logs.map(l=><tr key={l.id}><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0',color:'#1e293b'}}>{l.stations?.name}</td><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0',fontWeight:'700',color:'#1e293b'}}>{fmtIQD(l.total)}</td><td style={{padding:'11px 16px',borderBottom:'1px solid #e2e8f0',fontSize:'11px',color:'#94a3b8'}}>{fmtTime(l.ended_at)}</td></tr>):<tr><td colSpan={3} style={{textAlign:'center',color:'#94a3b8',padding:'2rem'}}>No logs yet</td></tr>}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

