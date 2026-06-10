'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🖥️', label: 'PC Stations', path: '/pc' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other' },
  { icon: '🧾', label: 'Orders', path: '/orders' },
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu' },
  { icon: '👥', label: 'Users', path: '/users', active: true },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

export default function UsersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'staff' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'admin') { router.push('/dashboard'); return }
    setUser(parsed)
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  const saveUser = async () => {
    setError('')
    if (!form.name || !form.username || !form.password) { setError('All fields are required'); return }
    const { error: err } = await supabase.from('users').insert({ name: form.name, username: form.username, password: form.password, role: form.role })
    if (err) { setError('Username already exists'); return }
    setShowModal(false)
    setForm({ name: '', username: '', password: '', role: 'staff' })
    loadData()
  }

  const deleteUser = async (id) => {
    if (id === user?.id) { alert("You can't delete your own account!"); return }
    if (!confirm('Delete this user?')) return
    await supabase.from('users').delete().eq('id', id)
    loadData()
  }

  const signOut = async () => {
    if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    localStorage.removeItem('user'); router.push('/login')
  }

  const tdStyle = { padding: '11px 16px', borderBottom: '1px solid #e2e8f0', color: '#1e293b', verticalAlign: 'middle' }
  const thStyle = { textAlign: 'left', padding: '10px 16px', fontSize: '11px', fontWeight: '700', color: '#64748b', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textTransform: 'uppercase', letterSpacing: '.06em' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#f0f2f5' }}>
      <nav style={{ width: '235px', background: '#1a1a2e', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '.75rem 0', position: 'fixed', height: '100vh', zIndex: 100, overflowY: 'auto' }}>
        <div style={{ padding: '0.5rem 1.1rem 1rem', borderBottom: '1px solid #ffffff0f', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px' }}>🎮</span>
          <div><div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Yousif GC</div><div style={{ fontSize: '11px', color: '#8892a4' }}>Game Center</div></div>
        </div>
        {[['MAIN',0,6],['REPORTS',6,8],['SYSTEM',8,11]].map(([sec,from,to]) => (
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Staff Users 👥</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={loadData} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
              <button onClick={() => setShowModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>+ Add Staff</button>
            </div>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div> : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead><tr>
                  <th style={thStyle}>Name</th><th style={thStyle}>Username</th><th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th><th style={thStyle}>Last Login</th><th style={thStyle}>Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={tdStyle}><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>{u.name?.[0]?.toUpperCase()}</div><strong>{u.name}</strong></div></td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{u.username}</td>
                      <td style={tdStyle}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: u.role === 'admin' ? '#eef2ff' : '#dbeafe', color: u.role === 'admin' ? '#6366f1' : '#1e40af' }}>{u.role}</span></td>
                      <td style={tdStyle}><span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: u.status === 'online' ? '#d1fae5' : '#f1f5f9', color: u.status === 'online' ? '#065f46' : '#64748b' }}>● {u.status}</span></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{u.last_login ? new Date(u.last_login).toLocaleString('en-GB') : 'Never'}</td>
                      <td style={tdStyle}>{u.id !== user?.id && <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 10px', border: '1px solid #fee2e2', borderRadius: '7px', background: '#fee2e2', cursor: 'pointer', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>🗑 Delete</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Add Staff Member</span>
              <button onClick={() => setShowModal(false)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            {error && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>❌ {error}</div>}
            {[['Full Name','text','name','e.g. Ahmed Ali'],['Username','text','username','e.g. ahmed'],['Password','password','password','••••••']].map(([label,type,key,ph]) => (
              <div key={key} style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={ph} style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Role</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px' }}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={saveUser} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ Add Staff</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
