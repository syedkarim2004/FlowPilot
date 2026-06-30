import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7AM to 8PM

export default function FocusTimeline({ sessions, tasks }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timelineSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.map(s => {
      const timeStr = s.startTime || s.time || '09:00';
      const [hStr, mStr] = timeStr.split(':');
      const hour = parseInt(hStr, 10);
      const min = parseInt(mStr, 10);
      const duration = s.durationMinutes || s.duration || 45;

      // Check if session type matches deep, light, or break
      const sType = s.type || 'focus';

      // Find matching task object if available
      const matchingTask = tasks?.find(t => t.title?.toLowerCase() === s.taskTitle?.toLowerCase() || t.id === s.taskId);

      return {
        ...s,
        hour,
        min,
        duration,
        sType,
        matchingTask
      };
    });
  }, [sessions, tasks]);

  // Calculate current time line position
  const currentTimePosition = useMemo(() => {
    const hour = now.getHours();
    const min = now.getMinutes();

    if (hour < 7 || hour >= 21) return null; // Outside timeline view

    const totalMinutesSince7AM = (hour - 7) * 60 + min;
    const totalTimelineMinutes = 14 * 60; // 14 hours total
    return (totalMinutesSince7AM / totalTimelineMinutes) * 100;
  }, [now]);

  const getTypeColor = (type) => {
    if (type === 'break') return 'var(--accent-green)';
    if (type === 'review') return 'var(--accent-yellow)';
    return 'var(--accent-blue)';
  };

  const getSessionPositionStyle = (session) => {
    const startHour = session.hour;
    const startMin = session.min;
    const duration = session.duration;

    const startMinutesSince7AM = (startHour - 7) * 60 + startMin;
    const totalTimelineMinutes = 14 * 60;

    const topOffset = (startMinutesSince7AM / totalTimelineMinutes) * 100;
    const heightPercent = (duration / totalTimelineMinutes) * 100;

    return {
      top: `${topOffset}%`,
      height: `${heightPercent}%`,
      minHeight: '28px'
    };
  };

  return (
    <div className="fp-card p-5 flex flex-col gap-4 min-h-[360px] animate-fade-in">
      <div>
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-1">
          Focus Timeline
        </h3>
        <p className="text-xs text-text-secondary">
          Today's work sessions and scheduling blocks
        </p>
      </div>

      {timelineSessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 p-10 text-text-tertiary">
          <span className="text-2xl">⏳</span>
          <p className="text-xs">No work blocks scheduled yet.</p>
        </div>
      ) : (
        <div className="relative flex-1 min-h-[300px] border border-border rounded-xl bg-surface p-4 overflow-hidden select-none">
          {/* Time Grids */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
            {HOURS.map((h) => (
              <div
                key={h}
                className="w-full flex items-center border-t border-border/40"
                style={{ height: `${100 / HOURS.length}%` }}
              >
                <span className="text-[9px] font-mono font-medium text-text-tertiary ml-2 transform -translate-y-1/2">
                  {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
                </span>
              </div>
            ))}
          </div>

          {/* Sessions block container */}
          <div className="relative w-full h-full pl-16 pr-2">
            {timelineSessions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => s.matchingTask?.id && navigate(`/task/${s.matchingTask.id}`)}
                className={`absolute left-16 right-2 rounded-lg p-2 flex flex-col justify-center border-l-[3px] bg-card hover:bg-card-hover border border-border shadow-sm transition-all duration-150 ${
                  s.matchingTask ? 'cursor-pointer hover:translate-x-0.5' : ''
                }`}
                style={{
                  ...getSessionPositionStyle(s),
                  borderLeftColor: getTypeColor(s.sType),
                }}
              >
                <span className="text-xs font-semibold text-text-primary truncate">
                  {s.title}
                </span>
                <span className="text-[9px] text-text-secondary truncate mt-0.5">
                  {s.time} ({s.duration} min)
                </span>
              </div>
            ))}

            {/* Current time line indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 flex items-center z-10 pointer-events-none"
                style={{ top: `${currentTimePosition}%` }}
              >
                <div className="w-2 h-2 rounded-full bg-accent-red-solid shrink-0 ml-12" />
                <div className="flex-1 h-[1.5px] bg-accent-red-solid" />
                <span className="text-[9px] font-bold text-accent-red-solid bg-primary px-1.5 py-0.5 rounded border border-accent-red/20 mr-2 font-mono">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
