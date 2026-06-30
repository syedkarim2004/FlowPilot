import { useState, useEffect } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';
const LABELS = ['Work','Study','Personal','Health','Finance','Creative'];

export default function AddTaskModal({ onClose, onTaskAdded, prefilledDate }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hours, setHours] = useState('');
  const [labels, setLabels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ai, setAi] = useState(null);
  const [err, setErr] = useState('');

  // Handle prefilledDate from CalendarPage
  useEffect(() => {
    if (prefilledDate) {
      try {
        const d = new Date(prefilledDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDeadline(`${year}-${month}-${day}`);
      } catch (err) {
        console.error('Prefilled date parsing error:', err);
      }
    }
  }, [prefilledDate]);

  async function analyze() {
    if (!title.trim()) { setErr('Enter a title first.'); return; }
    setErr(''); setAnalyzing(true);
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`${API}/api/tasks/analyze`,
        { taskText: title+(description?' '+description:'')+(deadline?' Deadline: '+deadline:'') },
        { headers:{ Authorization:'Bearer '+token } });
      setAi(res.data);
      if (res.data.estimatedHours) setHours(String(res.data.estimatedHours));
    } catch(e) {
      setAi({ priority:50,riskScore:30,estimatedHours:parseFloat(hours)||1,
        subtasks:['Break it down','Execute','Review'],suggestion:'Start with the most important part.' });
    } finally { setAnalyzing(false); }
  }

  async function save() {
    if (!title.trim()) { setErr('Task title is required.'); return; }
    setErr(''); setSaving(true);
    
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        deadline: deadline ? new Date(deadline) : null,
        estimatedHours: parseFloat(hours) || (ai?.estimatedHours || 1),
        priority: ai?.priority || 50,
        riskScore: ai?.riskScore || 30,
        subtasks: (ai?.subtasks || []).map(s => typeof s === 'string' ? { title: s, completed: false } : s),
        status: 'active',
        createdAt: serverTimestamp(),
        completedAt: null,
        notes: '',
        labels,
        kanbanColumn: 'backlog',
      };

      await addDoc(collection(db, 'users', user.uid, 'tasks'), taskData);

      // Fire and forget agent log
      addDoc(collection(db, 'users', user.uid, 'agentLog'), {
        description: `Task "${taskData.title}" created. Priority: ${taskData.priority}/100, Risk: ${taskData.riskScore}/100.`,
        timestamp: new Date().toISOString(),
        eventType: 'task_created',
        color: '#22c55e',
      }).catch(() => {});
      
      const token = sessionStorage.getItem('gCalToken');
      if (token && taskData.deadline) {
        const endTime = new Date(taskData.deadline.getTime() + taskData.estimatedHours * 3600000);
        fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: taskData.title,
            description: 'Added from FlowPilot',
            start: { dateTime: taskData.deadline.toISOString() },
            end: { dateTime: endTime.toISOString() },
            colorId: taskData.riskScore >= 75 ? '11' : taskData.riskScore >= 50 ? '5' : '2',
          })
        }).catch(e => console.warn('Google Calendar sync failed:', e));
      }

      // CLOSE IMMEDIATELY — no delay
      setSaving(false);
      onTaskAdded?.();
      onClose?.();
      
    } catch(err) {
      console.error('[SAVE]', err);
      setErr(err.message || 'Save failed');
      setSaving(false);
    }
  }

  const toggleLabel = (l) => {
    setLabels(prev => prev.includes(l) ? prev.filter(item => item !== l) : [...prev, l]);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }} onClick={onClose}>
      <div className="modal-box" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px',
        boxShadow: 'var(--shadow-3)', display: 'flex', flexDirection: 'column',
        gap: '16px', maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-1)' }}>Create task</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', fontSize: '20px', cursor: 'pointer', minHeight: 32, display: 'flex', alignItems: 'center' }}>✕</button>
        </div>

        {err && <div style={{ fontSize: '13px', color: 'var(--red)', background: 'var(--red-light)', border: '1px solid #FCBFBE', padding: '8px 12px', borderRadius: '8px' }}>{err}</div>}

        {/* Title */}
        <div>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>Task Title</label>
          <input className="g-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Prepare slide deck" />
        </div>

        {/* Description */}
        <div>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>Description</label>
          <textarea className="g-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Task details..." rows={2} />
        </div>

        {/* Inputs row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="r-grid-1">
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>Deadline</label>
            <input type="date" className="g-input" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ colorScheme: 'light' }} />
          </div>
          <div>
            <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>Est. Hours</label>
            <input type="number" className="g-input" value={hours} onChange={e => setHours(e.target.value)} placeholder="1" min="0.5" step="0.5" />
          </div>
        </div>

        {/* Labels picker */}
        <div>
          <label className="g-label" style={{ display: 'block', marginBottom: '6px' }}>Labels</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {LABELS.map(l => {
              const selected = labels.includes(l);
              return (
                <button key={l} onClick={() => toggleLabel(l)} className="g-chip" style={{
                  cursor: 'pointer', background: selected ? 'var(--blue-light)' : 'var(--surface-2)',
                  color: selected ? 'var(--blue)' : 'var(--text-2)',
                  borderColor: selected ? 'var(--blue-mid)' : 'var(--border-2)'
                }}>{l}</button>
              );
            })}
          </div>
        </div>

        {/* AI suggestion panel */}
        {analyzing && (
          <div className="skeleton" style={{ height: '80px', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Analyzing task via FlowPilot AI...</span>
          </div>
        )}

        {ai && !analyzing && (
          <div className="animate-in" style={{
            background: 'var(--blue-light)', border: '1px solid var(--blue-mid)',
            borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--blue)' }}>✦ AI ESTIMATIONS</span>
              <span className="g-chip chip-blue" style={{ fontSize: '11px' }}>Priority: {ai.priority}%</span>
            </div>
            {ai.suggestion && <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.4 }}>{ai.suggestion}</p>}
            {ai.subtasks && ai.subtasks.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                <span className="g-label" style={{ fontSize: '10px', color: 'var(--text-3)' }}>SUGGESTED BREAKDOWN</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
                  {ai.subtasks.map((sub, i) => (
                    <div key={i} style={{ fontSize: '11px', color: 'var(--text-2)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--blue)', fontSize: '10px' }}>▪</span> {typeof sub === 'string' ? sub : sub.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="g-divider" />

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="g-btn g-btn-text" onClick={analyze} disabled={analyzing || saving} style={{ marginRight: 'auto', paddingLeft: 0 }}>
            ✦ AI Estimate
          </button>
          <button className="g-btn g-btn-outlined" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="g-btn g-btn-primary" onClick={save} disabled={saving}>{saving ? 'Adding...' : 'Add Task'}</button>
        </div>

      </div>
    </div>
  );
}
