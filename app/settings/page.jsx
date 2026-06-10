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
  { icon: '👥', label: 'Users', path: '/users' },
  { icon: '⚙️', label: 'Settings', path: '/settings', active: true },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ center_name: '', center_code: '', branch_name: '', currency: 'IQD', price_ps: 3000, price_pc: 2500, price_billiards_single: 4000, price_billiards_double: 6000, price_pool: 5000, price_foosball: 3000, price_chips: 3000 })
  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' })
  const [saved, setSaved] = useState(false)
  const [passError, setPassError] = useState('')
  const [passSaved, setPassSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = localStorage.getItem('user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'admin') { router.push('/dashboard'); return }
    setUser(parsed)
    loadData()
  }, [])

  const loadData = async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single()
    if (data) setForm(data)
    setLoading(false)
  }

  const saveSettings = async () => {
    await supabase.from('settings').update({
      center_name: form.center_name,
      center_code: form.center_code,
      branch_name: form.branch_name,
      currency: form.currency,
      price_ps: parseInt(form.price_ps),
      price_pc: parseInt(form.price_pc),
      price_billiards_single: parseInt(form.price_billiards_single),
      price_billiards_double: parseInt(form.price_billiards_double),
      price_pool: parseInt(form.price_pool),
      price_foosball: parseInt(form.price_foosball),
      price_chips: parseInt(form.price_chips),
      updated_at: new Date().toISOString()
    }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const savePassword = async () => {
    setPassError('')
    if (!passForm.newPass) { setPassError('Enter a new password'); return }
    if (passForm.newPass !== passForm.confirmPass) { setPassError('Passwords do not match'); return }
    await supabase.from('users').update({ password: passForm.newPass }).eq('id', user.id)
    setPassForm({ newPass: '', confirmPass: '' })
    setPassSaved(true)
    setTimeout(() => setPassSaved(false), 3000)
  }

  const signOut = async () => {
    if (user) await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    localStorage.removeItem('user'); router.push('/login')
  }

  const Section = ({ title, children }) => (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '14px' }}>
      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', paddingBottom: '.75rem', borderBottom: '1px solid #e2e8f0' }}>{title}</div>
      {children}
    </div>
  )

  const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', padding: '9px 11px', border: '1px solid #cbd5e1', borderRadius: '9px', fontSize: '13px', boxSizing: 'border-box', background: '#f8fafc', color: '#1e293b' }} />
    </div>
  )

  const PriceRow = ({ label, sub, valueKey }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '8px' }}>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input type="number" value={form[valueKey]} onChange={e => setForm({...form, [valueKey]: e.target.value})} style={{ width: '110px', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }} />
        <span style={{ fontSize: '12px', color: '#64748b' }}>IQD/hr</span>
      </div>
    </div>
  )

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'system-ui' }}>Loading...</div>

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

        <div style={{ padding: '1.5rem', maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Settings ⚙️</h2>
            <button onClick={saveSettings} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>💾 Save Settings</button>
          </div>

          {saved && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem', color: '#065f46', fontWeight: '600' }}>✅ Settings saved successfully!</div>}

          <Section title="🏢 Center Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Field label="Center Name" value={form.center_name || ''} onChange={e => setForm({...form, center_name: e.target.value})} placeholder="Yousif Game Center" />
              <Field label="Center Code" value={form.center_code || ''} onChange={e => setForm({...form, center_code: e.target.value})} placeholder="YGC-2024" />
              <Field label="Branch Name" value={form.branch_name || ''} onChange={e => setForm({...form, branch_name: e.target.value})} placeholder="Main Hall" />
              <Field label="Currency" value={form.currency || ''} onChange={e => setForm({...form, currency: e.target.value})} placeholder="IQD" />
            </div>
          </Section>

          <Section title="💰 Prices per Hour (IQD)">
            <PriceRow label="🎮 PS Station" sub="Per hour per station" valueKey="price_ps" />
            <PriceRow label="🖥️ PC Station" sub="Per hour per PC" valueKey="price_pc" />
            <PriceRow label="🎱 Billiards — Single" sub="1 player per hour" valueKey="price_billiards_single" />
            <PriceRow label="🎱 Billiards — Double" sub="2 players per hour" valueKey="price_billiards_double" />
            <PriceRow label="🎯 Billiard Table" sub="Per hour" valueKey="price_pool" />
            <PriceRow label="⚽ Foosball" sub="Per hour" valueKey="price_foosball" />
            <PriceRow label="🎰 Chips Game" sub="Per hour" valueKey="price_chips" />
          </Section>

          <Section title="🔐 Change Password">
            {passError && <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#991b1b', marginBottom: '12px' }}>❌ {passError}</div>}
            {passSaved && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#065f46', marginBottom: '12px' }}>✅ Password updated!</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Field label="New Password" type="password" value={passForm.newPass} onChange={e => setPassForm({...passForm, newPass: e.target.value})} placeholder="••••••" />
              <Field label="Confirm Password" type="password" value={passForm.confirmPass} onChange={e => setPassForm({...passForm, confirmPass: e.target.value})} placeholder="••••••" />
            </div>
            <button onClick={savePassword} style={{ padding: '8px 18px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🔐 Update Password</button>
          </Section>
        </div>
      </div>
    </div>
  )
}
