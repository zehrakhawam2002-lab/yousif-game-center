'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard' },
  { icon: '🎮', label: 'PS Stations', path: '/stations' },
  { icon: '🎱', label: 'Billiards', path: '/billiards' },
  { icon: '🕹️', label: 'Other Games', path: '/other' },
  { icon: '🧾', label: 'Orders', path: '/orders' },
  { icon: '📋', label: 'Logs', path: '/logs' },
  { icon: '📈', label: 'Reports', path: '/reports' },
  { icon: '🛒', label: 'Menu Items', path: '/menu', active: true },
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
]

const ICONS = { drink: '🥤', food: '🍿', hookah: '💨', other: '📦' }
const CATS = ['drink', 'food', 'hookah', 'other']

export default function MenuPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [settings, setSettings] = useState({ currency: 'IQD' })
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'drink', price: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const { data } = await supabase.from('menu_items').select('*').order('category').order('name')
    const { data: cfg } = await supabase.from('settings').select('*').eq('id', 1).single()
    setItems(data || [])
    if (cfg) setSettings(cfg)
    setLoading(false)
  }

  const fmtIQD = n => Math.round(n).toLocaleString() + ' ' + settings.currency

  const openAdd = () => {
    setEditItem(null)
    setForm({ name: '', category: 'drink', price: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, category: item.category, price: item.price })
    setShowModal(true)
  }

  const saveItem = async () => {
    if (!form.name || !form.price) return
    if (editItem) {
      await supabase.from('menu_items').update({ name: form.name, category: form.category, price: parseInt(form.price) }).eq('id', editItem.id)
    } else {
      await supabase.from('menu_items').insert({ name: form.name, category: form.category, price: parseInt(form.price) })
    }
    setShowModal(false)
    loadData()
  }

  const toggleAvailable = async (item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    loadData()
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('menu_items').delete().eq('id', id)
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Menu Items 🛒</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={loadData} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>↻ Refresh</button>
              <button onClick={openAdd} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>+ Add Item</button>
            </div>
          </div>

          {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div> : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Price</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length ? items.map(item => (
                    <tr key={item.id}>
                      <td style={tdStyle}>
                        <span style={{ fontSize: '18px', marginRight: '8px' }}>{ICONS[item.category] || '📦'}</span>
                        <strong>{item.name}</strong>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ background: '#eef2ff', color: '#6366f1', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize' }}>{item.category}</span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '700', color: '#6366f1' }}>{fmtIQD(item.price)}</td>
                      <td style={tdStyle}>
                        <button onClick={() => toggleAvailable(item)} style={{ padding: '3px 10px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700', background: item.is_available ? '#d1fae5' : '#fee2e2', color: item.is_available ? '#065f46' : '#991b1b' }}>
                          {item.is_available ? '✅ Available' : '❌ Unavailable'}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => openEdit(item)} style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '7px', background: '#fff', cursor: 'pointer', fontSize: '12px', color: '#6366f1', fontWeight: '600' }}>✏️ Edit</button>
                          <button onClick={() => deleteItem(item.id)} style={{ padding: '4px 10px', border: '1px solid #fee2e2', borderRadius: '7px', background: '#fee2e2', cursor: 'pointer', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>No menu items yet</td></tr>
                  )}
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
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{editItem ? '✏️ Edit Item' : '+ Add Menu Item'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: '#f0f2f5', border: '1px solid #e2e8f0', borderRadius: '8px', width: '30px', height: '30px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Name</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Pepsi" style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px' }}>
                {CATS.map(c => <option key={c} value={c}>{ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase' }}>Price (IQD)</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 1500" style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={saveItem} style={{ padding: '6px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✓ {editItem ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
