'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [lang, setLang] = useState(null)
  const [step, setStep] = useState(0)
  const [code, setCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [centerName, setCenterName] = useState('')

  const checkCode = async () => {
    setError('')
    const { data } = await supabase.from('settings').select('center_name, center_code').eq('id', 1).single()
    if (!data) { setError('Could not connect to database'); return }
    if (code === '' || code === data.center_code) {
      setCenterName(data.center_name)
      setStep(1)
    } else {
      setError('Invalid center code. Try: ' + data.center_code)
    }
  }

  const doLogin = async () => {
    setError('')
    const { data } = await supabase.from('users').select('*').eq('username', username).eq('password', password).single()
    if (!data) { setError('Wrong username or password'); return }
    await supabase.from('users').update({ status: 'online', last_login: new Date().toISOString() }).eq('id', data.id)
    localStorage.setItem('user', JSON.stringify(data))
    router.push('/dashboard')
  }

  if (!lang) return (
    <div style={{minHeight:'100vh',background:'#1a1a2e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
        <div style={{fontSize:'52px',marginBottom:'12px'}}>🎮</div>
        <h1 style={{fontSize:'26px',fontWeight:'700',color:'#fff'}}>Novixiq Game Center System</h1>
        <p style={{color:'#8892a4',fontSize:'14px',marginTop:'4px'}}>Select your language</p>
      </div>
      {[['en','🇬🇧','English'],['ar','🇮🇶','العربية'],['ku','🏔','کوردی']].map(([l,flag,label])=>(
        <div key={l} onClick={()=>setLang(l)} style={{background:'#ffffff12',border:'1px solid #ffffff20',borderRadius:'12px',padding:'14px 20px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',color:'#fff',fontSize:'15px',fontWeight:'500',marginBottom:'10px',width:'300px'}}>
          <span style={{fontSize:'24px'}}>{flag}</span> {label}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f0f2f5',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}} dir={lang==='ar'||lang==='ku'?'rtl':'ltr'}>
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'16px',padding:'2rem',width:'100%',maxWidth:'390px'}}>
        <div style={{textAlign:'center',marginBottom:'1.75rem'}}>
          <div style={{fontSize:'36px',marginBottom:'8px'}}>🎮</div>
          <h2 style={{fontSize:'20px',fontWeight:'700',color:'#1e293b'}}>Welcome back</h2>
          <p style={{fontSize:'13px',color:'#64748b',marginTop:'3px'}}>Sign in to your dashboard</p>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',marginBottom:'1.5rem'}}>
          {[0,1].map(i=>(<div key={i} style={{width:i===step?'24px':'8px',height:'8px',borderRadius:i===step?'4px':'50%',background:i<step?'#10b981':i===step?'#6366f1':'#cbd5e1',transition:'all .3s'}}/>))}
        </div>
        {error && <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'8px',padding:'8px 12px',fontSize:'12px',color:'#991b1b',marginBottom:'12px'}}>❌ {error}</div>}
        {step===0 ? (
          <>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'5px',display:'block',textTransform:'uppercase'}}>🏢 Center Code</label>
              <input value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&checkCode()} placeholder="e.g. NGC-2024" style={{width:'100%',padding:'10px 11px',border:'1px solid #cbd5e1',borderRadius:'10px',fontSize:'14px',background:'#f0f2f5',color:'#1e293b',boxSizing:'border-box'}}/>
              <div style={{fontSize:'11px',color:'#94a3b8',marginTop:'4px'}}>Leave empty if you are a platform admin</div>
            </div>
            <button onClick={checkCode} style={{width:'100%',background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'11px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Continue →</button>
            <div onClick={()=>setLang(null)} style={{textAlign:'center',marginTop:'1rem',fontSize:'12px',color:'#94a3b8',cursor:'pointer'}}>← Change language</div>
          </>
        ) : (
          <>
            <div style={{background:'#d1fae5',border:'1px solid #6ee7b7',borderRadius:'10px',padding:'10px 14px',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'10px'}}>
              <span style={{fontSize:'18px'}}>✅</span>
              <div>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#065f46'}}>{centerName}</div>
                <div style={{fontSize:'11px',color:'#065f46',opacity:.8}}>Center verified</div>
              </div>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'5px',display:'block',textTransform:'uppercase'}}>👤 Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" style={{width:'100%',padding:'10px 11px',border:'1px solid #cbd5e1',borderRadius:'10px',fontSize:'14px',background:'#f0f2f5',color:'#1e293b',boxSizing:'border-box'}}/>
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label style={{fontSize:'12px',color:'#64748b',fontWeight:'700',marginBottom:'5px',display:'block',textTransform:'uppercase'}}>🔒 Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()} placeholder="••••••" style={{width:'100%',padding:'10px 11px',border:'1px solid #cbd5e1',borderRadius:'10px',fontSize:'14px',background:'#f0f2f5',color:'#1e293b',boxSizing:'border-box'}}/>
            </div>
            <button onClick={doLogin} style={{width:'100%',background:'#6366f1',color:'#fff',border:'none',borderRadius:'10px',padding:'11px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>Sign In →</button>
            <div onClick={()=>setStep(0)} style={{textAlign:'center',marginTop:'1rem',fontSize:'12px',color:'#94a3b8',cursor:'pointer'}}>← Back to code</div>
          </>
        )}
      </div>
    </div>
  )
}
