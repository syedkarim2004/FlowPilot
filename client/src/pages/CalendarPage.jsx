import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';
import { planAPI } from '../api';
import AddTaskModal from '../components/AddTaskModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({length: 15}, (_, i) => i + 7); // 7AM to 9PM

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState('month');
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [googleEvents, setGoogleEvents] = useState([]);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [calendarList, setCalendarList] = useState([]);

  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  function isSameDay(firestoreVal, dateObj) {
    if (!firestoreVal || !dateObj) return false;
    try {
      const d = firestoreVal?.toDate?.() ?? new Date(firestoreVal);
      return (
        d.getFullYear() === dateObj.getFullYear() &&
        d.getMonth()    === dateObj.getMonth()    &&
        d.getDate()     === dateObj.getDate()
      );
    } catch (e) { return false; }
  }

  async function loadGoogleCalendar() {
    const token = sessionStorage.getItem('gCalToken');
    if (!token) {
      setCalendarConnected(false);
      return;
    }
    setSyncLoading(true);
    try {
      const calRes = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: 'Bearer ' + token } }
      );
      if (calRes.status === 401) {
        sessionStorage.removeItem('gCalToken');
        setCalendarConnected(false);
        setSyncLoading(false);
        return;
      }
      const calData = await calRes.json();
      setCalendarList(calData.items || []);

      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString();

      const evRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=100`,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      const evData = await evRes.json();
      setGoogleEvents(evData.items || []);
      setCalendarConnected(true);
    } catch (err) {
      console.error('Google Calendar error:', err);
      setCalendarConnected(false);
    } finally {
      setSyncLoading(false);
    }
  }

  useEffect(() => {
    loadGoogleCalendar();
  }, []);

  function getGoogleEventsForDay(dateObj) {
    return googleEvents.filter(ev => {
      const start = ev.start?.dateTime || ev.start?.date;
      if (!start) return false;
      const d = new Date(start);
      return d.getFullYear() === dateObj.getFullYear()
          && d.getMonth() === dateObj.getMonth()
          && d.getDate() === dateObj.getDate();
    });
  }

  useEffect(() => {
    if (authLoading || !user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'tasks'), snap => {
      const fetched = snap.docs.map(d => ({id: d.id, ...d.data()}));
      setTasks(fetched);
    });
    return unsub;
  }, [user, authLoading]);

  useEffect(() => {
    if (authLoading || !user) return;
    const loadSchedule = async () => {
      const planRef = doc(db, 'users', user.uid, 'plans', todayStr);
      const snap = await getDoc(planRef);
      if (snap.exists() && snap.data().schedule) {
        setSchedule(snap.data().schedule);
      }
    };
    loadSchedule();
  }, [user, todayStr, authLoading]);

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const activeTasks = tasks.filter(t => t.status !== 'completed');
      const res = await planAPI.generateDaily(activeTasks.map(t => ({
        title: t.title,
        estimatedHours: t.estimatedHours || 1,
        riskScore: t.riskScore,
        deadline: t.deadline
      })));
      const planData = res.data.plan || res.data;
      const newSchedule = planData.schedule || [];
      setSchedule(newSchedule);
      
      const planRef = doc(db, 'users', user.uid, 'plans', todayStr);
      await setDoc(planRef, planData, {merge: true});
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const dueToday = tasks.filter(t => t.deadline && isSameDay(t.deadline, today) && t.status !== 'completed').length;
  const tomorrow = new Date(today.getTime() + 86400000);
  const dueTomorrow = tasks.filter(t => t.deadline && isSameDay(t.deadline, tomorrow) && t.status !== 'completed').length;
  const dueThisWeek = tasks.filter(t => {
      if (!t.deadline) return false;
      const d = t.deadline?.toDate?.() ?? new Date(t.deadline);
      return d.getTime() >= today.getTime() && d.getTime() <= today.getTime() + 7*86400000 && t.status !== 'completed';
  }).length;

  const getRiskColor = (riskScore) => {
    if (riskScore >= 75) return '#f28b82'; // Red (Critical)
    if (riskScore >= 50) return '#fdd663'; // Orange (At Risk)
    return '#81c995'; // Green (On Track)
  };

  const getRiskBg = (riskScore) => {
    if (riskScore >= 75) return 'rgba(242,139,130,0.15)'; 
    if (riskScore >= 50) return 'rgba(253,214,99,0.15)'; 
    return 'rgba(129,201,149,0.15)'; 
  };

  // View calculations
  const displayDates = useMemo(() => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
      return Array.from({length: 7}, (_, i) => {
        const d = new Date(currentDate);
        const day = currentDate.getDay();
        d.setDate(currentDate.getDate() - day + i);
        return d;
      });
    }
    // month view - 35 days (5 weeks)
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOffset = firstDay.getDay();
    return Array.from({length: 35}, (_, i) => {
      const d = new Date(firstDay);
      d.setDate(firstDay.getDate() - startOffset + i);
      return d;
    });
  }, [currentDate, view]);

  return (
    <div className="cal-page flex flex-col h-full p-8 md:p-10 w-full max-w-[1600px] mx-auto overflow-hidden">
      <style>{`
        @media (max-width: 768px) {
          /* Hide sidebar-related margins */
          .cal-page { 
            margin-left: 0 !important; 
            padding: 16px !important; 
          }
          
          /* Make calendar grid scrollable */
          .cal-grid-wrapper { 
            overflow-x: auto !important; 
            -webkit-overflow-scrolling: touch !important;
          }
          
          /* Month view cells smaller */
          .cal-day-cell { 
            min-height: 44px !important; 
            font-size: 12px !important;
          }
          
          /* Day/Week/Month switcher */
          .view-switcher button { 
            padding: 5px 10px !important; 
            font-size: 11px !important;
          }

          /* Due panels at bottom */
          .due-panels { 
            grid-template-columns: 1fr !important; 
            gap: 8px !important;
          }
        }
      `}</style>
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between shrink-0">
        <div className="flex flex-col gap-2">
          <h1 className="text-[32px] font-[800] tracking-tight text-text-primary">
            Calendar
          </h1>
          <div className="flex items-center gap-3 text-[14px] text-text-secondary font-medium">
            <button onClick={() => {
              const newDate = new Date(currentDate);
              if (view === 'day') newDate.setDate(newDate.getDate() - 1);
              if (view === 'week') newDate.setDate(newDate.getDate() - 7);
              if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
              setCurrentDate(newDate);
            }} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-surface-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <span className="min-w-[140px] text-center">
              {currentDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', 
                day: view === 'month' ? undefined : 'numeric'
              })}
            </span>
            <button onClick={() => {
              const newDate = new Date(currentDate);
              if (view === 'day') newDate.setDate(newDate.getDate() + 1);
              if (view === 'week') newDate.setDate(newDate.getDate() + 7);
              if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
              setCurrentDate(newDate);
            }} className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md hover:bg-surface-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="ml-2 px-3 py-1 bg-surface-2 hover:bg-surface-3 text-text-primary text-[12px] rounded-lg transition-colors border border-border-subtle font-bold">
              Today
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {calendarConnected ? (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:7,height:7,borderRadius:'50%',background:'var(--green)',display:'inline-block' }}/>
                Google Calendar synced
              </span>
              <button className="g-btn g-btn-outlined g-btn-sm" onClick={loadGoogleCalendar} disabled={syncLoading}>
                {syncLoading ? 'Syncing...' : '↻ Refresh'}
              </button>
            </div>
          ) : (
            <button className="g-btn g-btn-outlined g-btn-sm"
              style={{ borderColor:'#4285F4', color:'#4285F4', display:'flex', alignItems:'center', gap:6 }}
              onClick={() => {
                import('../firebase').then(({ auth }) => {
                  import('../firebase').then(({ signInWithGoogle }) => {
                    signInWithGoogle().then(() => loadGoogleCalendar());
                  });
                });
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Connect Google Calendar
            </button>
          )}

          {/* View switcher */}
          <div className="view-switcher flex items-center bg-surface-1 border border-border-subtle rounded-xl p-1 shadow-inner">
            {['Day','Week','Month'].map(v => (
              <button key={v} onClick={() => setView(v.toLowerCase())} className={`
                px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-200
                ${view === v.toLowerCase() ? 'bg-surface-3 text-text-primary shadow-sm' : 'text-text-muted hover:text-text-primary hover:bg-surface-2'}
              `}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={handleGenerate} disabled={generating} className={`
            fp-btn fp-btn-md fp-btn-primary shadow-glow
            ${generating ? 'opacity-70 cursor-not-allowed' : ''}
          `}>
            {generating ? 'Planning...' : '✦ Auto-Schedule'}
          </button>
        </div>
      </div>

      {/* Grid container */}
      <div className="flex-1 min-h-0 bg-surface-1/50 border border-border-subtle rounded-2xl overflow-hidden shadow-card flex flex-col">
        
        {view === 'month' ? (
          /* MONTH VIEW */
          <div className="flex flex-col h-full">
            {/* Headers */}
            <div className="grid grid-cols-7 border-b border-border-subtle bg-surface-1/80 backdrop-blur-md">
              {DAYS.map(day => (
                <div key={day} className="p-3 text-center text-[12px] text-text-muted font-bold tracking-widest uppercase border-r border-border-subtle last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            {/* Days Grid */}
            <div className="cal-grid-wrapper grid grid-cols-7 grid-rows-5 flex-1 bg-bg/50">
              {displayDates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                const dayTasks = (tasks || []).filter(t => t.deadline && isSameDay(t.deadline, d) && t.status !== 'completed');
                
                return (
                  <div key={i} 
                    onClick={() => { setSelectedDate(d); setIsModalOpen(true); }}
                    className={`
                      cal-day-cell cursor-pointer transition-colors p-3 flex flex-col border-r border-b border-border-subtle last:border-r-0
                      ${isToday ? 'bg-accent-primary/5' : 'hover:bg-surface-2'}
                      ${isCurrentMonth ? 'opacity-100' : 'opacity-40'}
                    `}
                  >
                    <div className={`
                      text-[13px] mb-2 w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-accent-primary text-white font-bold shadow-glow' : 'text-text-secondary font-medium'}
                    `}>
                      {d.getDate()}
                    </div>
                    
                    <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] scrollbar-hide">
                      {dayTasks.map(t => (
                        <div key={t.id} className="text-[11px] px-2 py-1 rounded-[6px] font-medium whitespace-nowrap overflow-hidden text-overflow-ellipsis border-l-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); navigate(`/task/${t.id}`); }}
                          style={{
                            background: getRiskBg(t.riskScore),
                            color: getRiskColor(t.riskScore),
                            borderLeftColor: getRiskColor(t.riskScore),
                          }}
                        >
                          {t.title}
                        </div>
                      ))}
                      {getGoogleEventsForDay(d).map(ev => {
                        const startTime = ev.start?.dateTime
                          ? new Date(ev.start.dateTime).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})
                          : '';
                        return (
                          <div key={ev.id}
                            style={{
                              fontSize:11, padding:'1px 6px', borderRadius:4,
                              marginBottom:2, overflow:'hidden',
                              textOverflow:'ellipsis', whiteSpace:'nowrap',
                              background:'#1A73E8', color:'white', cursor:'pointer',
                            }}
                            title={ev.summary + (startTime ? ' · ' + startTime : '')}
                            onClick={(e) => { e.stopPropagation(); ev.htmlLink && window.open(ev.htmlLink, '_blank'); }}>
                            {startTime && <span style={{opacity:.8,marginRight:3}}>{startTime}</span>}
                            {ev.summary || 'Event'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* DAY / WEEK VIEW */
          <div className="flex flex-col h-full">
            {/* Day headers */}
            <div className="grid border-b border-border-subtle bg-surface-1/80 backdrop-blur-md" style={{ gridTemplateColumns: `72px repeat(${displayDates.length}, 1fr)` }}>
              <div className="p-3 border-r border-border-subtle" />
              {displayDates.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString();
                const dayTasks = (tasks || []).filter(t => t.deadline && isSameDay(t.deadline, d) && t.status !== 'completed');
                
                return (
                  <div key={i} className={`p-4 text-center border-r border-border-subtle last:border-r-0 ${isToday ? 'bg-accent-primary/5' : ''}`}>
                    <div className="text-[12px] text-text-muted font-bold uppercase tracking-widest mb-2">
                      {DAYS[d.getDay()]}
                    </div>
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center mx-auto text-[15px]
                      ${isToday ? 'bg-accent-primary text-white font-bold shadow-glow' : 'text-text-primary font-medium bg-surface-3'}
                    `}>
                      {d.getDate()}
                    </div>
                    {dayTasks.length > 0 && (
                      <div className="mt-3">
                        <span className="text-[10px] font-bold tracking-wide bg-accent-primary/10 text-accent-primary px-2 py-1 rounded-full border border-accent-primary/20">
                          {dayTasks.length} TASKS
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            <div className="flex-1 overflow-y-auto relative bg-bg/30">
              {HOURS.map(hour => (
                <div key={hour} className="grid border-b border-border-subtle min-h-[70px]" style={{ gridTemplateColumns: `72px repeat(${displayDates.length}, 1fr)` }}>
                  <div className="p-3 text-[11px] font-mono font-medium text-text-muted text-right border-r border-border-subtle bg-surface-1/30">
                    {hour > 12 ? `${hour-12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                  
                  {displayDates.map((d, di) => {
                    const isToday = d.toDateString() === today.toDateString();
                    
                    const matchingEvents = isToday ? schedule.filter(s => parseInt(s.time?.split(':')[0]) === hour) : [];
                    const dayTasks = (tasks || []).filter(t => t.deadline && isSameDay(t.deadline, d) && t.status !== 'completed');
                    const matchingTasks = dayTasks.filter(t => {
                        const dl = t.deadline?.toDate?.() ?? new Date(t.deadline);
                        return dl.getHours() === hour;
                    });

                    return (
                      <div key={di} className={`relative p-1 border-r border-border-subtle last:border-r-0 ${isToday ? 'bg-accent-primary/5' : ''}`}>
                        <div className="flex gap-1 h-full">
                          
                          {/* AI Schedule Blocks */}
                          {matchingEvents.map((ev, ei) => {
                            const minutes = parseInt(ev.time?.split(':')[1] || 0);
                            const top = (minutes / 60) * 100;
                            const dur = parseInt(ev.duration || ev.durationMinutes || 60);
                            const height = (dur / 60) * 70; // 70px per hour
                            return (
                              <div key={'ev'+ei} className="absolute left-1 z-[5] rounded-[6px] p-2 overflow-hidden border-l-2 shadow-sm backdrop-blur-md"
                                style={{
                                  top: `${top}%`, width: 'calc(50% - 6px)', height: `${height}px`, minHeight: '32px',
                                  background: ev.type === 'break' ? 'rgba(34, 197, 94, 0.15)' : ev.type === 'review' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                  borderLeftColor: ev.type === 'break' ? 'var(--success)' : ev.type === 'review' ? 'var(--warning)' : 'var(--accent-primary)',
                                }}>
                                <div className="text-[10px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                                  {ev.taskTitle || ev.task}
                                </div>
                                <div className="text-[9px] font-mono text-text-muted mt-0.5">{ev.time} ({dur}m)</div>
                              </div>
                            )
                          })}

                          {/* Task Deadline Blocks */}
                          {matchingTasks.map((t, ti) => {
                            const minutes = new Date(t.deadline).getMinutes();
                            const top = (minutes / 60) * 100;
                            const height = Math.max(36, ((t.estimatedHours || 1) / 60) * 70);
                            
                            return (
                              <div key={'t'+ti} className="absolute right-1 z-[10] rounded-[6px] p-2 overflow-hidden border-l-2 shadow-card"
                                style={{
                                  top: `${top}%`, width: matchingEvents.length > 0 ? 'calc(50% - 6px)' : 'calc(100% - 8px)', height: `${height}px`, minHeight: '36px',
                                  background: getRiskBg(t.riskScore),
                                  borderLeftColor: getRiskColor(t.riskScore),
                                }}>
                                <div className="text-[11px] font-bold text-text-primary whitespace-nowrap overflow-hidden text-overflow-ellipsis">
                                  {t.title}
                                </div>
                                <div className="text-[10px] font-mono font-medium mt-0.5" style={{color: getRiskColor(t.riskScore)}}>
                                  DUE
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom panels */}
      <div className="due-panels grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 shrink-0">
        {[
          {label: 'Due Today', count: dueToday, color: 'text-danger', bg: 'bg-danger/5'},
          {label: 'Due Tomorrow', count: dueTomorrow, color: 'text-warning', bg: 'bg-warning/5'},
          {label: 'Due This Week', count: dueThisWeek, color: 'text-accent-primary', bg: 'bg-accent-primary/5'},
        ].map(item => (
          <div key={item.label} className={`bg-surface-1/50 border border-border-subtle rounded-2xl p-6 shadow-card flex items-center justify-between ${item.bg}`}>
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-bold text-text-muted uppercase tracking-widest">{item.label}</span>
              <span className="text-[12px] text-text-secondary font-medium">
                {item.count === 0 ? 'Nothing scheduled' : `${item.count} task${item.count>1?'s':''} pending`}
              </span>
            </div>
            <span className={`text-[32px] font-bold ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AddTaskModal 
          onClose={() => { setIsModalOpen(false); setSelectedDate(null); }} 
          onTaskAdded={() => { setIsModalOpen(false); setSelectedDate(null); }} 
          prefilledDate={selectedDate}
        />
      )}
    </div>
  );
}
