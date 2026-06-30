import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ProductivityTwinPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'tasks'), snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    // Load cached insights
    getDoc(doc(db, 'users', user.uid, 'meta', 'twin')).then(snap => {
      if (snap.exists()) setInsights(snap.data());
    });
    return () => unsub();
  }, [user?.uid]);

  const generateInsights = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API}/api/twin/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await user.getIdToken?.() || ''}` },
        body: JSON.stringify({ tasks, userId: user.uid }),
      });
      const data = await res.json();
      if (data?.data) setInsights(data.data);
    } catch (err) {
      console.error(err);
      // Local analysis fallback
      const completed = tasks.filter(t => t.status === 'completed');
      const active = tasks.filter(t => t.status !== 'completed');
      const avgRisk = active.length > 0 ? Math.round(active.reduce((s,t) => s+(t.riskScore||0),0)/active.length) : 0;
      setInsights({
        productivityScore: Math.round((completed.length / Math.max(tasks.length,1)) * 100),
        workPattern: completed.length > 2 ? 'Consistent closer' : 'Building momentum',
        strongestCategory: tasks.reduce((acc, t) => { acc[t.category||'General'] = (acc[t.category||'General']||0)+1; return acc; }, {}),
        riskTendency: avgRisk > 60 ? 'High-stakes focus' : 'Balanced approach',
        insights: [
          `You have ${active.length} active tasks with an average risk score of ${avgRisk}/100.`,
          completed.length > 0 ? `You've completed ${completed.length} tasks — your completion rate is ${Math.round((completed.length/tasks.length)*100)}%.` : 'Complete your first task to unlock completion insights.',
          avgRisk > 70 ? 'Your workload is high-risk. Consider using Rescue Mode on critical tasks.' : 'Your risk profile is healthy. Keep current pace.',
        ],
        recommendations: [
          'Schedule your highest-risk tasks during morning hours when focus is peak.',
          'Break tasks with >10h estimate into daily milestones.',
          'Use AI Agent to auto-schedule every morning for optimal flow.',
        ],
        focusScore: Math.max(20, 100 - avgRisk),
        burnoutRisk: avgRisk > 75 ? 'High' : avgRisk > 50 ? 'Medium' : 'Low',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const avgRisk = activeTasks.length > 0 ? Math.round(activeTasks.reduce((s,t) => s+(t.riskScore||0),0)/activeTasks.length) : 0;
  const focusScore = Math.max(10, 100 - avgRisk);

  const burnoutColor = avgRisk > 75 ? '#ef4444' : avgRisk > 50 ? '#f59e0b' : '#22c55e';
  const burnoutLabel = avgRisk > 75 ? 'High Risk' : avgRisk > 50 ? 'Moderate' : 'Low Risk';

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Inter, -apple-system, sans-serif', color: '#f1f5f9', maxWidth: '1100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', margin: '0 0 6px' }}>
            Productivity Twin
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            Your AI-powered productivity mirror — patterns, predictions, and personalized insights
          </p>
        </div>
        <button onClick={generateInsights} disabled={analyzing} style={{
          padding: '10px 20px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: 'none', color: 'white', fontSize: '13px', fontWeight: '600',
          cursor: analyzing ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          opacity: analyzing ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {analyzing ? '🧠 Analyzing...' : '✦ Analyze My Patterns'}
        </button>
      </div>

      {/* Core metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Focus Score', value: `${focusScore}%`, color: focusScore > 70 ? '#22c55e' : '#f59e0b', icon: '🎯', sub: 'Cognitive clarity' },
          { label: 'Completion Rate', value: `${completionRate}%`, color: '#8b5cf6', icon: '✓', sub: `${completedTasks.length} of ${tasks.length} tasks` },
          { label: 'Burnout Risk', value: burnoutLabel, color: burnoutColor, icon: '⚡', sub: `Avg risk ${avgRisk}/100` },
          { label: 'Tasks Active', value: activeTasks.length, color: '#06b6d4', icon: '◈', sub: 'In progress now' },
        ].map(m => (
          <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '18px 20px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>{m.label}</div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: m.color, letterSpacing: '-1px' }}>{m.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
        {/* AI Insights */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
            ✦ AI Insights
          </div>
          {insights ? (
            (insights.insights || []).map((insight, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: i < (insights.insights?.length||0)-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                  {i === 0 ? '🎯' : i === 1 ? '📊' : '⚡'}
                </span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', margin: 0 }}>{insight}</p>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧠</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '14px' }}>
                Click "Analyze My Patterns" to get personalized AI insights about your productivity style
              </div>
              <button onClick={generateInsights} style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Generate Insights →
              </button>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Recommendations
          </div>
          {insights?.recommendations ? (
            insights.recommendations.map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', padding: '10px 12px', background: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.1)' }}>
                <span style={{ color: '#8b5cf6', fontSize: '14px', flexShrink: 0 }}>→</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: '1.5' }}>{rec}</p>
              </div>
            ))
          ) : (
            [
              'Schedule high-priority tasks during your peak focus hours (morning)',
              'Use Rescue Mode for tasks with >80 risk score immediately',
              'Break large tasks into 2-hour focused work blocks',
            ].map((rec, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px 12px', background: 'rgba(139,92,246,0.04)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.08)' }}>
                <span style={{ color: '#8b5cf6', fontSize: '14px', flexShrink: 0 }}>→</span>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.5' }}>{rec}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Task breakdown by category */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
          Task Distribution
        </div>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Add tasks to see your productivity distribution</div>
        ) : (
          (() => {
            const cats = {};
            tasks.forEach(t => { const c = t.category || 'General'; cats[c] = (cats[c]||0)+1; });
            const total = tasks.length;
            const colors = ['#8b5cf6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899'];
            return Object.entries(cats).map(([cat, count], i) => (
              <div key={cat} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{cat}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{count} tasks ({Math.round(count/total*100)}%)</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                  <div style={{ height: '100%', borderRadius: '3px', background: colors[i % colors.length], width: `${count/total*100}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
