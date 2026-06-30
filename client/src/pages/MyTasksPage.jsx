import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import AddTaskModal from '../components/AddTaskModal';

export default function MyTasksPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q')||'';

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(()=>{
    if(loading||!user) return;
    const q=query(collection(db,'users',user.uid,'tasks'),orderBy('createdAt','desc'));
    const unsub=onSnapshot(q,snap=>{setTasks(snap.docs.map(d=>({id:d.id,...d.data()})));setTasksLoading(false);},err=>{console.error(err);setTasksLoading(false);});
    return unsub;
  },[user,loading]);

  function getOverdueLabel(task) {
    if (task.status === 'completed') return null;
    if (!task.deadline) return null;
    let deadlineDate;
    try {
      deadlineDate = task.deadline?.toDate?.() ?? new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) return null;
    } catch (e) {
      return null;
    }
    const now = new Date();
    const diffMs = now - deadlineDate;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays <= 0) return null; // not overdue
    if (diffDays > 365) return null; // sanity guard
    return `${diffDays}d overdue`;
  }

  function formatRelativeDate(timestamp) {
    const d = timestamp?.toDate?.() ?? new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const diffDays = Math.floor((new Date() - d) / 86400000);
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  }

  function formatDeadline(t) {
    if (t.status === 'completed') return null;
    const d = toDate(t.deadline); 
    if (!d || isNaN(d.getTime())) return null;
    const diff = Math.ceil((d - new Date()) / 86400000);
    if (diff < 0) return null; // Handled by getOverdueLabel now
    if (diff === 0) return 'Due today'; 
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff}d`;
  }
  function toDate(v){if(!v)return null;return v?.toDate?.()??new Date(v);}
  function riskColor(s){ return s>=75?'var(--red)':s>=50?'var(--amber)':'var(--green)'; }
  function riskChipClass(s){ return s>=75?'chip-red':s>=50?'chip-amber':'chip-green'; }
  function riskLabel(t){
    if(getOverdueLabel(t)) return 'Overdue';
    const s=t.riskScore||0;
    return s>=75?'Critical':s>=50?'At Risk':'On Track';
  }

  async function handleComplete(t){
    await updateDoc(doc(db,'users',user.uid,'tasks',t.id),{status:'completed',completedAt:serverTimestamp()});
  }
  async function handleDelete(id){
    if(!window.confirm('Delete this task?'))return;
    await deleteDoc(doc(db,'users',user.uid,'tasks',id));
  }

  const all=tasks||[];
  const filtered=all.filter(t=>{
    const mf=filter==='all'||(filter==='active'&&t.status!=='completed')||(filter==='at-risk'&&(t.riskScore||0)>=50&&t.status!=='completed')||(filter==='completed'&&t.status==='completed');
    const ms=!searchQuery||t.title?.toLowerCase().includes(searchQuery.toLowerCase())||(t.labels||[]).some(l=>l.toLowerCase().includes(searchQuery.toLowerCase()));
    return mf&&ms;
  });
  const counts={all:all.length,active:all.filter(t=>t.status!=='completed').length,'at-risk':all.filter(t=>(t.riskScore||0)>=50&&t.status!=='completed').length,completed:all.filter(t=>t.status==='completed').length};

  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><div style={{width:24,height:24,border:'2px solid var(--border)',borderTopColor:'var(--blue)',borderRadius:'50%',animation:'spin .8s linear infinite'}}/></div>;

  return (
    <div className="animate-in r-pad">
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:500,color:'var(--text-1)',display:'flex',alignItems:'center',gap:10}}>
            My Tasks
            <span className="g-chip chip-gray" style={{fontSize:13}}>{all.length}</span>
          </h1>
          <p style={{fontSize:13,color:'var(--text-3)',marginTop:4}}>{counts.active} active · {counts.completed} completed</p>
        </div>
        <button className="g-btn g-btn-primary" onClick={()=>setShowAdd(true)}>+ Add Task</button>
      </div>

      {/* Search result banner */}
      {searchQuery&&(
        <div style={{marginBottom:12,fontSize:13,color:'var(--text-2)',display:'flex',alignItems:'center',gap:8}}>
          <span>Results for "<strong>{searchQuery}</strong>" · {filtered.length} found</span>
          <button className="g-btn g-btn-text g-btn-sm" onClick={()=>navigate('/tasks')}>✕ Clear</button>
        </div>
      )}

      {/* Filter chips */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[{k:'all',l:'All'},{k:'active',l:'Active'},{k:'at-risk',l:'At Risk'},{k:'completed',l:'Completed'}].map(tab=>(
          <button key={tab.k} onClick={()=>setFilter(tab.k)}
            className={'g-btn g-btn-sm '+(filter===tab.k?'g-btn-primary':'g-btn-outlined')}
            style={filter===tab.k?{}:{color:'var(--text-2)'}}>
            {tab.l} <span style={{opacity:.7}}>({counts[tab.k]})</span>
          </button>
        ))}
      </div>

      {/* Loading skeletons */}
      {tasksLoading&&[1,2,3].map(i=><div key={i} className="skeleton" style={{height:80,borderRadius:12,marginBottom:8}}/>)}

      {/* Empty state */}
      {!tasksLoading&&filtered.length===0&&(
        <div style={{textAlign:'center',padding:'60px 0'}}>
          <div style={{fontSize:48,marginBottom:12}}>✓</div>
          <div style={{fontSize:15,color:'var(--text-2)',fontWeight:500,marginBottom:6}}>
            {filter==='completed'?'No completed tasks yet':filter==='at-risk'?'No at-risk tasks — great work!':'No tasks here'}
          </div>
          <div style={{fontSize:13,color:'var(--text-3)',marginBottom:20}}>
            {filter==='all'?'Add your first task to get started':'Switch to "All" to see everything'}
          </div>
          {filter==='all'&&<button className="g-btn g-btn-primary" onClick={()=>setShowAdd(true)}>+ Add First Task</button>}
        </div>
      )}

      {/* Task list */}
      {!tasksLoading&&filtered.map(task=>{
        const overdueLabel = getOverdueLabel(task);
        const done=task.status==='completed';
        const subs=task.subtasks||[];
        const pct=subs.length>0?Math.round(subs.filter(s=>s.completed).length/subs.length*100):0;
        const dl=formatDeadline(task);
        const rs=task.riskScore||0;

        return (
          <div key={task.id} className="g-card g-card-hover"
            style={{marginBottom:10,borderLeft:`3px solid ${done?'var(--border)':overdueLabel?'var(--red)':rs>=75?'var(--red)':rs>=50?'var(--amber)':'var(--green)'}`,cursor:'pointer',transition:'all .15s'}}
            onClick={()=>navigate(`/task/${task.id}`)}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {/* Circle checkbox */}
              <div onClick={e=>{e.stopPropagation();if(!done)handleComplete(task);}}
                style={{width:20,height:20,borderRadius:'50%',flexShrink:0,cursor:done?'default':'pointer',
                  border:done?'none':'2px solid var(--border-2)',
                  background:done?'var(--green-google)':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',
                  color:'white',fontSize:10,transition:'all .15s'}}>
                {done?'✓':''}
              </div>
              {/* Title + meta */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,color:done?'var(--text-3)':'var(--text-1)',textDecoration:done?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{task.title}</div>
                <div style={{fontSize:12,color:overdueLabel&&!done?'var(--red)':'var(--text-3)',marginTop:2}}>
                  {!done && overdueLabel && (
                    <span style={{ color: 'var(--red)', fontSize: 12 }}>
                      ⚠ {overdueLabel}
                    </span>
                  )}
                  {!done && !overdueLabel && dl && <span>{dl}</span>}
                  {done && task.completedAt && (
                    <span style={{ color: 'var(--text-3)', fontSize: 12 }}>
                      Completed {formatRelativeDate(task.completedAt)}
                    </span>
                  )}
                  {task.estimatedHours&&<span style={{marginLeft:8}}>· {task.estimatedHours}h estimated</span>}
                </div>
              </div>
              {/* Badge */}
              {done
                ?<span className="g-chip chip-green">Done</span>
                :<span className={`g-chip ${riskChipClass(rs)}`}>{overdueLabel?'⚠ Overdue':riskLabel(task)}</span>
              }
            </div>

            {/* Progress bar */}
            {subs.length>0&&(
              <div style={{margin:'10px 0 0 32px'}}>
                <div style={{height:3,background:'var(--surface-2)',borderRadius:2}}>
                  <div style={{height:'100%',borderRadius:2,width:pct+'%',background:pct>=100?'var(--green-google)':pct>=50?'var(--amber-google)':'var(--blue)',transition:'width .3s'}}/>
                </div>
                <div style={{fontSize:11,color:'var(--text-3)',marginTop:3}}>{subs.filter(s=>s.completed).length}/{subs.length} subtasks · {pct}%</div>
              </div>
            )}

            {/* Action buttons */}
            {!done&&(
              <div style={{display:'flex',gap:6,marginTop:10,marginLeft:32}} onClick={e=>e.stopPropagation()}>
                <button className="g-btn g-btn-outlined g-btn-sm" onClick={()=>handleComplete(task)}>✓ Complete</button>
                {(rs>=75||overdueLabel)&&<button className="g-btn g-btn-danger g-btn-sm" onClick={()=>navigate(`/rescue/${task.id}`)}>⚡ Rescue</button>}
                <button className="g-btn g-btn-text g-btn-sm" style={{color:'var(--text-2)'}} onClick={()=>navigate(`/task/${task.id}`)}>Edit</button>
                <button className="g-btn g-btn-text g-btn-sm" style={{color:'var(--red)'}} onClick={()=>handleDelete(task.id)}>Delete</button>
              </div>
            )}
          </div>
        );
      })}

      {showAdd&&<AddTaskModal onClose={()=>setShowAdd(false)} onTaskAdded={()=>setShowAdd(false)}/>}
    </div>
  );
}
