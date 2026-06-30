import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { goalAPI } from '../api';

export default function GoalDetailPage() {
  const { goalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakingDown, setBreakingDown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !goalId) return;

    // Fetch Goal Details
    const fetchGoal = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'goals', goalId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setGoal({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Goal not found');
        }
      } catch (err) {
        console.error("Error fetching goal", err);
        setError('Failed to load goal');
      }
    };
    
    fetchGoal();

    // Listen to tasks linked to this goal
    const q = query(
      collection(db, 'users', user.uid, 'tasks'),
      where('goalId', '==', goalId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return unsub;
  }, [user, goalId]);

  const handleBreakdown = async () => {
    if (!goal) return;
    setBreakingDown(true);
    setError('');

    try {
      const response = await goalAPI.breakdown(goal.title, goal.description || '');
      const aiTasks = response.data || [];

      if (aiTasks.length === 0) {
        throw new Error('AI returned no tasks');
      }

      // Add each task to Firestore
      for (const t of aiTasks) {
        await addDoc(collection(db, 'users', user.uid, 'tasks'), {
          title: t.title,
          description: t.description || '',
          estimatedHours: t.estimatedHours || 1,
          priority: t.priority || 50,
          riskScore: 0,
          status: 'todo',
          goalId: goalId,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to breakdown goal: ' + err.message);
    } finally {
      setBreakingDown(false);
    }
  };

  if (loading && !goal) {
    return <div className="p-8 text-text-muted text-[13px] font-medium">Loading goal...</div>;
  }

  if (error && !goal) {
    return (
      <div className="p-8 flex flex-col gap-4 items-start">
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[14px] font-bold tracking-wide shadow-sm">
          {error}
        </div>
        <button onClick={() => navigate('/goals')} className="fp-btn fp-btn-secondary fp-btn-md font-bold">Back to Goals</button>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : (goal?.progress || 0);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 flex flex-col gap-8 h-full overflow-y-auto">
      {/* ─── Breadcrumb ─── */}
      <div className="flex items-center gap-2 text-[14px] font-bold text-text-muted shrink-0">
        <button onClick={() => navigate('/goals')} className="hover:text-text-primary transition-colors">Goals</button>
        <span>/</span>
        <span className="text-text-primary truncate">{goal?.title}</span>
      </div>

      {/* ─── Header ─── */}
      <div className="bg-surface-1/50 border border-border-subtle rounded-[24px] p-10 flex flex-col gap-6 relative overflow-hidden shadow-card shrink-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-primary/5 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <span className="text-[36px]">{goal?.icon || '🎯'}</span>
              <h1 className="text-[36px] font-[900] tracking-tight text-text-primary leading-none">{goal?.title}</h1>
            </div>
            {goal?.description && (
              <p className="text-text-secondary mt-2 max-w-2xl text-[15px] leading-relaxed font-medium">{goal.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 bg-surface-2/50 border border-border-subtle p-4 rounded-2xl shadow-inner">
            <span className="text-[40px] font-[900] text-accent-primary leading-none">{progressPercent}%</span>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest mt-1">Progress</span>
          </div>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-[14px] font-bold tracking-wide shadow-sm shrink-0">{error}</div>}

      {/* ─── Breakdown Area ─── */}
      <div className="bg-surface-1/50 border border-border-subtle rounded-[24px] p-10 flex flex-col gap-8 shadow-card shrink-0 mb-10">
        <div className="flex justify-between items-center">
          <h2 className="text-[20px] font-bold text-text-primary tracking-wide">Action Plan</h2>
          {tasks.length === 0 && (
            <button 
              onClick={handleBreakdown} 
              disabled={breakingDown}
              className={`fp-btn fp-btn-lg fp-btn-primary shadow-glow px-6 font-bold flex gap-3 items-center ${breakingDown ? 'opacity-80 cursor-wait' : ''}`}
            >
              {breakingDown ? (
                <>
                  <span className="animate-spin inline-block">✺</span> Analyzing Goal...
                </>
              ) : (
                <>
                  <span className="text-[18px] leading-none">✨</span> Auto-Breakdown Goal
                </>
              )}
            </button>
          )}
        </div>

        {tasks.length === 0 && !breakingDown && (
          <div className="text-center py-20 flex flex-col items-center border border-dashed border-border-accent/40 rounded-2xl bg-surface-2/30 shadow-inner">
            <span className="text-[48px] mb-6 opacity-50 drop-shadow-lg">🧠</span>
            <div className="text-[18px] font-bold text-text-primary mb-3">Goal is too big?</div>
            <div className="text-[14px] text-text-secondary max-w-md font-medium leading-relaxed">Let our AI Co-Pilot break this massive goal down into 10 sequential, actionable tasks.</div>
          </div>
        )}

        {breakingDown && (
          <div className="flex flex-col gap-4 py-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-surface-2/50 border border-border-subtle rounded-xl animate-pulse shadow-sm" />
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="flex flex-col gap-4">
            {tasks.map(task => (
              <div key={task.id} onClick={() => navigate('/task/' + task.id)} className="bg-surface-2/40 border border-border-subtle p-5 rounded-xl flex items-center justify-between cursor-pointer hover:border-accent-primary/40 hover:bg-surface-2 transition-all shadow-sm group">
                <div className="flex flex-col gap-1.5">
                  <div className="font-bold text-[15px] text-text-primary group-hover:text-accent-primary transition-colors">{task.title}</div>
                  <div className="text-[13px] text-text-secondary font-medium">{task.description?.slice(0, 80)}{task.description?.length > 80 ? '...' : ''}</div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-[12px] font-bold text-text-muted bg-surface-3 border border-border-subtle px-3 py-1 rounded-full shadow-inner">{task.estimatedHours}h</div>
                  <div className={`w-3.5 h-3.5 rounded-full shadow-sm ${task.status === 'completed' ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-surface-3 border border-border-accent'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
