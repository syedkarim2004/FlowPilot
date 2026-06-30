import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'#FFFFFF',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',boxShadow:'var(--shadow-1)'}}>
      <div style={{fontSize:11,color:'var(--text-3)',marginBottom:4}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{fontSize:12,color:p.color||'var(--text-1)',fontWeight:600}}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

export default function TelegramCompanionPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [settings, setSettings] = useState({
    connected: false,
    chatId: null,
    preferences: {
      morningBrief: true,
      eveningSummary: true,
      aiPlanner: true,
      focusAlerts: true,
      pomodoro: true,
      smartReminders: true,
      deadlineAlerts: true,
      weeklyReport: true,
      monthlyInsights: true,
      motivationalMessages: true
    },
    schedule: {
      morningTime: "08:30",
      eveningTime: "18:30",
      reminderFrequency: "every_4_hours",
      focusInterval: "30",
      weekendSummary: true,
      timezone: "UTC",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00"
    },
    analytics: {
      messagesSent: 0,
      streak: 3,
      lastMessageDate: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Fetch settings from server
  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        const token = await user.getIdToken();
        const res = await axios.get(`${BASE_URL}/api/telegram/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load telegram settings:', err);
        addToast('Failed to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  // Polling for Telegram connection status
  useEffect(() => {
    let intervalId;
    if (user && settings && !settings.connected) {
      intervalId = setInterval(async () => {
        try {
          const token = await user.getIdToken();
          const res = await axios.get(`${BASE_URL}/api/telegram/settings`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.connected) {
            setSettings(res.data);
            addToast('Telegram connected successfully!', 'success');
          }
        } catch (err) {
          // ignore polling errors
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, settings?.connected]);

  const handleToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key]
      }
    }));
  };

  const handleScheduleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    if (saving || !user) return;
    setSaving(true);
    try {
      const token = await user.getIdToken();
      await axios.post(`${BASE_URL}/api/telegram/settings`, {
        preferences: settings.preferences,
        schedule: settings.schedule
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      addToast('Telegram settings saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`${BASE_URL}/api/telegram/connect-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { linkToken } = res.data;
      if (linkToken) {
        window.open(`https://t.me/flowpilot_ai_assistant_bot?start=${linkToken}`, '_blank');
      } else {
        addToast('Failed to generate connection token', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to generate connection token', 'error');
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to disconnect Telegram?')) return;
    try {
      const token = await user.getIdToken();
      await axios.post(`${BASE_URL}/api/telegram/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(prev => ({
        ...prev,
        connected: false,
        chatId: null
      }));
      addToast('Telegram disconnected successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to disconnect Telegram', 'error');
    }
  };

  const handleSendTest = async () => {
    if (testing || !user) return;
    setTesting(true);
    try {
      const token = await user.getIdToken();
      const res = await axios.post(`${BASE_URL}/api/telegram/test-message`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        addToast('Test message sent to Telegram!', 'success');
        setSettings(prev => ({
          ...prev,
          analytics: {
            ...prev.analytics,
            messagesSent: (prev.analytics?.messagesSent || 0) + 1
          }
        }));
      } else {
        addToast('Failed to send test message. Check bot connection.', 'error');
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to send test message', 'error');
    } finally {
      setTesting(false);
    }
  };

  // Mock charts stats for Telegram Messages Delivered
  const chartData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 6 },
    { name: 'Wed', count: 5 },
    { name: 'Thu', count: 8 },
    { name: 'Fri', count: 7 },
    { name: 'Sat', count: 3 },
    { name: 'Sun', count: 5 },
  ];

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-3)', fontSize: '13px' }}>Loading Telegram Companion...</div>;
  }

  const isConnected = settings?.connected || false;

  return (
    <div className="animate-in" style={{ paddingBottom: '60px' }}>
      
      <style>{`
        .tg-hero { background: linear-gradient(135deg, #0088CC 0%, #005580 100%); border-radius: 16px; padding: 24px; color: #FFFFFF; margin-bottom: 24px; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 136, 204, 0.2); }
        .tg-grid-2 { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
        .pref-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .tg-input-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        
        @media (max-width: 1024px) {
          .tg-grid-2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .pref-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Page Title ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>
          Telegram Companion
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
          Receive AI-powered schedules, reminders and productivity coaching directly inside Telegram.
        </p>
      </div>

      {/* ── Premium Hero Card ── */}
      <div className="tg-hero">
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.1, fontSize: '180px', pointerEvents: 'none' }}>
          ✉
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-1)' }}>
            <span style={{ fontSize: '24px', color: '#0088cc' }}>✈</span>
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Telegram Integrations OS</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#34A853' : '#DADCE0' }} />
              {isConnected ? 'Linked and Synced' : 'Not Connected'}
            </div>
          </div>
        </div>

        {/* Hero KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }} className="r-grid-2">
          {[
            { label: 'STATUS', val: isConnected ? 'CONNECTED' : 'NOT LINKED' },
            { label: 'SENT TODAY', val: isConnected ? `${settings.analytics?.messagesSent || 0} messages` : '0' },
            { label: 'MORNING BRIEF', val: settings.preferences?.morningBrief ? 'ACTIVE' : 'OFF' },
            { label: 'WEEKLY STREAK', val: isConnected ? `${settings.analytics?.streak || 3} days` : '—' },
            { label: 'AI CO-PILOT', val: '92/100' }
          ].map((kpi, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '10px 14px', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.8, letterSpacing: '0.5px' }}>{kpi.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>{kpi.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Splits Grid ── */}
      <div className="tg-grid-2">
        
        {/* Left Hand: Connection & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Telegram Connection Card */}
          <div className="g-card">
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '14px' }}>
              TELEGRAM CONNECTION STATUS
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>🤖</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>
                  FlowPilot AI Assistant {settings?.telegramUsername && <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '12px' }}>({settings.telegramUsername})</span>}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                  Bot: <a href="https://t.me/flowpilot_ai_assistant_bot" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 500 }}>@flowpilot_ai_assistant_bot</a>
                </div>
              </div>
              <div style={{
                background: isConnected ? 'var(--green-light)' : 'var(--surface-3)',
                color: isConnected ? 'var(--green)' : 'var(--text-3)',
                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px'
              }}>
                {isConnected ? '✓ Connected' : 'Not Connected'}
              </div>
            </div>

            {/* Connection Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {!isConnected ? (
                <button className="g-btn g-btn-primary" onClick={handleConnect} style={{ height: '36px' }}>
                  Connect Telegram
                </button>
              ) : (
                <>
                  <button className="g-btn g-btn-outlined" onClick={handleSendTest} disabled={testing}>
                    {testing ? 'Sending...' : 'Send Test Message'}
                  </button>
                  <button className="g-btn g-btn-outlined" onClick={handleConnect}>
                    Reconnect
                  </button>
                  <button className="g-btn g-btn-danger" style={{ marginLeft: 'auto' }} onClick={handleDisconnect}>
                    Disconnect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preferences Toggles */}
          {isConnected && (
            <div className="g-card">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '16px' }}>
                NOTIFICATION PREFERENCES
              </span>
              
              <div className="pref-grid">
                {[
                  { key: 'morningBrief', label: 'Morning Brief', desc: 'Summary of daily tasks at 8:30 AM' },
                  { key: 'eveningSummary', label: 'Evening Summary', desc: 'Analysis of completed tasks at 6:30 PM' },
                  { key: 'aiPlanner', label: 'AI Planner', desc: 'Auto-suggestions for re-routing alerts' },
                  { key: 'focusAlerts', label: 'Focus Session Alerts', desc: 'Quiet alerts when sprints start' },
                  { key: 'pomodoro', label: 'Pomodoro Notifications', desc: 'Work/break notifications' },
                  { key: 'smartReminders', label: 'Smart Reminders', desc: 'Reminders if task procrastination occurs' },
                  { key: 'deadlineAlerts', label: 'Deadline Alerts', desc: 'Urgent task alerts 2h before due' },
                  { key: 'weeklyReport', label: 'Weekly Report', desc: 'Workspace summary report on Sundays' }
                ].map(pref => (
                  <div key={pref.key} style={{
                    display: 'flex', alignItems: 'center', justifyContext: 'between', justifyContent: 'space-between',
                    padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '12px', background: '#FFFFFF'
                  }}>
                    <div style={{ flex: 1, marginRight: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)' }}>{pref.label}</span>
                      <p style={{ fontSize: '10px', color: 'var(--text-3)', margin: '1px 0 0' }}>{pref.desc}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={settings.preferences?.[pref.key] || false}
                      onChange={() => handleToggle(pref.key)}
                      style={{ width: '34px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Automation Schedule */}
          {isConnected && (
            <div className="g-card">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '16px' }}>
                AUTOMATION SCHEDULE
              </span>

              <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div className="tg-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>Morning Briefing Time</label>
                  <input type="time" className="g-input" value={settings.schedule?.morningTime || '08:30'} 
                    onChange={e => handleScheduleChange('morningTime', e.target.value)} />
                </div>
                <div className="tg-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>Evening Briefing Time</label>
                  <input type="time" className="g-input" value={settings.schedule?.eveningTime || '18:30'} 
                    onChange={e => handleScheduleChange('eveningTime', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div className="tg-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>Reminder Frequency</label>
                  <select className="g-input" value={settings.schedule?.reminderFrequency || 'every_4_hours'}
                    onChange={e => handleScheduleChange('reminderFrequency', e.target.value)}>
                    <option value="every_hour">Every Hour</option>
                    <option value="every_2_hours">Every 2 Hours</option>
                    <option value="every_4_hours">Every 4 Hours</option>
                    <option value="once_daily">Once Daily</option>
                  </select>
                </div>
                <div className="tg-input-group">
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)' }}>Timezone</label>
                  <select className="g-input" value={settings.schedule?.timezone || 'UTC'}
                    onChange={e => handleScheduleChange('timezone', e.target.value)}>
                    <option value="UTC">UTC (Universal Time)</option>
                    <option value="EST">EST (Eastern Time)</option>
                    <option value="PST">PST (Pacific Time)</option>
                    <option value="IST">IST (India Standard Time)</option>
                  </select>
                </div>
              </div>

              <button className="g-btn g-btn-primary" onClick={handleSaveSettings} disabled={saving} style={{ height: '36px', borderRadius: '8px' }}>
                {saving ? 'Saving...' : 'Save Automation Schedule'}
              </button>
            </div>
          )}

          {/* Automation Analytics */}
          {isConnected && (
            <div className="g-card">
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '14px' }}>
                Companion Analytics
              </span>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tgG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088cc" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#0088cc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Delivered Alerts" stroke="#0088cc" strokeWidth={2.5} fillOpacity={1} fill="url(#tgG)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>

        {/* Right Hand: AI Previews & Commands */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* AI Preview Panel */}
          <div className="g-card" style={{ padding: '20px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '14px' }}>
              AI BRIEFING PREVIEW
            </span>
            
            {/* Phone container */}
            <div style={{ border: '1px solid var(--border)', borderRadius: '16px', background: '#F4F6F9', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>✈</span>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-1)' }}>FlowPilot AI</div>
              </div>
              
              <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: '12px', fontSize: '12px', color: 'var(--text-1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', lineHeight: 1.5 }}>
                🌅 <b>Good Morning!</b><br/><br/>
                Today's Productivity Score: <b>92/100</b><br/><br/>
                Priority:<br/>
                • Complete AWS Lab<br/>
                • Solve 2 LeetCode Problems<br/>
                • Gym at 6 PM<br/><br/>
                Estimated Focus Time: <b>4h 10m</b><br/><br/>
                AI Recommendation:<br/>
                <i>Finish DSA before lunch because your historical productivity is highest between 9 AM and 11 AM.</i>
              </div>
            </div>
          </div>

          {/* Bot Commands */}
          <div className="g-card">
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>
              BOT SLASH COMMANDS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { cmd: '/start', desc: 'Securely link accounts' },
                { cmd: '/today', desc: 'View active daily schedule' },
                { cmd: '/stats', desc: 'Get workspace velocity metrics' },
                { cmd: '/tasks', desc: 'List top 5 high-risk tasks' },
                { cmd: '/help', desc: 'Show bot commands helper' }
              ].map(command => (
                <div key={command.cmd} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--blue)' }}>{command.cmd}</span>
                  <span style={{ color: 'var(--text-3)' }}>{command.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="g-card">
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', display: 'block', marginBottom: '12px' }}>
              AI CONTEXT SUGGESTIONS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', background: 'var(--blue-light)', color: 'var(--blue)', padding: '6px 10px', borderRadius: '8px', fontWeight: 500 }}>
                💡 You usually complete coding tasks before 11 AM.
              </div>
              <div style={{ fontSize: '11px', background: 'var(--amber-light)', color: 'var(--amber)', padding: '6px 10px', borderRadius: '8px', fontWeight: 500 }}>
                ⚠️ You postponed "Complete AWS Lab" three times.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
