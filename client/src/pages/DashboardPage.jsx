import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, getDoc, getDocs, setDoc, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AddTaskModal from '../components/AddTaskModal';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 86399999);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);

  useEffect(() => {
    if (loading || !user?.uid) return;

    // START LISTENER FIRST — before anything else
    const taskCol = collection(db, 'users', user.uid, 'tasks');
    const taskUnsub = onSnapshot(taskCol,
      (snap) => {
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setTasks(data);
        setTasksLoading(false);
      },
      (err) => {
        console.error('[TASKS] Listener error:', err.code);
        setTasksLoading(false);
      }
    );

    const logCol = collection(db, 'users', user.uid, 'agentLog');
    const logUnsub = onSnapshot(logCol,
      (snap) => {
        setAgentLogs(
          snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
            .slice(0, 10)
        );
      },
      () => {} // silently ignore log errors
    );

    // Seed check runs AFTER listener is established
    const seedCheck = async () => {
      try {
        const metaRef = doc(db, 'users', user.uid, 'meta', 'seed');
        const meta = await getDoc(metaRef);
        if (meta.exists()) return;

        const existing = await getDocs(collection(db, 'users', user.uid, 'tasks'));
        if (!existing.empty) {
          await setDoc(metaRef, { seeded: true });
          return;
        }

        // Seed data
        const now = Date.now();
        const seeds = [
          { title: 'AWS Certification Exam', deadline: new Date(now + 2*86400000).toISOString(), category: 'Career', progressPercent: 10, priorityScore: 95, riskScore: 92, status: 'active', subtasks: ['Cloud Fundamentals', 'IAM', 'EC2', 'S3', 'Mock Test'], createdAt: new Date().toISOString(), userId: user.uid },
          { title: 'DSA Assignment', deadline: new Date(now + 4*86400000).toISOString(), category: 'Academics', progressPercent: 35, priorityScore: 82, riskScore: 68, status: 'active', subtasks: ['Dynamic Programming', 'Graphs', 'Trees'], createdAt: new Date(now-1000).toISOString(), userId: user.uid },
          { title: 'Resume Update', deadline: new Date(now + 7*86400000).toISOString(), category: 'Career', progressPercent: 60, priorityScore: 40, riskScore: 22, status: 'active', subtasks: ['Update projects', 'Rewrite summary'], createdAt: new Date(now-2000).toISOString(), userId: user.uid },
        ];
        for (const t of seeds) await addDoc(collection(db, 'users', user.uid, 'tasks'), t);
        await setDoc(metaRef, { seeded: true });
      } catch (e) {
        console.log('[SEED] Error (non-fatal):', e.message);
      }
    };

    seedCheck();
    return () => { taskUnsub(); logUnsub(); };
  }, [user, loading]);

  // ── Helpers ──
  function toDate(v) { if(!v)return null; return v?.toDate?.()??new Date(v); }
  const allTasks  = tasks||[];
  const completed = allTasks.filter(t=>t.status==='completed');
  const active    = allTasks.filter(t=>t.status!=='completed');
  const overdue   = active.filter(t=>{ const d=toDate(t.deadline); return d&&d<today; });
  const atRisk    = active.filter(t=>(t.riskScore||0)>=50&&(t.riskScore||0)<75);
  const critical  = active.filter(t=>(t.riskScore||0)>=75);
  const flowScore = allTasks.length===0?0:Math.round(completed.length/allTasks.length*100);
  const firstName = user?.displayName?.split(' ')[0]||user?.email?.split('@')[0]||'there';

  // ── Week strip ──
  const weekDays = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  const weekDates = useMemo(() => {
    return Array.from({length:7},(_,i)=>{
      const d = new Date(today);
      const currentDay = today.getDay();
      const distance = i - (currentDay === 0 ? 6 : currentDay - 1); // Align Mon-Sun
      d.setDate(today.getDate() + distance);
      return d;
    });
  }, []);

  // Mock flow sparkline data
  const flowData = useMemo(() => {
    return [
      { val: 30 }, { val: 45 }, { val: 35 }, 
      { val: 65 }, { val: 50 }, { val: 80 }, 
      { val: Math.max(flowScore, 10) }
    ];
  }, [flowScore]);

  if(loading||tasksLoading) return (
    <div className="r-pad">
      <div style={{height:28,width:240,marginBottom:20}} className="skeleton"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}} className="r-grid-2">
        {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:88}}/>)}
      </div>
    </div>
  );

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      
      <style>{`
        .dash-cols { display: grid; grid-template-columns: 1fr 320px; gap: 20px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .action-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        
        @media (max-width: 1024px) {
          .dash-cols { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr; }
        }
        @keyframes pulse-green {
          0%, 100% { box-shadow: 0 0 6px #22c55e; }
          50% { box-shadow: 0 0 14px #22c55e; }
        }
      `}</style>

      {/* ── Greeting Header ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 6px' }}>
          Good evening, {firstName}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
          Your flow is optimal today. You've cleared {flowScore}% of your cognitive load.
          {active.length > 0 && (
            <span> FlowPilot suggests focusing on the <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{active[0].title}</span> next.</span>
          )}
        </p>
      </div>

      {/* ── Overdue Alert Banner ── */}
      {overdue.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
          background: 'var(--amber-light)', border: '1px solid var(--amber-google)', borderRadius: 12, padding: '12px 18px', marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontSize: '13px', fontWeight: 600 }}>
            <span>⚠️</span>
            <span>{overdue.length} overdue initiative{overdue.length > 1 ? 's' : ''} detected — activate Rescue Mode</span>
          </div>
          <button className="g-btn g-btn-outlined g-btn-sm" style={{ borderColor: 'var(--amber)', color: 'var(--amber)' }}
            onClick={() => overdue[0] && navigate(`/rescue/${overdue[0].id}`)}>
            Activate Rescue Mode
          </button>
        </div>
      )}

      {/* ── 4 Stats Row ── */}
      <div className="stat-grid">
        
        {/* Flow Score */}
        <div className="g-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>FLOW SCORE</span>
            <span style={{ color: 'var(--blue)', fontSize: '10px', fontWeight: 700, background: 'var(--blue-light)', padding: '2px 6px', borderRadius: '4px' }}>+12%</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
            {flowScore} <span style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: 500 }}>/100</span>
          </div>
          <div style={{ flex: 1, minHeight: '36px', marginTop: '6px' }}>
            <ResponsiveContainer width="100%" height={34}>
              <AreaChart data={flowData} margin={{ top: 0, bottom: 0, left: -10, right: -10 }}>
                <defs>
                  <linearGradient id="flowG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="var(--blue)" strokeWidth={2} fillOpacity={1} fill="url(#flowG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tasks Completed */}
        <div className="g-card" style={{ display: 'flex', padding: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: '8px' }}>TASKS COMPLETED</span>
            <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>
              {completed.length} <span style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: 500 }}>completed</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500 }}>Target: {allTasks.length} total</span>
          </div>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--surface-3)" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--blue)" strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 15 * Math.max(flowScore, 5) / 100} 100`}
                strokeLinecap="round" transform="rotate(-90 18 18)" />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--text-1)' }}>
              {flowScore}%
            </div>
          </div>
        </div>

        {/* At Risk */}
        <div className="g-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>AT RISK</span>
            <span style={{ color: 'var(--amber)', fontSize: '14px' }}>⚠️</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: atRisk.length > 0 ? 'var(--amber)' : 'var(--text-1)', marginBottom: 2 }}>
            {String(atRisk.length).padStart(2, '0')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: atRisk.length > 0 ? 'var(--amber)' : 'var(--border-2)' }} />
            Needs attention
          </span>
        </div>

        {/* Critical Initiatives */}
        <div className="g-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px' }}>CRITICAL INITIATIVES</span>
            <span style={{ color: 'var(--red)', fontSize: '14px' }}>❗</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: critical.length > 0 ? 'var(--red)' : 'var(--text-1)', marginBottom: 2 }}>
            {String(critical.length).padStart(2, '0')}
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${critical.length > 0 ? 80 : 0}%`, height: '100%', background: 'var(--red)' }} />
          </div>
        </div>

      </div>

      {/* ── Main Layout Column Splits ── */}
      <div className="dash-cols">
        
        {/* Left Side: Weekly progression and Task Pipeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* Weekly Progression Strip Card */}
          <div className="g-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>Weekly Progression</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="g-btn g-btn-outlined" style={{ minHeight: '28px', width: '28px', height: '28px', padding: 0, borderRadius: '50%' }}>‹</button>
                <button className="g-btn g-btn-outlined" style={{ minHeight: '28px', width: '28px', height: '28px', padding: 0, borderRadius: '50%' }}>›</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
              {weekDates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const hasTask = active.some(t => {
                  const td = toDate(t.deadline);
                  return td && td.toDateString() === d.toDateString();
                });
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)' }}>{weekDays[i]}</span>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isToday ? 'var(--blue)' : 'transparent',
                      color: isToday ? '#FFFFFF' : 'var(--text-1)',
                      fontSize: '13px', fontWeight: isToday ? 700 : 500,
                      border: isToday ? 'none' : '1px solid transparent'
                    }} className={isToday ? '' : 'hover:bg-surface-3'}>
                      {d.getDate()}
                    </div>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: hasTask ? (isToday ? 'var(--blue)' : 'var(--blue-mid)') : 'transparent' }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Task Pipeline List */}
          <div className="g-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📁</span> Active Task Pipeline
              </div>
              <button className="g-btn g-btn-text g-btn-sm" style={{ paddingRight: 0 }} onClick={() => navigate('/tasks')}>
                View all →
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {active.slice(0, 5).map(t => {
                const isOverdue = overdue.some(o => o.id === t.id);
                const rc = (t.riskScore || 0) >= 75 ? 'var(--red)' : (t.riskScore || 0) >= 50 ? 'var(--amber)' : 'var(--green)';
                const priorityLabel = (t.priority || 0) >= 70 ? 'High priority' : (t.priority || 0) >= 40 ? 'Medium priority' : 'Low priority';
                const dueText = isOverdue ? 'Overdue' : t.deadline ? `Due ${new Date(t.deadline).toLocaleDateString()}` : 'No deadline';

                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px',
                    border: '1px solid var(--border)', borderRadius: '12px', background: '#FFFFFF',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }} className="g-card-hover" onClick={() => navigate(`/task/${t.id}`)}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: rc, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: isOverdue ? 'var(--red)' : 'var(--text-3)', fontWeight: isOverdue ? 600 : 400 }}>{dueText}</span>
                        <span>•</span>
                        <span>{priorityLabel}</span>
                        {t.labels?.[0] && (
                          <>
                            <span>•</span>
                            <span style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, fontSize: '9px' }}>
                              {t.labels[0].toUpperCase()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {/* User Avatars & Dots */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--blue-light)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                        {firstName[0]}
                      </div>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '16px' }}>⋮</button>
                    </div>
                  </div>
                );
              })}

              {active.length === 0 && (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                  No active tasks in pipeline. 🎉
                </div>
              )}
            </div>

            <button className="g-btn g-btn-text" style={{ marginTop: '12px', paddingLeft: 0 }} onClick={() => setShowAdd(true)}>
              + Add task pipeline
            </button>
          </div>

        </div>

        {/* Right Side: Risk Radar & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 }}>
          
          {/* System Risk Radar */}
          <div className="g-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              SYSTEM RISK RADAR
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg width="120" height="120" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--surface-3)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--blue)" strokeWidth="3"
                    strokeDasharray="24 100" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--amber)" strokeWidth="3"
                    strokeDasharray="14 100" strokeDashoffset="-24" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--red)" strokeWidth="3"
                    strokeDasharray="8 100" strokeDashoffset="-38" strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)' }}>24%</span>
                  <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>Safe Zone</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.5, margin: '0 0 14px' }}>
              AI detected {critical.length + atRisk.length} anomalies in current sub-processes. Systems stable.
            </p>

            {/* Priority breakdown legend list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Critical', color: 'var(--red)', count: critical.length },
                { label: 'At Risk', color: 'var(--amber)', count: atRisk.length },
                { label: 'On Track', color: 'var(--green)', count: active.filter(t => (t.riskScore || 0) < 50).length }
              ].map(radar => (
                <div key={radar.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: radar.color }} />
                    <span>{radar.label}</span>
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{radar.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Quick Actions Panel */}
          <div className="g-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
              AI QUICK ACTIONS
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '📅', label: 'Plan My Day', sub: 'Auto-organize schedule', go: '/chat', color: 'var(--blue)' },
                { icon: '🚨', label: 'Rescue Mode', sub: 'Isolate critical failures', go: critical[0] ? `/rescue/${critical[0].id}` : '/chat', color: 'var(--red)' },
                { icon: '🎙️', label: 'Smart Briefing', sub: '10-min audio summary', go: '/chat', color: 'var(--purple)' }
              ].map((act, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                  background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '12px',
                  cursor: 'pointer', transition: 'all 0.2s'
                }} className="g-card-hover" onClick={() => navigate(act.go)}>
                  <span style={{ fontSize: '18px' }}>{act.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>{act.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '1px' }}>{act.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginTop: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse-green 2s infinite' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#22c55e', letterSpacing: '0.5px' }}>AGENT ACTIVE</span>
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Gemini 2.0 Flash • Monitoring every 30 min<br/>
              Auto-rescues critical tasks • Auto-plans each morning
            </div>
          </div>

        </div>

      </div>

      {/* Floating Sparkle Chat FAB */}
      <button style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--blue)',
        color: '#FFFFFF', border: 'none',
        boxShadow: '0 4px 16px rgba(13, 99, 248, 0.3)', padding: '0 20px', height: '40px',
        borderRadius: '20px', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
        fontFamily: 'var(--font)'
      }} onClick={() => navigate('/chat')}>
        <span style={{ fontSize: '15px' }}>✦</span> Ask Gemini
      </button>

      {/* Account Logs Footer */}
      {agentLogs.length > 0 && (
        <div className="g-card" style={{ marginTop: '24px', padding: '16px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', marginBottom: '8px' }}>AGENT RECENT ACTIVITY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {agentLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--blue)' }}>•</span>
                <span style={{ flex: 1 }}>
                  {log.message || log.description}
                  {log.autonomous && (
                    <span style={{
                      fontSize: '9px', fontWeight: '700', color: '#8b5cf6',
                      background: 'rgba(139,92,246,0.1)', padding: '1px 5px',
                      borderRadius: '3px', marginLeft: '6px', letterSpacing: '0.3px',
                    }}>AUTO</span>
                  )}
                </span>
                <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>{log.timestamp && log.timestamp.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onTaskAdded={() => setShowAdd(false)} />}
    </div>
  );
}
