import { useEffect, useState } from 'react';

export default function ProductivityGauge({ score = 0, label = 'Productivity', trend = null }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (safeScore / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(safeScore * eased);
      setAnimatedScore(start);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [safeScore]);

  // Color mapping based on score using theme colors
  const getStrokeColor = (s) => {
    if (s >= 70) return 'var(--accent-green)';
    if (s >= 40) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  const strokeColor = getStrokeColor(safeScore);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-text-primary">
            {animatedScore}
          </span>
          <span className="text-[10px] text-text-secondary mt-[-2px]">%</span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          {label}
        </span>
        {trend && (
          <span className={`text-[10px] font-medium ${trend.startsWith('+') ? 'text-accent-green' : 'text-accent-red'}`}>
            {trend} vs yesterday
          </span>
        )}
      </div>
    </div>
  );
}
