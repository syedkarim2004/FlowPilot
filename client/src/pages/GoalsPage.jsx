import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// ─── Helpers ───────────────────────────────────────────────
function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Circular Progress ─────────────────────────────────────
function CircularProgress({ value, size = 80, stroke = 6, color = '#1A73E8' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F3F4" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="42%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-1)" fontSize={size * 0.18} fontWeight="700">
        {Math.round(value)}%
      </text>
      <text x="50%" y="60%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-2)" fontSize={size * 0.10} fontWeight="500">
        Overall
      </text>
      <text x="50%" y="72%" textAnchor="middle" dominantBaseline="central"
        fill="var(--text-2)" fontSize={size * 0.10} fontWeight="500">
        Progress
      </text>
    </svg>
  );
}

// ─── Add Goal Modal ────────────────────────────────────────
function AddGoalModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', icon: '🎯', category: 'Career',
    targetDate: '', priority: 'High',
    milestones: [''], description: '',
  });
  const icons = ['🎯','🚀','💼','📚','💪','🏆','💡','🌟','🎓','💰','❤️','🌍'];
  const priorities = ['High','Medium','Low'];
  const categories = ['Career','Academics','Health','Personal','Finance','Learning'];

  const save = () => {
    if (!form.title.trim()) return;
    onSave({
      ...form,
      milestones: form.milestones.filter(m => m.trim()),
      progress: 0,
      completedMilestones: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(3px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }} onClick={onClose}>
      <div className="modal-box" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-1)' }}>New Goal</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: '14px' }}>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>ICON</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {icons.map(ic => (
              <button key={ic} onClick={() => setForm(f => ({...f, icon: ic}))} style={{
                width: '34px', height: '34px', borderRadius: '8px', fontSize: '18px',
                background: form.icon === ic ? 'var(--blue-light)' : 'var(--surface-2)',
                border: form.icon === ic ? '1.5px solid var(--blue)' : '1px solid var(--border-2)',
                cursor: 'pointer',
              }}>{ic}</button>
            ))}
          </div>
        </div>

        {[
          { label: 'GOAL TITLE', key: 'title', type: 'text', placeholder: 'e.g., Become AWS Certified' },
          { label: 'DESCRIPTION', key: 'description', type: 'textarea', placeholder: 'What does success look like?' },
          { label: 'TARGET DATE', key: 'targetDate', type: 'date', placeholder: '' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: '14px' }}>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                placeholder={f.placeholder} rows={2} className="g-input" style={{ height: 'auto', padding: '8px 12px' }} />
            ) : (
              <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({...p, [f.key]: e.target.value}))}
                placeholder={f.placeholder} className="g-input" style={{ colorScheme: 'light' }} />
            )}
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }} className="r-grid-1">
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>PRIORITY</label>
            <select value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}
              style={{ width: '100%', height: '40px', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '0 12px', color: 'var(--text-1)', fontSize: '14px', outline: 'none' }}>
              {priorities.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>CATEGORY</label>
            <select value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))}
              style={{ width: '100%', height: '40px', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: '8px', padding: '0 12px', color: 'var(--text-1)', fontSize: '14px', outline: 'none' }}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Milestones */}
        <div style={{ marginBottom: '18px' }}>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>MILESTONES</label>
          {form.milestones.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <input value={m} onChange={e => {
                const ms = [...form.milestones];
                ms[i] = e.target.value;
                setForm(p => ({...p, milestones: ms}));
              }} placeholder={`Milestone ${i+1}`} className="g-input" style={{ height: '34px' }} />
              {form.milestones.length > 1 && (
                <button onClick={() => setForm(p => ({...p, milestones: p.milestones.filter((_,j) => j!==i)}))}
                  style={{ background: 'var(--red-light)', border: 'none', borderRadius: '6px', color: 'var(--red)', cursor: 'pointer', padding: '0 10px', fontSize: '12px' }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={() => setForm(p => ({...p, milestones: [...p.milestones, '']}))} className="g-btn-text"
            style={{ fontSize: '12px', padding: '4px 0', border: 'none', background: 'none', cursor: 'pointer' }}>
            + Add milestone
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="g-btn g-btn-outlined" style={{ flex: 1 }}>Cancel</button>
          <button onClick={save} className="g-btn g-btn-primary" style={{ flex: 1 }}>Create Goal</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Habit Modal ───────────────────────────────────────
function AddHabitModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', icon: '💪', goal: '', unit: 'min', targetValue: 30, color: '#1A73E8' });
  const icons = ['💪','📚','🏃','💧','🧘','🎯','🌿','✍️','🎵','🍎','😴','🧠'];
  const colors = ['#1A73E8','#007B83','#34A853','#FBBC04','#EA4335','#7B1FA2'];

  const save = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, streak: 0, completedDates: [], todayValue: 0, createdAt: new Date().toISOString() });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(3px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div className="modal-box" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px',
        boxShadow: 'var(--shadow-3)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-1)' }}>New Habit</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>ICON</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {icons.map(ic => (
              <button key={ic} onClick={() => setForm(f => ({...f, icon: ic}))} style={{
                width: '34px', height: '34px', borderRadius: '8px', fontSize: '16px',
                background: form.icon === ic ? 'var(--blue-light)' : 'var(--surface-2)',
                border: form.icon === ic ? '1.5px solid var(--blue)' : '1px solid var(--border-2)',
                cursor: 'pointer'
              }}>{ic}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>HABIT NAME</label>
          <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g., Morning Workout" className="g-input" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>DAILY TARGET</label>
            <input type="number" value={form.targetValue} onChange={e => setForm(p => ({...p, targetValue: Number(e.target.value)}))} min="1" className="g-input" />
          </div>
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>UNIT</label>
            <input value={form.unit} onChange={e => setForm(p => ({...p, unit: e.target.value}))} placeholder="min" className="g-input" />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>COLOR</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {colors.map(c => (
              <button key={c} onClick={() => setForm(p => ({...p, color: c}))} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', boxShadow: form.color === c ? '0 0 0 1.5px var(--border-2)' : 'none', cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} className="g-btn g-btn-outlined" style={{ flex: 1 }}>Cancel</button>
          <button onClick={save} className="g-btn g-btn-primary" style={{ flex: 1 }}>Add Habit</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────
export default function GoalsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // ── Real-time listeners ──
  useEffect(() => {
    if (!user?.uid) return;
    const goalUnsub = onSnapshot(collection(db, 'users', user.uid, 'goals'), snap => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt||0)-new Date(a.createdAt||0)));
    });
    const habitUnsub = onSnapshot(collection(db, 'users', user.uid, 'habits'), snap => {
      setHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.createdAt||0)-new Date(a.createdAt||0)));
    });
    return () => { goalUnsub(); habitUnsub(); };
  }, [user?.uid]);

  // ── Stats ──
  const completedGoals = goals.filter(g => g.progress >= 100).length;
  const totalStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak || 0)) : 0;
  const today = getToday();
  const habitsCompletedToday = habits.filter(h => (h.completedDates || []).includes(today)).length;
  const habitCompletion = habits.length > 0 ? Math.round((habitsCompletedToday / habits.length) * 100) : 0;
  const overallProgress = goals.length > 0 ? Math.round(goals.reduce((s,g) => s + (g.progress||0), 0) / goals.length) : 0;

  // ── Add goal ──
  const addGoal = async (goalData) => {
    await addDoc(collection(db, 'users', user.uid, 'goals'), goalData);
  };

  // ── Add habit ──
  const addHabit = async (habitData) => {
    await addDoc(collection(db, 'users', user.uid, 'habits'), habitData);
  };

  // ── Mark habit complete ──
  const markHabitComplete = async (habit) => {
    const dates = habit.completedDates || [];
    const alreadyDone = dates.includes(today);
    let newDates, newStreak;
    if (alreadyDone) {
      newDates = dates.filter(d => d !== today);
      newStreak = Math.max(0, (habit.streak || 0) - 1);
    } else {
      newDates = [...dates, today];
      // Calculate streak
      let streak = 1;
      let check = new Date(); check.setDate(check.getDate() - 1);
      while (newDates.includes(check.toISOString().split('T')[0])) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
      newStreak = streak;
    }
    await updateDoc(doc(db, 'users', user.uid, 'habits', habit.id), {
      completedDates: newDates,
      streak: newStreak,
      todayValue: alreadyDone ? 0 : habit.targetValue,
    });
  };

  // ── Update goal progress ──
  const updateGoalProgress = async (goal, delta) => {
    const newProgress = Math.min(100, Math.max(0, (goal.progress || 0) + delta));
    await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), { progress: newProgress });
  };

  // ── Update goal milestone ──
  const toggleMilestone = async (goal, idx) => {
    const done = goal.completedMilestonesList || [];
    const newDone = done.includes(idx) ? done.filter(i => i !== idx) : [...done, idx];
    const progress = Math.round((newDone.length / Math.max(goal.milestones?.length || 1, 1)) * 100);
    await updateDoc(doc(db, 'users', user.uid, 'goals', goal.id), {
      completedMilestonesList: newDone,
      completedMilestones: newDone.length,
      progress,
    });
  };

  // ── Delete ──
  const deleteGoal = async (id) => {
    if (window.confirm('Delete this goal?')) await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
  };
  const deleteHabit = async (id) => {
    if (window.confirm('Delete this habit?')) await deleteDoc(doc(db, 'users', user.uid, 'habits', id));
  };

  // ── Habit calendar data ──
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const weekLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // All completed dates across all habits
  const allCompletedDates = habits.flatMap(h => h.completedDates || []);
  const dateCountMap = {};
  allCompletedDates.forEach(d => { dateCountMap[d] = (dateCountMap[d] || 0) + 1; });

  function getCellColor(count) {
    if (!count) return '#FFFFFF';
    const intensity = Math.min(count / habits.length, 1);
    if (intensity > 0.7) return 'var(--green-google)';
    if (intensity > 0.4) return '#A8D5B5';
    return '#E6F4EA';
  }

  // ── Upcoming milestones ──
  const upcomingMilestones = goals.flatMap(g =>
    (g.milestones || []).map((m, i) => ({
      text: m, goalTitle: g.title, goalId: g.id,
      done: (g.completedMilestonesList || []).includes(i), idx: i, goal: g,
    }))
  ).filter(m => !m.done).slice(0, 5);

  const priorityColor = (p) =>
    p === 'High' ? { color: 'var(--red)', bg: 'var(--red-light)' } :
    p === 'Medium' ? { color: 'var(--amber)', bg: 'var(--amber-light)' } :
    { color: 'var(--green)', bg: 'var(--green-light)' };

  return (
    <>
      <style>{`
        .goals-page * { box-sizing: border-box; }
        .goals-page { 
          padding: 8px 4px 60px; 
          font-family: var(--font);
          color: var(--text-1);
        }

        /* Stats row */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr) auto; gap: 12px; align-items: center; margin-bottom: 24px; }
        .stat-box { 
          background: var(--surface); 
          border: 1px solid var(--border); 
          border-radius: 12px; 
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          box-shadow: 0 1px 2px rgba(60,64,67,.05);
        }
        .stat-content { display: flex; flexDirection: column; flex: 1; }
        .stat-label { font-size: 10px; font-weight: 700; color: var(--text-3); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
        .stat-emoji { font-size: 18px; line-height: 1; }
        .stat-val { font-size: 24px; font-weight: 700; color: var(--text-1); line-height: 1.15; }
        .stat-sub { font-size: 11px; color: var(--text-3); margin-top: 1px; }

        /* Goals grid */
        .goals-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 24px; }
        .goal-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; }
        .goal-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .goal-icon-box { width: 38px; height: 38px; border-radius: 8px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .goal-title { font-size: 14px; font-weight: 600; color: var(--text-1); }
        .goal-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
        .goal-meta-item label { font-size: 10px; color: var(--text-3); display: block; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .goal-meta-item span { font-size: 12px; color: var(--text-2); font-weight: 500; }
        .progress-bar { height: 5px; background: var(--surface-2); border-radius: 3px; margin: 8px 0; }
        .progress-fill { height: 100%; border-radius: 3px; background: var(--blue); transition: width 0.5s ease; }
        
        .open-goal-btn { 
          width: 100%; padding: 8px; border-radius: 8px; 
          background: var(--blue-light); border: 1px solid var(--blue-mid); 
          color: var(--blue); font-size: 13px; font-weight: 500; 
          cursor: pointer; font-family: inherit; transition: all 0.15s; 
        }
        .open-goal-btn:hover { background: var(--blue); color: white; }
        
        .milestone-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; }
        .milestone-check { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid var(--border-2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; }
        .milestone-check.done { background: var(--blue); border-color: var(--blue); }
        .milestone-text { font-size: 12px; color: var(--text-2); }
        .milestone-text.done { text-decoration: line-through; color: var(--text-3); }

        /* Habits */
        .habits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 12px; margin-bottom: 24px; }
        .habit-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; }
        .habit-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .habit-icon { font-size: 18px; }
        .habit-name { font-size: 13px; font-weight: 600; color: var(--text-1); }
        .habit-streak { font-size: 11px; color: var(--amber); margin-top: 1px; }
        .habit-progress-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-3); margin-top: 4px; }
        
        .mark-btn { 
          width: 100%; margin-top: 10px; padding: 8px; border-radius: 8px; 
          font-size: 12px; font-weight: 500; cursor: pointer; 
          font-family: inherit; border: none; transition: all 0.15s; 
        }
        .mark-btn.done { background: var(--green-light); color: var(--green); }
        .mark-btn.todo { background: var(--blue-light); color: var(--blue); border: 1px solid var(--blue-mid); }

        /* Bottom 3-col */
        .bottom-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-top: 20px; }
        .panel-box { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
        .panel-title { font-size: 11px; font-weight: 700; color: var(--text-2); letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }

        /* Section header */
        .sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .sec-title { font-size: 16px; font-weight: 600; color: var(--text-1); font-family: var(--font); }
        .sec-link { font-size: 13px; color: var(--blue); cursor: pointer; background: transparent; border: none; font-family: inherit; font-weight: 500; }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: 1fr; gap: 8px; }
          .goals-grid { grid-template-columns: 1fr; }
          .habits-grid { grid-template-columns: 1fr; }
          .bottom-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="goals-page animate-in">

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ fontSize: '22px' }}>🎯</span>
              <h1 style={{ fontSize: '22px', fontWeight: 500, margin: 0, letterSpacing: '-0.3px', color: 'var(--text-1)' }}>Goals & Habits</h1>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0 }}>Track your long-term ambitions and daily routines</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowAddHabit(true)} className="g-btn g-btn-outlined" style={{ padding: '0 16px' }}>
              + New Habit
            </button>
            <button onClick={() => setShowAddGoal(true)} className="g-btn g-btn-primary" style={{ padding: '0 16px' }}>
              + New Goal
            </button>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="stats-row">
          {/* Card 1: Streak */}
          <div className="stat-box">
            <div className="stat-emoji">🔥</div>
            <div className="stat-content">
              <div className="stat-label">Current Streak</div>
              <div className="stat-val">{totalStreak} Days</div>
              <div className="stat-sub">Keep it up!</div>
            </div>
          </div>

          {/* Card 2: Goals Completed */}
          <div className="stat-box">
            <div className="stat-emoji">🏆</div>
            <div className="stat-content">
              <div className="stat-label">Goals Completed</div>
              <div className="stat-val">{completedGoals}</div>
              <div className="stat-sub">Total completed</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', alignSelf: 'stretch', paddingBottom: '4px' }}>
              <svg width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,20 Q15,4 30,16 T60,6" fill="none" stroke="var(--green-google)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 3: Habit Completion */}
          <div className="stat-box">
            <div className="stat-emoji">⚡</div>
            <div className="stat-content">
              <div className="stat-label">Habit Completion</div>
              <div className="stat-val">{habitCompletion}%</div>
              <div className="stat-sub">This week</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', alignSelf: 'stretch', paddingBottom: '4px' }}>
              <svg width="60" height="24" viewBox="0 0 60 24">
                <path d="M0,22 Q15,8 30,18 T60,2" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 4: Weekly Progress */}
          <div className="stat-box">
            <div className="stat-emoji">📈</div>
            <div className="stat-content">
              <div className="stat-label">Weekly Progress</div>
              <div className="stat-val">+{Math.min(overallProgress, 99)}%</div>
              <div className="stat-sub">vs last week</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', alignSelf: 'stretch', paddingBottom: '4px' }}>
              <svg width="60" height="24" viewBox="0 0 60 24">
                <line x1="0" y1="12" x2="60" y2="12" stroke="var(--text-3)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Card 5: Circular progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px 12px', height: '100%', minHeight: '84px', boxShadow: '0 1px 2px rgba(60,64,67,.05)' }}>
            <CircularProgress value={overallProgress} size={68} />
          </div>
        </div>

        {/* ── SECTION HEADER ── */}
        <div className="sec-header">
          <span className="sec-title">Long-Term Goals</span>
          <button className="sec-link" onClick={() => setShowAddHabit(true)}>View All Habits →</button>
        </div>

        {/* Empty state Habits card (replicates reference screen mockup) */}
        {habits.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '40px 16px', textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>💪</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '4px' }}>No habits yet</div>
            <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '14px' }}>Start small. Build consistency. Track every win.</div>
            <button onClick={() => setShowAddHabit(true)} style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', padding: '0 16px', height: '36px', borderRadius: '18px', fontWeight: 500, fontSize: '13px', cursor: 'pointer' }}>Add First Habit</button>
          </div>
        ) : (
          <div className="habits-grid" style={{ marginBottom: '24px' }}>
            {habits.map(habit => {
              const completedToday = (habit.completedDates || []).includes(today);
              const todayVal = habit.todayValue || 0;
              const pct = Math.min(100, Math.round((todayVal / (habit.targetValue || 1)) * 100));
              return (
                <div key={habit.id} className="habit-card" style={{ borderColor: completedToday ? `${habit.color || '#1A73E8'}44` : undefined }}>
                  <div className="habit-header">
                    <span className="habit-icon">{habit.icon || '💪'}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="habit-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{habit.title}</div>
                      <div className="habit-streak">🔥 {habit.streak || 0} Day Streak</div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '14px', padding: '2px' }}>✕</button>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-2)', marginBottom: '6px' }}>
                    Goal: {habit.targetValue} {habit.unit}
                  </div>
                  <div style={{ height: '5px', background: 'var(--surface-2)', borderRadius: '3px', marginBottom: '4px' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: habit.color || '#1A73E8', width: `${completedToday ? 100 : pct}%`, transition: 'width 0.4s ease' }} />
                  </div>
                  <div className="habit-progress-row">
                    <span>{completedToday ? habit.targetValue : todayVal} / {habit.targetValue} {habit.unit}</span>
                    <span>{completedToday ? '✓ Done' : `${pct}%`}</span>
                  </div>

                  <button
                    className={`mark-btn ${completedToday ? 'done' : 'todo'}`}
                    onClick={() => markHabitComplete(habit)}
                  >
                    {completedToday ? '✓ Completed Today' : '◎ Mark Complete'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Goals list rendering if present (allows users to see goals if they add them) */}
        {goals.length > 0 && (
          <>
            <div className="sec-header" style={{ marginTop: '12px' }}>
              <span className="sec-title">Goals Progress</span>
              <button className="sec-link" onClick={() => setShowAddGoal(true)}>View All Goals →</button>
            </div>
            <div className="goals-grid">
              {goals.map(goal => {
                const pc = priorityColor(goal.priority);
                const milestoneCount = goal.milestones?.length || 0;
                const doneMilestones = goal.completedMilestones || 0;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <div className="goal-icon-box">{goal.icon || '🎯'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="goal-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{goal.title}</div>
                        <span style={{ fontSize: '11px', fontWeight: '500', color: pc.color, background: pc.bg, padding: '1px 6px', borderRadius: '4px' }}>{goal.priority || 'Medium'}</span>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '15px' }}>✕</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{goal.progress || 0}% complete</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => updateGoalProgress(goal, -10)} style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--text-1)', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <button onClick={() => updateGoalProgress(goal, 10)} style={{ background: 'var(--blue-light)', border: 'none', color: 'var(--blue)', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${goal.progress || 0}%` }} />
                    </div>

                    <div className="goal-meta">
                      <div className="goal-meta-item">
                        <label>Target</label>
                        <span>{goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en',{month:'short',year:'numeric'}) : 'No date'}</span>
                      </div>
                      <div className="goal-meta-item">
                        <label>Milestones</label>
                        <span>{doneMilestones} / {milestoneCount}</span>
                      </div>
                      <div className="goal-meta-item">
                        <label>Category</label>
                        <span>{goal.category || 'General'}</span>
                      </div>
                    </div>

                    {goal.milestones?.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Milestone</div>
                        {goal.milestones.slice(0, 3).map((m, i) => {
                          const done = (goal.completedMilestonesList || []).includes(i);
                          return (
                            <div key={i} className="milestone-item" onClick={() => toggleMilestone(goal, i)}>
                              <div className={`milestone-check ${done ? 'done' : ''}`}>
                                {done && <span style={{ color: 'white', fontSize: '9px' }}>✓</span>}
                              </div>
                              <span className={`milestone-text ${done ? 'done' : ''}`}>{m}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── BOTTOM GRID ── */}
        <div className="bottom-grid">
          {/* Habit Calendar heatmap */}
          <div className="panel-box">
            <div className="panel-title">
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-2)' }}>Habit Calendar</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select value={calMonth} onChange={e => setCalMonth(Number(e.target.value))}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', borderRadius: '6px', padding: '2px 6px', color: 'var(--text-1)', fontSize: '12px', outline: 'none' }}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y=>y-1); } else setCalMonth(m=>m-1); }}
                  style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--text-1)', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>‹</button>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y=>y+1); } else setCalMonth(m=>m+1); }}
                  style={{ background: 'var(--surface-2)', border: 'none', color: 'var(--text-1)', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px' }}>›</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingTop: '22px' }}>
                {weekLabels.map(d => <div key={d} style={{ height: '14px', fontSize: '10px', color: 'var(--text-3)', textAlign: 'right', paddingRight: '4px', lineHeight: '14px' }}>{d}</div>)}
              </div>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '2px', marginBottom: '6px' }}>
                  {['Week 1','Week 2','Week 3','Week 4','Week 5'].map(w => <div key={w} style={{ fontSize: '9px', color: 'var(--text-3)', textAlign: 'center' }}>{w}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.ceil((daysInMonth + firstDay) / 7)}, 1fr)`, gridTemplateRows: 'repeat(7, 14px)', gap: '3px', gridAutoFlow: 'column' }}>
                  {Array.from({ length: Math.ceil((daysInMonth + firstDay) / 7) * 7 }).map((_, idx) => {
                    const col = Math.floor(idx / 7);
                    const row = idx % 7;
                    const dayNum = col * 7 + row - firstDay + 1;
                    if (dayNum < 1 || dayNum > daysInMonth) {
                      return <div key={idx} />;
                    }
                    const dateKey = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
                    const count = dateCountMap[dateKey] || 0;
                    const isToday = dateKey === getToday();
                    return (
                      <div key={idx} title={`${dateKey}: ${count} habits`} style={{
                        width: '14px', height: '14px', borderRadius: '2px',
                        background: getCellColor(count),
                        border: count === 0 ? '1px solid var(--border-2)' : 'none',
                        outline: isToday ? '1.5px solid var(--blue)' : 'none',
                      }} />
                    );
                  })}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '14px', marginTop: '12px', fontSize: '11px', color: 'var(--text-3)' }}>
              {[['var(--green-google)','Great'],['#A8D5B5','Good'],['#FFFFFF','Missed']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: c, border: c === '#FFFFFF' ? '1px solid var(--border-2)' : 'none' }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="panel-box">
            <div className="panel-title"><span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-2)' }}>Upcoming Milestones</span></div>
            {upcomingMilestones.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', padding: '24px 0' }}>
                {goals.length === 0 ? 'Add goals to see milestones' : 'All milestones complete! 🎉'}
              </div>
            ) : (
              upcomingMilestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: i < upcomingMilestones.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}
                  onClick={() => toggleMilestone(m.goal, m.idx)}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === 0 ? 'var(--blue)' : i === 1 ? 'var(--amber)' : 'var(--text-3)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{m.goalTitle}</div>
                  </div>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '1.5px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── footer brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '32px 0 16px', fontSize: '12px', color: 'var(--text-3)' }}>
          <span style={{ fontWeight: 400 }}>powered by</span>
          <span style={{ color: '#4285F4', fontWeight: 700 }}>G</span>
          <span style={{ color: '#EA4335', fontWeight: 700 }}>o</span>
          <span style={{ color: '#FBBC05', fontWeight: 700 }}>o</span>
          <span style={{ color: '#4285F4', fontWeight: 700 }}>g</span>
          <span style={{ color: '#34A853', fontWeight: 700 }}>l</span>
          <span style={{ color: '#EA4335', fontWeight: 700 }}>e</span>
          <span style={{ fontWeight: 700, marginLeft: '2px', color: 'var(--text-2)' }}>Gemini</span>
        </div>

        {/* ── floating Ask Gemini button ── */}
        <button style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF',
          color: 'var(--text-1)', border: '1px solid var(--border-2)',
          boxShadow: 'var(--shadow-2)', padding: '0 20px', height: '40px',
          borderRadius: '20px', fontWeight: 500, fontSize: '14px', cursor: 'pointer',
          fontFamily: 'var(--font)'
        }} onClick={() => navigate('/chat')}>
          <span style={{ color: 'var(--blue)', fontSize: '15px', fontWeight: 'bold' }}>✦</span> Ask Gemini
        </button>

      </div>

      {/* Modals */}
      {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onSave={addGoal} />}
      {showAddHabit && <AddHabitModal onClose={() => setShowAddHabit(false)} onSave={addHabit} />}
    </>
  );
}
