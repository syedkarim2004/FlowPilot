import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { chatAPI, rescueAPI } from '../api';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';


export default function RescueModePage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [task, setTask] = useState(null);
  const [rescueData, setRescueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  // AutoPilot State
  const [autoPilotStep, setAutoPilotStep] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const [microSteps, setMicroSteps] = useState([]);
  const [autoPilotLoading, setAutoPilotLoading] = useState(false);

  const fetchRescueData = useCallback(async () => {
    if (!user) return;
    try {
      const ref = doc(db, 'users', user.uid, 'tasks', taskId);
      const snap = await getDoc(ref);
      const t = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      setTask(t);
      
      if (t) {
        const res = await rescueAPI.activate(t);
        setRescueData(res?.data || res);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [taskId, user]);

  useEffect(() => {
    fetchRescueData();
  }, [fetchRescueData]);

  // Live countdown timer to deadline
  useEffect(() => {
    if (!task?.deadline) return;

    const interval = setInterval(() => {
      const diff = new Date(task.deadline) - new Date();
      if (diff <= 0) {
        setCountdown('Overdue');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [task]);

  // AutoPilot Timer
  useEffect(() => {
    if (!autoPilotStep || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [autoPilotStep, timeLeft]);

  const startAutoPilot = (step) => {
    setAutoPilotStep(step);
    setTimeLeft((step.durationMinutes || 25) * 60);
    setMicroSteps([]);
    setIsStuck(false);
  };

  const handleStuck = async () => {
    setIsStuck(true);
    setAutoPilotLoading(true);
    try {
      const prompt = `I am stuck on this subtask: "${autoPilotStep.subtaskTitle || autoPilotStep.taskTitle}". Break this down into 3 microscopic, highly actionable steps. Format as JSON array of strings.`;
      const res = await chatAPI.send(prompt, [], 50, []);
      const reply = res.reply || res.data?.reply || "";
      // naive parse attempt
      const stepsMatch = reply.match(/\[([\s\S]*?)\]/);
      if (stepsMatch) {
        setMicroSteps(JSON.parse(stepsMatch[0]));
      } else {
        setMicroSteps(["Google the exact error", "Read one documentation page", "Try one small code change"]);
      }
    } catch {
      setMicroSteps(["Google it", "Take a 5 min break", "Ask for help"]);
    } finally {
      setAutoPilotLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ marginLeft: isMobile ? '0' : 'var(--sidebar-w)', padding: isMobile ? '16px' : '40px' }}>
        <div className="skeleton" style={{ height: '100px', borderRadius: '16px', marginBottom: '20px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  const scoreColor = rescueData?.survivabilityScore > 70 ? '#81c995' : rescueData?.survivabilityScore > 40 ? '#fdd663' : '#f28b82';

  return (
    <div style={{
      marginLeft: isMobile ? '0' : 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, rgba(242,139,130,0.08) 0%, var(--bg) 60%)',
      padding: '40px 32px',
    }}>
      {/* Rescue badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        background: 'rgba(242,139,130,0.1)', border: '1px solid rgba(242,139,130,0.2)',
        borderRadius: '20px', padding: '6px 14px', marginBottom: '24px',
        animation: 'pulse-red 2s infinite',
      }}>
        <span style={{fontSize: '14px'}}>🚨</span>
        <span style={{fontSize: '12px', fontWeight: '700', color: '#f28b82', letterSpacing: '1px'}}>RESCUE MODE ACTIVE</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* Task title + countdown */}
          <h1 style={{fontSize: '28px', fontWeight: '600', marginBottom: '8px', letterSpacing: '-0.5px'}}>
            {task?.title || 'Task'}
          </h1>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '32px', color: '#f28b82',
          }}>
            <span style={{fontSize: '14px'}}>⏱</span>
            <span style={{fontSize: '20px', fontWeight: '600', fontFamily: 'var(--font)'}}>{countdown}</span>
            <span style={{fontSize: '14px', color: 'var(--text-3)'}}>remaining</span>
          </div>
        </div>
        <button onClick={() => navigate(-1)} style={{
          padding: '8px 16px', borderRadius: '10px', fontSize: '13px',
          background: 'var(--glass)', border: '1px solid var(--glass-border)',
          color: 'var(--text-1)', cursor: 'pointer',
        }}>Exit Rescue Mode</button>
      </div>

      {/* Survivability score - big hero number */}
      <div className="glass-card" style={{
        padding: '32px', textAlign: 'center', marginBottom: '24px',
        borderColor: 'rgba(242,139,130,0.15)',
      }}>
        <div style={{fontSize: '12px', color: 'var(--text-3)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px'}}>
          Completion Probability
        </div>
        <div style={{
          fontSize: '72px', fontWeight: '700', letterSpacing: '-3px',
          color: scoreColor,
          lineHeight: 1, marginBottom: '8px',
        }}>{rescueData?.survivabilityScore || rescueData?.completionProbability || 0}%</div>
        <div style={{fontSize: '14px', color: 'var(--text-2)', fontStyle: 'italic'}}>
          {rescueData?.userMessage || 'Emergency plan activated.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Emergency Plan */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Emergency Plan</h2>
          {(rescueData?.emergencyPlan || rescueData?.rescueSchedule || []).map((step, i) => (
            <div key={i} style={{
              display: 'flex', gap: '16px', alignItems: 'flex-start',
              padding: '16px', borderRadius: '12px', marginBottom: '12px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ width: '48px', fontSize: '13px', color: 'var(--text-3)', flexShrink: 0, fontWeight: '500', paddingTop: '4px' }}>
                {step.time || step.startTime}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{step.subtaskTitle || step.taskTitle}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{step.durationMinutes}m focus block</div>
                
                {autoPilotStep === step ? (
                  <div style={{marginTop: '12px', padding: '16px', background: 'rgba(138,180,248,0.1)', borderRadius: '12px', border: '1px solid rgba(138,180,248,0.2)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
                      <span style={{fontSize: '12px', fontWeight: '600', color: '#8ab4f8', letterSpacing: '1px'}}>AUTOPILOT ENGAGED</span>
                      <span style={{fontSize: '24px', fontWeight: '700', fontFamily: 'var(--font)'}}>
                        {Math.floor(timeLeft/60).toString().padStart(2,'0')}:{(timeLeft%60).toString().padStart(2,'0')}
                      </span>
                    </div>
                    {isStuck ? (
                      <div style={{fontSize: '13px', color: 'var(--text-1)'}}>
                        {autoPilotLoading ? 'Analyzing...' : (
                          <ul style={{margin: 0, paddingLeft: '20px', lineHeight: '1.6'}}>
                            {microSteps.map((m, idx) => <li key={idx}>{m}</li>)}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => setAutoPilotStep(null)} style={{flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: '#8ab4f8', color: '#000', fontWeight: '600', cursor: 'pointer'}}>Complete</button>
                        <button onClick={handleStuck} style={{flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(242,139,130,0.5)', background: 'rgba(242,139,130,0.1)', color: '#f28b82', fontWeight: '500', cursor: 'pointer'}}>I'm Stuck!</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => startAutoPilot(step)} style={{
                    marginTop: '10px', fontSize: '11px', padding: '6px 12px', borderRadius: '6px',
                    background: 'var(--accent-bg)', color: 'var(--accent)', border: 'none', cursor: 'pointer'
                  }}>⚡ Start AutoPilot</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Critical Path */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-1)' }}>Critical Path (MUST DO)</h2>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
              {(rescueData?.criticalPath || []).map((item, i) => (
                <li key={i} style={{ marginBottom: '8px' }}>{item.title || item.name || item}</li>
              ))}
              {(!rescueData?.criticalPath || rescueData.criticalPath.length === 0) && <li>Focus on minimum deliverables.</li>}
            </ul>
          </div>

          {/* Can Skip */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--text-3)' }}>Can Skip (OPTIONAL)</h2>
            <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              {(rescueData?.canSkip || rescueData?.skipRecommendations || []).map((item, i) => (
                <li key={i} style={{ marginBottom: '8px', textDecoration: 'line-through' }}>{item.title || item.name || item}</li>
              ))}
              {(!rescueData?.canSkip || rescueData.canSkip.length === 0) && <li>No items identified to skip.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
