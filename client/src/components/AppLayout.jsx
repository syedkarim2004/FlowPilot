import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AddTaskModal from './AddTaskModal';

const FlowPilotLogo = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect width="24" height="24" rx="6" fill="#0D63F8" />
    <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
    <circle cx="12" cy="12" r="2" fill="#0D63F8" />
    <path d="M12 5 L12 9 M12 15 L12 19 M5 12 L9 12 M15 12 L19 12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NAV = [
  { group:'WORKSPACE', items:[
    { to:'/dashboard', label:'Dashboard', icon:'⊞' },
    { to:'/tasks',     label:'Active Tasks',  icon:'✓', showBadge:true },
    { to:'/calendar',  label:'Calendar',  icon:'⊡' },
    { to:'/goals',     label:'Goals & Habits', icon:'◎' },
    { to:'/telegram',  label:'Telegram Companion', icon:'✉' },
  ]},
  { group:'INTELLIGENCE', items:[
    { to:'/analytics', label:'Analytics',         icon:'↑' },
    { to:'/coach',     label:'Productivity Twin',  icon:'◉' },
    { to:'/chat',      label:'AI Agent',           icon:'✦', badge:'AI' },
  ]},
  { group:'SETTINGS', items:[
    { to:'/settings', label:'Preferences', icon:'⚙' },
  ]},
];

export default function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('status', '!=', 'completed')
    );
    const unsub = onSnapshot(q, snap => setActiveCount(snap.size), ()=>{});
    return unsub;
  }, [user]);

  function handleSearch(e) {
    e.preventDefault();
    const v = searchVal.trim();
    if (v) { navigate(`/tasks?q=${encodeURIComponent(v)}`); setSearchVal(''); }
  }

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.to;
    return (
      <NavLink to={item.to}
        style={({ isActive:a }) => ({
          display:'flex', alignItems:'center', gap:12,
          height:42, padding:'0 14px', borderRadius:8,
          textDecoration:'none', fontSize:14,
          fontWeight: a ? 600 : 500,
          color: a ? 'var(--blue)' : 'var(--text-2)',
          background: a ? 'var(--blue-light)' : 'transparent',
          marginBottom:4, transition:'all .15s',
          position: 'relative',
        })}
        className={isActive ? '' : 'hover:bg-surface-2'}
        onClick={() => setMenuOpen(false)}
      >
        <span style={{fontSize:16, width:20, textAlign:'center', flexShrink:0, opacity:.85}}>{item.icon}</span>
        <span style={{flex:1}}>{item.label}</span>
        {item.showBadge && activeCount > 0 && (
          <span style={{fontSize:11,background:'var(--blue)',color:'white',borderRadius:10,padding:'0 6px',minWidth:18,textAlign:'center'}}>
            {activeCount}
          </span>
        )}
        {item.badge === 'AI' && (
          <span style={{fontSize:9,fontWeight:700,background:'var(--blue)',color:'white',borderRadius:4,padding:'1px 5px',letterSpacing:.5}}>AI</span>
        )}
        {isActive && (
          <div style={{
            position: 'absolute', right: 0, top: '10px', bottom: '10px',
            width: '4px', background: 'var(--blue)', borderRadius: '2px 0 0 2px'
          }} />
        )}
      </NavLink>
    );
  };

  const SidebarBody = () => (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:'#FFFFFF'}}>
      {/* Brand Header */}
      <div style={{padding:'20px 20px 14px',display:'flex',alignItems:'center',gap:10}}>
        <FlowPilotLogo size={28}/>
        <div>
          <div style={{fontSize:16,fontWeight:700,color:'var(--text-1)',lineHeight:1.1,letterSpacing:'-0.3px'}}>FlowPilot</div>
          <div style={{fontSize:10,color:'var(--text-3)',fontWeight:600,marginTop:2,letterSpacing:.5}}>AI OS V2.0</div>
        </div>
      </div>

      {/* + New Initiative Trigger Button */}
      <div style={{padding:'8px 16px 16px'}}>
        <button className="g-btn g-btn-primary" style={{width:'100%',justifyContent:'center',borderRadius:10,height:40}}
          onClick={()=>{ setShowAddTask(true); setMenuOpen(false); }}>
          <span style={{fontSize:18,lineHeight:1,marginRight:6,marginTop:-1}}>+</span> New Initiative
        </button>
      </div>

      {/* Navigation Groups */}
      <nav style={{flex:1,overflowY:'auto',padding:'0 10px'}}>
        {NAV.map(group => (
          <div key={group.group} style={{marginBottom:16}}>
            <div className="g-label" style={{padding:'6px 14px 6px',fontSize:10,fontWeight:700}}>{group.group}</div>
            {group.items.map(item => <NavItem key={item.to} item={item}/>)}
          </div>
        ))}
      </nav>

      {/* User Footer Account Area */}
      <div style={{padding:'14px 20px',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',gap:10}}>
        {user?.photoURL
          ? <img src={user.photoURL} alt="avatar" style={{width:32,height:32,borderRadius:'50%',flexShrink:0}}/>
          : <div style={{width:32,height:32,borderRadius:'50%',background:'var(--blue-light)',color:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,flexShrink:0}}>{user?.displayName?.[0]||user?.email?.[0]?.toUpperCase()||'U'}</div>
        }
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--text-1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.displayName||user?.email?.split('@')[0]}</div>
          <div style={{fontSize:11,color:'var(--text-3)',fontWeight:500}}>System Online</div>
        </div>
        <button title="Sign out" onClick={async()=>{ await signOut(auth); navigate('/login'); }}
          style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:16,padding:4,flexShrink:0}} className="hover:text-danger">⏻</button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg)'}}>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--blue)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
    </div>
  );

  return (
    <div style={{display:'flex',height:'100vh',width:'100vw',overflow:'hidden',background:'var(--bg-gradient)'}}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hide-mobile" style={{
        width:230, flexShrink:0, height:'100vh',
        background:'#FFFFFF', borderRight:'1px solid var(--border)',
        overflowY:'auto', position:'relative',
      }}>
        <SidebarBody/>
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {menuOpen && (
        <div style={{position:'fixed',inset:0,zIndex:300}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:'absolute',inset:0,background:'rgba(15,23,42,0.4)',backdropFilter:'blur(4px)'}}/>
          <aside style={{
            position:'absolute',top:0,left:0,bottom:0,width:264,
            background:'#FFFFFF',boxShadow:'var(--shadow-3)',
          }} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'flex-end',padding:'10px 12px'}}>
              <button onClick={()=>setMenuOpen(false)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--text-2)'}}>✕</button>
            </div>
            <SidebarBody/>
          </aside>
        </div>
      )}

      {/* ── MAIN WORKSPACE ── */}
      <div style={{flex:1,minWidth:0,height:'100vh',display:'flex',flexDirection:'column',overflowY:'auto'}}>

        {/* TOP HEADER */}
        <header style={{
          height:58, flexShrink:0, background:'#FFFFFF',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', padding:'0 24px', gap:10,
          position:'sticky', top:0, zIndex:100,
        }}>
          {/* Mobile hamburger */}
          <button className="show-mobile g-btn g-btn-text" style={{padding:'0 8px',minHeight:40}}
            onClick={()=>setMenuOpen(true)}>☰</button>

          {/* Mobile brand logo */}
          <div className="show-mobile" style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
            <FlowPilotLogo size={20}/>
            <span style={{fontSize:14,fontWeight:700,color:'var(--text-1)'}}>FlowPilot</span>
          </div>

          {/* Command Search Bar */}
          <form onSubmit={handleSearch} style={{flex:1,maxWidth:360,position:'relative'}} className="hide-mobile">
            <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text-3)',fontSize:15,pointerEvents:'none'}}>⌕</span>
            <input
              id="global-search-input"
              value={searchVal}
              onChange={e=>setSearchVal(e.target.value)}
              placeholder="Search tasks... (Cmd+K)"
              style={{
                width:'100%', height:38, paddingLeft:36, paddingRight:12,
                border:'1px solid var(--border)', borderRadius:8,
                background:'var(--surface-2)', outline:'none',
                fontFamily:'var(--font)', fontSize:13, color:'var(--text-1)',
                transition:'all .15s',
              }}
              onFocus={e=>{e.target.style.background='white'; e.target.style.borderColor='var(--blue)';}}
              onBlur={e=>{e.target.style.background='var(--surface-2)'; e.target.style.borderColor='var(--border)';}}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchVal.trim()) {
                  navigate(`/tasks?q=${encodeURIComponent(searchVal.trim())}`);
                  setSearchVal('');
                }
              }}
            />
          </form>

          {/* Right Area controls & Profile */}
          <div style={{display:'flex',alignItems:'center',gap:16,marginLeft:'auto'}}>
            <button style={{background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',fontSize:18}} className="hide-mobile hover:text-primary">
              🔔
            </button>
            <button style={{background:'none',border:'none',color:'var(--text-2)',cursor:'pointer',fontSize:16}} className="hide-mobile hover:text-primary" onClick={()=>navigate('/chat')}>
              ✦
            </button>
            
            <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{user?.displayName || user?.email?.split('@')[0]}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 500 }}>Core Admin</span>
            </div>

            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" style={{width:32,height:32,borderRadius:'50%',cursor:'pointer',border:'1.5px solid var(--border)'}} onClick={()=>navigate('/settings')}/>
              : <div style={{width:32,height:32,borderRadius:'50%',background:'var(--blue-light)',color:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,cursor:'pointer',border:'1.5px solid var(--border)'}} onClick={()=>navigate('/settings')}>{user?.displayName?.[0]||user?.email?.[0]?.toUpperCase()||'U'}</div>
            }
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main style={{flex:1,overflowY:'auto'}}>
          <div style={{padding:'24px 28px',maxWidth:1400,margin:'0 auto'}} className="r-pad">
            <Outlet context={{ openAddTask: ()=>setShowAddTask(true) }}/>
          </div>
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="show-mobile" style={{
          height:56, flexShrink:0, background:'#FFFFFF',
          borderTop:'1px solid var(--border)',
          display:'flex', justifyContent:'space-around', alignItems:'center',
          position:'sticky', bottom:0, zIndex:100,
        }}>
          {[
            {to:'/dashboard',label:'Home',icon:'⊞'},
            {to:'/tasks',label:'Tasks',icon:'✓'},
            {to:'/calendar',label:'Cal',icon:'⊙'},
            {to:'/chat',label:'AI',icon:'✦'},
            {to:'/settings',label:'More',icon:'⚙'},
          ].map(item => {
            const active = location.pathname===item.to;
            return (
              <button key={item.to} onClick={()=>navigate(item.to)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2,
                  background:'none',border:'none',cursor:'pointer',minWidth:44,minHeight:44,
                  justifyContent:'center',
                  color:active?'var(--blue)':'var(--text-3)'}}>
                <span style={{fontSize:18}}>{item.icon}</span>
                <span style={{fontSize:9,fontWeight:active?600:400}}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* INITIATIVE MODAL */}
      {showAddTask && (
        <AddTaskModal
          onClose={()=>setShowAddTask(false)}
          onTaskAdded={()=>setShowAddTask(false)}
        />
      )}
    </div>
  );
}
