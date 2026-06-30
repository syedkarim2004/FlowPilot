import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TodaysFocus({ tasks }) {
  const navigate = useNavigate();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes default

  const focusTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    // Get highest priorityScore active task
    const active = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    return active.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];
  }, [tasks]);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  const handleStartTimer = () => {
    if (!isTimerActive && focusTask) {
      // Set timer to estimated task hours * 60 minutes * 60 seconds (max 90 minutes)
      const hours = focusTask.estimatedHours || 1;
      const seconds = Math.min(90 * 60, Math.round(hours * 3600));
      setTimeLeft(seconds);
    }
    setIsTimerActive(!isTimerActive);
  };

  const handleResetTimer = () => {
    setIsTimerActive(false);
    setTimeLeft(1500);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDueTime = (deadlineStr) => {
    if (!deadlineStr) return 'No time';
    const date = new Date(deadlineStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityLabel = (score) => {
    const s = score || 50;
    if (s > 85) return 'Urgent';
    if (s > 65) return 'High';
    if (s > 40) return 'Medium';
    return 'Low';
  };

  const getPriorityBadgeClass = (score) => {
    const s = score || 50;
    if (s > 85) return 'fp-badge-red';
    if (s > 65) return 'fp-badge-yellow';
    if (s > 40) return 'fp-badge-blue';
    return 'fp-badge-green';
  };

  if (!focusTask) {
    return (
      <div className="fp-card p-5 flex flex-col items-center justify-center text-center gap-3 min-h-[180px]">
        <div className="text-3xl">🎯</div>
        <h4 className="text-sm font-semibold text-text-primary">Today's Focus</h4>
        <p className="text-xs text-text-secondary">
          No tasks scheduled today. Add tasks to set your primary focus.
        </p>
      </div>
    );
  }

  return (
    <div className="fp-card p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-1">
            Today's Focus
          </h3>
          <p className="text-xs text-text-secondary">
            Execute your single most critical objective today
          </p>
        </div>
        <span className={`fp-badge ${getPriorityBadgeClass(focusTask.priorityScore)}`}>
          {getPriorityLabel(focusTask.priorityScore)} Priority
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 bg-surface p-4 rounded-2xl border border-border">
        {/* Timer visual */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="42" fill="none" stroke="var(--border-color)" strokeWidth="4" />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="var(--accent-blue)"
              strokeWidth="4"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={
                2 * Math.PI * 42 * (1 - timeLeft / (focusTask.estimatedHours ? Math.min(90 * 60, focusTask.estimatedHours * 3600) : 1500))
              }
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-base font-bold text-text-primary font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Task Details */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h4
            onClick={() => navigate(`/task/${focusTask.id}`)}
            className="text-base font-semibold text-text-primary truncate cursor-pointer hover:text-accent-blue transition-colors"
          >
            {focusTask.title}
          </h4>
          <p className="text-xs text-text-secondary mt-1 line-clamp-1">
            {focusTask.description || 'No description provided.'}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-3 text-xs text-text-secondary">
            <span>⏱️ {focusTask.estimatedHours || 1} hrs est</span>
            <span>⏰ Due {formatDueTime(focusTask.deadline)}</span>
            <span>📂 {focusTask.category || 'Work'}</span>
          </div>
        </div>

        {/* Start / Control Buttons */}
        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            onClick={handleStartTimer}
            className={`fp-btn fp-btn-sm ${isTimerActive ? 'fp-btn-secondary' : 'fp-btn-primary'} px-4 py-2 justify-center`}
          >
            {isTimerActive ? '⏸️ Pause' : '▶️ Start Focus'}
          </button>
          {isTimerActive && (
            <button
              onClick={handleResetTimer}
              className="fp-btn fp-btn-secondary fp-btn-sm px-4 py-2 justify-center"
            >
              ⏹️ Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
