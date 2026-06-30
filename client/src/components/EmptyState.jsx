import React from 'react';

const illustrations = {
  tasks: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-accent-blue/30 dark:text-accent-blue/20">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.15" />
      <rect x="38" y="32" width="44" height="56" rx="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="46" x2="72" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="58" x2="66" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="48" y1="70" x2="58" y2="70" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="16" fill="var(--bg-card)" stroke="var(--accent-green-solid)" strokeWidth="2.5" />
      <path d="M55 60L58.5 63.5L65 56.5" stroke="var(--accent-green-solid)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-accent-purple/30 dark:text-accent-purple/20">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.15" />
      <rect x="35" y="35" width="50" height="50" rx="8" stroke="currentColor" strokeWidth="2.5" />
      <line x1="35" y1="49" x2="85" y2="49" stroke="currentColor" strokeWidth="2.5" />
      <line x1="50" y1="28" x2="50" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="70" y1="28" x2="70" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="67" r="10" fill="currentColor" opacity="0.2" />
      <path d="M57 67L59 69L63 65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  chat: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-accent-blue/30 dark:text-accent-blue/20">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.15" />
      <path d="M35 80V42C35 38.6863 37.6863 36 41 36H79C82.3137 36 85 38.6863 85 42V70C85 73.3137 82.3137 76 79 76H47.5L35 88V80Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkles */}
      <path d="M60 48C60 52 62 54 66 54C62 54 60 56 60 60C60 56 58 54 54 54C58 54 60 52 60 48Z" fill="var(--accent-blue-solid)" />
      <path d="M72 60C72 62 73 63 75 63C73 63 72 64 72 66C72 64 71 63 69 63C71 63 72 62 72 60Z" fill="var(--accent-purple-solid)" />
    </svg>
  ),
  default: (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="text-text-tertiary/30">
      <circle cx="60" cy="60" r="50" fill="currentColor" opacity="0.15" />
      <circle cx="60" cy="55" r="16" stroke="currentColor" strokeWidth="2.5" />
      <path d="M40 85C40 73.9543 48.9543 65 60 65C71.0457 65 80 73.9543 80 85" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
};

export default function EmptyState({
  type = 'default',
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  actionText = '',
  onAction = null,
  secondaryActionText = '',
  onSecondaryAction = null,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-14 bg-card border border-border/60 rounded-2xl shadow-sm max-w-md mx-auto animate-fade-in my-6">
      <div className="mb-5 flex justify-center">
        {illustrations[type] || illustrations.default}
      </div>
      <h3 className="text-base font-bold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-xs text-text-secondary max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      
      {(actionText || secondaryActionText) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {secondaryActionText && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="fp-btn fp-btn-secondary w-full sm:w-auto"
            >
              {secondaryActionText}
            </button>
          )}
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="fp-btn fp-btn-primary w-full sm:w-auto shadow-sm"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
