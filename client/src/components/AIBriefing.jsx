import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AIBriefing({ tasks }) {
  const { user } = useAuth();
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);

  const firstName = user?.displayName?.split(' ')[0] || 'User';

  useEffect(() => {
    if (!tasks) return;

    const generateLocalBriefing = () => {
      const active = tasks.filter(t => t.status !== 'completed');
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const dueTodayOrOverdue = active.filter(t => {
        if (!t.deadline) return false;
        const d = t.deadline.split('T')[0];
        return d <= todayStr;
      });

      const overdue = active.filter(t => {
        if (!t.deadline) return false;
        return new Date(t.deadline) < now && t.deadline.split('T')[0] !== todayStr;
      });

      // Find highest priority task
      const highestPriority = [...active].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];

      const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';
      
      let recommendation = '';
      if (highestPriority) {
        recommendation = ` I recommend starting with "${highestPriority.title}" because it has your highest priority score.`;
      } else {
        recommendation = ' Add some tasks to get started with your day.';
      }

      return `${greeting} ${firstName}. You have ${dueTodayOrOverdue.length} tasks scheduled for today. ${
        overdue.length > 0 ? `${overdue.length} are overdue.` : 'None are overdue.'
      }${recommendation}`;
    };

    const fetchBriefing = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/plan/briefing', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.briefing) {
            setBriefing(json.data.briefing);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local
      }
      setBriefing(generateLocalBriefing());
      setLoading(false);
    };

    fetchBriefing();
  }, [tasks, user, firstName]);

  if (loading) {
    return (
      <div className="fp-card p-5 mb-6 flex items-center gap-3 bg-accent-purple-bg border-accent-purple/10">
        <span className="text-xl animate-pulse text-accent-purple">✦</span>
        <div className="fp-skeleton h-4 w-4/5 rounded" />
      </div>
    );
  }

  return (
    <div className="fp-card p-5 mb-6 bg-accent-purple-bg border border-accent-purple/10 animate-fade-in">
      <div className="flex gap-3.5 items-start">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-sm text-white shrink-0 mt-0.5 shadow-sm">
          ✦
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-relaxed m-0 whitespace-pre-line">
            {briefing}
          </p>
        </div>
      </div>
    </div>
  );
}
